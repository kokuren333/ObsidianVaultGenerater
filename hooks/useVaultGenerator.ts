
import { useState, useCallback, useRef } from 'react';
import type { Settings, GenerationStatus, Progress, Topic } from '../types';
import { generateArticle, sanitizeFilename } from '../services/geminiService';

const estimateTotal = (n0: number, b: number, depth: number): number => {
    depth = Math.max(0, depth);
    n0 = Math.max(0, n0);
    b = Math.max(0, b);
    if (n0 === 0) return 0;
    if (b === 0) return n0;
    if (b === 1) return n0 * (depth + 1);
    return n0 * ((b ** (depth + 1) - 1) / (b - 1));
};

export const useVaultGenerator = () => {
    const [status, setStatus] = useState<GenerationStatus>('idle');
    const [logs, setLogs] = useState<string[]>([]);
    const [vault, setVault] = useState<Map<string, string>>(new Map());
    const [progress, setProgress] = useState<Progress>({ current: 0, total: 0 });

    const stopFlag = useRef(false);
    const generationState = useRef({
        processed: new Set<string>(),
        queue: [] as Topic[],
    });

    const log = useCallback((message: string) => {
        console.log(message);
        setLogs(prev => [...prev, message]);
    }, []);

    const stopGeneration = useCallback(() => {
        if (status === 'running') {
            log('--- Stop request received. Finishing current tasks... ---');
            stopFlag.current = true;
            setStatus('stopped');
        }
    }, [status, log]);

    const startGeneration = useCallback(async (settings: Settings) => {
        // Reset state
        setStatus('running');
        setLogs(['Generation started...']);
        setVault(new Map());
        setProgress({ current: 0, total: 1 });
        stopFlag.current = false;
        generationState.current = { processed: new Set<string>(), queue: [] };

        const {
            initialTopics,
            mode,
            mocTitle,
            childCount,
            maxDepth,
            maxArticles
        } = settings;

        // Setup initial topics and queue
        const topics = mode === 'single' ? [initialTopics] : initialTopics.split(',').map(t => t.trim()).filter(Boolean);
        if (topics.length === 0) {
            log('Error: No initial topics provided.');
            setStatus('error');
            return;
        }

        const initialQueue: Topic[] = topics.map(theme => ({
            theme,
            level: 0,
            parentContext: mode === 'single' ? "This is the root topic of the knowledge vault." : "This is one of the initial topics for a Map of Contents (MOC)."
        }));
        generationState.current.queue.push(...initialQueue);

        // Setup MOC file if needed
        if (mode === 'moc') {
            const mocFilename = `${sanitizeFilename(mocTitle)}.md`;
            const mocContent = `# ${mocTitle}\n\n## Topics\n\n${topics.map(t => `- [[${sanitizeFilename(t)}]]`).join('\n')}`;
            setVault(prev => new Map(prev).set(mocFilename, mocContent));
            log(`Created MOC file: ${mocFilename}`);
        }

        // Estimate total articles and set progress
        const estimated = estimateTotal(topics.length, childCount, maxDepth);
        const plannedTotal = maxArticles > 0 ? Math.min(estimated, maxArticles) : estimated;
        setProgress({ current: 0, total: plannedTotal });
        log(`Planning to generate up to ${plannedTotal} articles.`);

        const processQueue = async () => {
            const activeWorkers = new Set<Promise<void>>();
            const maxWorkers = settings.parallelMode ? settings.parallelWorkers : 1;

            const loop = async (): Promise<void> => {
                while(generationState.current.queue.length > 0 && activeWorkers.size < maxWorkers) {
                    if (stopFlag.current) break;

                    const topic = generationState.current.queue.shift();
                    if (!topic || generationState.current.processed.has(topic.theme)) continue;

                    const currentCount = generationState.current.processed.size;
                    if (maxArticles > 0 && currentCount >= maxArticles) {
                        log('Article generation cap reached.');
                        stopFlag.current = true;
                        break;
                    }
                    
                    generationState.current.processed.add(topic.theme);

                    const workerPromise = (async () => {
                        try {
                            log(`[${currentCount + 1}/${plannedTotal}] (Depth:${topic.level}) Generating: ${topic.theme}`);
                            const result = await generateArticle(topic, settings, Array.from(generationState.current.processed));
                            
                            const filename = sanitizeFilename(topic.theme);
                            let path: string;
                            if (mode === 'single') {
                                path = topic.level > 0 ? `${topic.level}/${filename}.md` : `${filename}.md`;
                            } else {
                                path = `${topic.level}/${filename}.md`;
                            }

                            setVault(prev => new Map(prev).set(path, result.content));
                            setProgress(p => ({ ...p, current: p.current + 1 }));
                            log(`✔ Saved: ${path}`);
                            
                            if (topic.level < maxDepth) {
                                log(`  → Found next topics: ${result.nextThemes.join(', ') || 'None'}`);
                                for (const nextTheme of result.nextThemes) {
                                    if (!generationState.current.processed.has(nextTheme) && !generationState.current.queue.some(q => q.theme === nextTheme)) {
                                       generationState.current.queue.push({
                                           theme: nextTheme,
                                           level: topic.level + 1,
                                           parentContext: result.content.substring(0, 3000)
                                       });
                                    }
                                }
                            }

                        } catch (error) {
                            log(`Error generating "${topic.theme}": ${error instanceof Error ? error.message : String(error)}`);
                        }
                    })();
                    
                    activeWorkers.add(workerPromise);
                    workerPromise.finally(() => {
                        activeWorkers.delete(workerPromise);
                    });
                }

                if (activeWorkers.size > 0) {
                    await Promise.race(Array.from(activeWorkers));
                }

                if (!stopFlag.current && (generationState.current.queue.length > 0 || activeWorkers.size > 0)) {
                    // Use a short timeout to prevent blocking the main thread and allow UI updates.
                    await new Promise(resolve => setTimeout(resolve, 100));
                    await loop();
                }
            };
            await loop();
        };

        await processQueue();

        if (stopFlag.current) {
            log('Generation stopped by user.');
            setStatus('stopped');
        } else {
            log('--- All articles generated successfully! ---');
            setStatus('finished');
        }

    }, [log]);

    return { status, logs, vault, progress, startGeneration, stopGeneration };
};
