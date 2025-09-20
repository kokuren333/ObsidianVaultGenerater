import { GoogleGenAI } from "@google/genai";
import type { Settings, Topic } from '../types';

let ai: GoogleGenAI | null = null;

const getAI = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set.");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};

export const sanitizeFilename = (name: string): string => {
    return name.replace(/[\\/*?:"<>|\[\]]/g, '_');
};

const extractNextThemes = (content: string, limit: number): string[] => {
    const sectionRegex = /##\s*次に学ぶべき概念\s*([\s\S]*?)(?:\n##|$)/i;
    const sectionMatch = content.match(sectionRegex);
    if (!sectionMatch) return [];

    const linksRegex = /\[\[([^\[\]]+)\]\]/g;
    const links = [];
    let match;
    while ((match = linksRegex.exec(sectionMatch[1])) !== null) {
        const theme = match[1].trim();
        if (theme && !links.includes(theme)) {
            links.push(theme);
        }
    }
    return links.slice(0, limit);
};

const fixWikilinks = (md: string): string => {
    let fixedMd = md;
    // `[[...]]` -> [[...]]
    fixedMd = fixedMd.replace(/`+\s*\[\[([^\[\]]+)\]\]\s*`+/g, '[[$1]]');
    // "[[...]]" -> [[...]]
    fixedMd = fixedMd.replace(/["“”'「」]+(\s*\[\[[^\[\]]+\]\]\s*)["“”'「」]+/g, (m, g1) => g1.trim());
    // - [[...]]. -> - [[...]]
    fixedMd = fixedMd.replace(/^( *[-*]\s*\[\[[^\[\]]+\]\])\s*[。、．.,]+$/gm, '$1');
    return fixedMd;
};

export const generateArticle = async (
    topic: Topic,
    settings: Settings,
    generatedList: string[]
): Promise<{ content: string; nextThemes: string[] }> => {
    const { theme, parentContext } = topic;
    const { modelOnly, childCount, extraPrompt, modelName } = settings;

    const moreClause = `Please suggest exactly ${childCount} concepts.`;
    const avoidList = generatedList.length > 0 ? generatedList.join(', ') : '(none)';
    
    const noWebPrompt = `
You are a professional AI writer. Your task is to write a Markdown article on the theme "{theme}" using only your own knowledge.

Use the provided parent article context to maintain continuity and avoid repetition, but **DO NOT include the "Parent Article Context" section in your output.**

Your final output must start with the main title (\`# {theme}\`) and strictly follow the headings and order provided below.

### Parent Article Context
---
${parentContext.substring(0, 2000)}
---

### Additional Instructions
---
${extraPrompt}
---

# {theme}

## Summary: {theme}
Provide a concise 2-3 sentence summary.

## Explanation: {theme}
- Explain the topic systematically and professionally.
- Include key definitions, metrics, procedures, formulas, and examples.
- Use Markdown for formatting.

## 次に学ぶべき概念
- To deepen the understanding of this topic, propose more fundamental and specific concepts.
- **Output only a bulleted list with one item per line. Strictly use the format \`- [[Title]]\`** and do not include any other text.
- Do not use backticks, quotes, bolding, parentheses, or punctuation.
- ${moreClause}
- Avoid topics that have already been generated: ${avoidList}
`;

    const model = getAI().models;

    const noWebResponse = await model.generateContent({
        model: modelName,
        contents: noWebPrompt.replace(/{theme}/g, theme)
    });

    let articleContent = noWebResponse.text;

    if (!modelOnly) {
        const webPrompt = `
あなたはリサーチアシスタントです。あなたのタスクは、Web検索で見つけた情報に基づき、「{theme}」に関する「Web調査」セクションをMarkdownで作成することです。

**重要な要件:**
1.  **引用スタイル:** 本文中の各主張・事実・数値の文末には、必ずObsidian互換のフットノート形式 \`[^1]\`, \`[^2]\` 等を付与してください。複数の情報源が1つの主張を裏付ける場合は \`[^1][^3]\` のように併記します。
2.  **情報源リストの生成:** **要約文の後**に、使用したすべての情報源のリストを必ず作成してください。各リスト項目は \`[^n]: [記事タイトル](URL)\` という厳密な形式で記述する必要があります。
3.  **情報源の利用:** あなた自身の知識は含めず、Web検索ツールから得られた情報のみを使用してください。
4.  **言語:** 要約は、テーマ「{theme}」と同じ言語で記述してください。
5.  **出力フォーマット:** 出力は、要約文から直接開始してください。「Web調査」のようなヘッダーは含めないでください。

**出力フォーマットの例:**
青い空はレイリー散乱と呼ばれる現象によって現れます[^1]。散乱光の強さは波長の4乗に反比例します[^2]。

[^1]: [なぜ空は青いの？ - NASA Space Place](https://spaceplace.nasa.gov/blue-sky/ja/)
[^2]: [レイリー散乱 - Wikipedia](https://ja.wikipedia.org/wiki/レイリー散乱)
`;

        try {
            const webResponse = await model.generateContent({
                model: modelName,
                contents: webPrompt.replace(/{theme}/g, theme),
                config: {
                    tools: [{googleSearch: {}}]
                }
            });

            let webSection = `\n\n## Web Research: ${theme}\n`;
            webSection += webResponse.text;
            
            articleContent += webSection;

        } catch (e) {
            console.warn(`Web search failed for "${theme}", using model knowledge only. Error:`, e);
            articleContent += `\n\n## Web Research: ${theme}\nWeb search could not be completed for this topic.`;
        }
    }
    
    const cleanedContent = fixWikilinks(articleContent);
    const nextThemes = extractNextThemes(cleanedContent, childCount);
    
    return {
        content: cleanedContent,
        nextThemes: nextThemes,
    };
};