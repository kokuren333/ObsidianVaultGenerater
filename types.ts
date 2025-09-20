
export interface Settings {
    modelName: string;
    initialTopics: string;
    mode: 'single' | 'moc';
    mocTitle: string;
    childCount: number;
    maxDepth: number;
    modelOnly: boolean;
    parallelMode: boolean;
    parallelWorkers: number;
    maxArticles: number;
    extraPrompt: string;
}

export interface VaultFile {
    path: string;
    content: string;
}

export type GenerationStatus = 'idle' | 'running' | 'stopped' | 'finished' | 'error';

export interface Progress {
    current: number;
    total: number;
}

export interface Topic {
    theme: string;
    level: number;
    parentContext: string;
}
