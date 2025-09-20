import React, { useMemo } from 'react';

interface VaultExplorerProps {
    vault: Map<string, string>;
    selectedFile: string | null;
    onSelectFile: (path: string | null) => void;
}

// Add this for TypeScript to recognize window.marked
declare global {
    interface Window {
        marked: any;
    }
}

const MarkdownViewer: React.FC<{ content: string }> = ({ content }) => {
    const htmlContent = useMemo(() => {
        if (window.marked) {
            return window.marked.parse(content || '');
        }
        return '<p class="text-red-400">Markdown renderer (marked.js) not loaded.</p>';
    }, [content]);

    return (
        <div className="bg-gray-900 p-4 rounded-lg flex-grow overflow-y-auto min-h-0">
            <div
                className="prose-styles"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
            {/* Basic styling for rendered markdown to match the dark theme */}
            <style>{`
                .prose-styles h1, .prose-styles h2, .prose-styles h3, .prose-styles h4, .prose-styles h5, .prose-styles h6 {
                    color: #e5e7eb;
                    margin-bottom: 0.5em;
                    margin-top: 1em;
                    font-weight: 600;
                }
                .prose-styles h1 { font-size: 1.875rem; border-bottom: 1px solid #4b5563; padding-bottom: 0.3em; color: #c7d2fe; }
                .prose-styles h2 { font-size: 1.5rem; border-bottom: 1px solid #4b5563; padding-bottom: 0.3em; color: #a5b4fc; }
                .prose-styles h3 { font-size: 1.25rem; }
                .prose-styles p { line-height: 1.6; margin-bottom: 1em; color: #d1d5db; }
                .prose-styles ul, .prose-styles ol { margin-left: 1.5rem; margin-bottom: 1em; }
                .prose-styles li { margin-bottom: 0.25em; }
                .prose-styles a { color: #818cf8; text-decoration: underline; }
                .prose-styles a:hover { color: #a5b4fc; }
                .prose-styles code {
                    background-color: #374151;
                    padding: 0.2em 0.4em;
                    margin: 0;
                    font-size: 85%;
                    border-radius: 6px;
                    color: #f3f4f6;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                }
                .prose-styles pre {
                    background-color: #1f2937;
                    padding: 1em;
                    border-radius: 8px;
                    overflow-x: auto;
                    color: #d1d5db;
                }
                .prose-styles pre code {
                    background-color: transparent;
                    padding: 0;
                }
            `}</style>
        </div>
    );
};

export const VaultExplorer: React.FC<VaultExplorerProps> = ({ vault, selectedFile, onSelectFile }) => {
    const filePaths = Array.from(vault.keys()).sort();
    const selectedContent = selectedFile ? vault.get(selectedFile) : null;

    return (
        <div className="flex flex-col md:flex-row gap-4 h-full">
            <div className="w-full md:w-1/3 flex flex-col min-h-0">
                <h2 className="text-lg font-semibold text-indigo-400 mb-2 p-2 border-b border-gray-700 flex-shrink-0">Vault Contents ({filePaths.length})</h2>
                <div className="overflow-y-auto flex-grow bg-gray-900 p-2 rounded-lg">
                    {filePaths.length === 0 ? (
                        <div className="text-center text-gray-500 p-4">Waiting for generation...</div>
                    ) : (
                        <ul>
                            {filePaths.map(path => (
                                <li key={path}>
                                    <button
                                        onClick={() => onSelectFile(path)}
                                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                                            selectedFile === path
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-gray-300 hover:bg-gray-700'
                                        }`}
                                    >
                                        {path}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            <div className="w-full md:w-2/3 flex flex-col min-h-0">
                 <h2 className="text-lg font-semibold text-indigo-400 mb-2 p-2 border-b border-gray-700 flex-shrink-0">Article Preview</h2>
                 {selectedContent !== null && selectedContent !== undefined ? (
                    <MarkdownViewer content={selectedContent} />
                ) : (
                    <div className="flex items-center justify-center h-full bg-gray-900 rounded-lg flex-grow">
                        <p className="text-gray-500">
                            {filePaths.length > 0 ? 'Select a file to view its content' : 'No articles generated yet'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};