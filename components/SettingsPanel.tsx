
import React from 'react';
import type { Settings } from '../types';

interface SettingsPanelProps {
    settings: Settings;
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;
    disabled: boolean;
}

const inputBaseClasses = "block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white p-2 disabled:opacity-50";
const labelBaseClasses = "block text-sm font-medium text-gray-300";

const FormRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">{children}</div>
);

const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className={`${labelBaseClasses} md:col-span-1`}>{children}</label>
);

const InputContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="md:col-span-2">{children}</div>
);

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, setSettings, disabled }) => {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setSettings(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'number') {
            setSettings(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
        } else {
            setSettings(prev => ({ ...prev, [name]: value }));
        }
    };
    
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-indigo-400 border-b border-gray-700 pb-2">Configuration</h2>
            
            <FormRow>
                <Label htmlFor="mode">Generation Mode</Label>
                <InputContainer>
                    <div className="flex gap-4 p-1 bg-gray-700 rounded-md">
                        <button onClick={() => setSettings(s => ({...s, mode: 'single'}))} disabled={disabled} className={`flex-1 py-1 rounded ${settings.mode === 'single' ? 'bg-indigo-600' : 'bg-gray-600 hover:bg-gray-500'} transition`}>Single Topic</button>
                        <button onClick={() => setSettings(s => ({...s, mode: 'moc'}))} disabled={disabled} className={`flex-1 py-1 rounded ${settings.mode === 'moc' ? 'bg-indigo-600' : 'bg-gray-600 hover:bg-gray-500'} transition`}>MOC</button>
                    </div>
                </InputContainer>
            </FormRow>

            <FormRow>
                <Label htmlFor="initialTopics">Initial Topic(s)</Label>
                <InputContainer>
                     <input type="text" name="initialTopics" id="initialTopics" value={settings.initialTopics} onChange={handleChange} disabled={disabled} className={inputBaseClasses} placeholder={settings.mode === 'single' ? 'e.g., Quantum Physics' : 'e.g., History,Science,Art'} />
                </InputContainer>
            </FormRow>

            {settings.mode === 'moc' && (
                <FormRow>
                    <Label htmlFor="mocTitle">MOC Title</Label>
                    <InputContainer>
                        <input type="text" name="mocTitle" id="mocTitle" value={settings.mocTitle} onChange={handleChange} disabled={disabled} className={inputBaseClasses} />
                    </InputContainer>
                </FormRow>
            )}

            <FormRow>
                <Label htmlFor="childCount">Derived Notes / Article</Label>
                <InputContainer>
                    <input type="number" name="childCount" id="childCount" value={settings.childCount} onChange={handleChange} disabled={disabled} className={inputBaseClasses} min="0" max="10"/>
                </InputContainer>
            </FormRow>
            
            <FormRow>
                <Label htmlFor="maxDepth">Max Derivation Depth</Label>
                <InputContainer>
                    <input type="number" name="maxDepth" id="maxDepth" value={settings.maxDepth} onChange={handleChange} disabled={disabled} className={inputBaseClasses} min="0" max="10"/>
                </InputContainer>
            </FormRow>
            
            <FormRow>
                <Label htmlFor="maxArticles">Article Safety Cap</Label>
                <InputContainer>
                    <input type="number" name="maxArticles" id="maxArticles" value={settings.maxArticles} onChange={handleChange} disabled={disabled} className={inputBaseClasses} min="0" max="1000"/>
                </InputContainer>
            </FormRow>

            <FormRow>
                <Label htmlFor="extraPrompt">Additional Prompt</Label>
                <InputContainer>
                    <textarea name="extraPrompt" id="extraPrompt" value={settings.extraPrompt} onChange={handleChange} disabled={disabled} className={inputBaseClasses} rows={3} />
                </InputContainer>
            </FormRow>
            
            <FormRow>
                <Label htmlFor="parallelMode">Advanced Options</Label>
                <InputContainer>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" name="modelOnly" id="modelOnly" checked={settings.modelOnly} onChange={handleChange} disabled={disabled} className="h-4 w-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"/>
                            <label htmlFor="modelOnly" className={labelBaseClasses}>Web Search Disabled</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" name="parallelMode" id="parallelMode" checked={settings.parallelMode} onChange={handleChange} disabled={disabled} className="h-4 w-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"/>
                             <label htmlFor="parallelMode" className={labelBaseClasses}>Parallel Generation</label>
                        </div>
                    </div>
                </InputContainer>
            </FormRow>

            {settings.parallelMode && (
                <FormRow>
                    <Label htmlFor="parallelWorkers">Parallel Workers</Label>
                    <InputContainer>
                        <input type="number" name="parallelWorkers" id="parallelWorkers" value={settings.parallelWorkers} onChange={handleChange} disabled={disabled} className={inputBaseClasses} min="1" max="16"/>
                    </InputContainer>
                </FormRow>
            )}
        </div>
    );
};
