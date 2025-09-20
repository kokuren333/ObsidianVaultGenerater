
import React, { useEffect, useRef } from 'react';
import type { Progress, GenerationStatus } from '../types';

interface LogPanelProps {
    logs: string[];
    progress: Progress;
    status: GenerationStatus;
}

export const LogPanel: React.FC<LogPanelProps> = ({ logs, progress, status }) => {
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
    
    let statusText = "Idle";
    let statusColor = "text-gray-400";
    if (status === 'running') {
        statusText = `Running... ${progress.current} / ${progress.total}`;
        statusColor = "text-yellow-400";
    } else if (status === 'finished') {
        statusText = `Finished! Generated ${progress.current} articles.`;
        statusColor = "text-green-400";
    } else if (status === 'stopped') {
        statusText = `Stopped. Generated ${progress.current} articles.`;
        statusColor = "text-red-400";
    } else if (status === 'error') {
        statusText = `Error! Check logs for details.`;
        statusColor = "text-red-500";
    }


    return (
        <div className="flex flex-col gap-2 mt-4 flex-grow">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-indigo-400">Progress & Logs</h3>
                <span className={`text-sm font-medium ${statusColor}`}>{statusText}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${percentage}%` }}>
                </div>
            </div>
            <div ref={logContainerRef} className="bg-black/50 p-3 rounded-md text-sm text-gray-300 font-mono overflow-y-auto h-48 flex-grow">
                {logs.map((log, index) => (
                    <div key={index} className="whitespace-pre-wrap break-words">{`> ${log}`}</div>
                ))}
            </div>
        </div>
    );
};
