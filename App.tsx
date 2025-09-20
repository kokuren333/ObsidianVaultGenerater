
import React, { useState, useCallback } from 'react';
import { SettingsPanel } from './components/SettingsPanel';
import { VaultExplorer } from './components/VaultExplorer';
import { LogPanel } from './components/LogPanel';
import { useVaultGenerator } from './hooks/useVaultGenerator';
import type { Settings } from './types';
import { DownloadIcon, PlayIcon, StopIcon } from './components/Icons';
import { sanitizeFilename } from './services/geminiService';

// This is a placeholder for process.env.API_KEY, which is expected to be set in the environment.
// In a real build environment (like Vite or Create React App), you would use import.meta.env.VITE_API_KEY or process.env.REACT_APP_API_KEY
// For this self-contained example, we'll assume it's available.
declare global {
  interface Window {
    JSZip: any;
  }
  namespace NodeJS {
      interface ProcessEnv {
          API_KEY: string;
      }
  }
}

const App: React.FC = () => {
    const [settings, setSettings] = useState<Settings>({
        modelName: 'gemini-2.5-flash',
        initialTopics: 'Artificial Intelligence',
        mode: 'single',
        mocTitle: 'MOC on AI',
        childCount: 3,
        maxDepth: 3,
        modelOnly: false,
        parallelMode: true,
        parallelWorkers: 4,
        maxArticles: 50,
        extraPrompt: 'Please write in a clear and easily understandable style for beginners.',
    });
    
    const [selectedFile, setSelectedFile] = useState<string | null>(null);

    const { status, logs, vault, progress, startGeneration, stopGeneration } = useVaultGenerator();

    const handleStart = () => {
        if (!process.env.API_KEY) {
            alert("API_KEY environment variable not set. Cannot start generation.");
            return;
        }
        startGeneration(settings);
        setSelectedFile(null);
    };
    
    const handleDownload = useCallback(() => {
        if (vault.size === 0) return;
        
        const zip = new window.JSZip();
        const vaultName = settings.mode === 'moc' ? settings.mocTitle : settings.initialTopics;
        const sanitizedVaultName = sanitizeFilename(vaultName);

        const rootFolder = zip.folder(sanitizedVaultName);

        if (!rootFolder) {
            console.error("Failed to create root folder in zip.");
            return;
        }

        vault.forEach((content, path) => {
            rootFolder.file(path, content);
        });

        zip.generateAsync({ type: 'blob' }).then(content => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `${sanitizedVaultName}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }, [vault, settings]);

    const isRunning = status === 'running';
    const isFinished = status === 'finished' || status === 'stopped';

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col p-4 gap-4">
            <header className="text-center">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
                    Obsidian Vault Deep-Dive Agent
                </h1>
                <p className="text-gray-400 mt-2">Generate interconnected knowledge vaults powered by Gemini.</p>
            </header>

            <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-150px)]">
                {/* Left Panel */}
                <div className="flex flex-col gap-4 overflow-y-auto pr-2 bg-gray-800/50 p-4 rounded-lg shadow-lg">
                    <SettingsPanel settings={settings} setSettings={setSettings} disabled={isRunning} />
                    
                    <div className="flex items-center gap-4 mt-4">
                        <button
                            onClick={handleStart}
                            disabled={isRunning}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
                        >
                            <PlayIcon />
                            {isRunning ? 'Generating...' : 'Start Generation'}
                        </button>
                        <button
                            onClick={stopGeneration}
                            disabled={!isRunning}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-900 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
                        >
                            <StopIcon />
                            Stop
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={isRunning || vault.size === 0}
                             className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-gray-900 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
                        >
                            <DownloadIcon />
                            Download ZIP
                        </button>
                    </div>

                    <LogPanel logs={logs} progress={progress} status={status} />
                </div>

                {/* Right Panel */}
                <div className="flex flex-col bg-gray-800/50 p-4 rounded-lg shadow-lg overflow-hidden">
                    <VaultExplorer vault={vault} selectedFile={selectedFile} onSelectFile={setSelectedFile} />
                </div>
            </main>
        </div>
    );
};

export default App;
