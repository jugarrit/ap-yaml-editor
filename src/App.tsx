import React, { useState } from 'react';
import { Upload, Download, FileText, Eye, Save } from 'lucide-react';
import { parseYamlTemplate, exportToYaml, validateYaml, generateDefaultTemplate, ParsedOption } from './utils/yamlParser';
import { Document } from 'yaml';
import { GameSection } from './components/GameSection';
import { OptionEditor } from './components/OptionEditor';
import './App.css';

function App() {
  const [rootOptions, setRootOptions] = useState<ParsedOption[]>([]);
  const [gameOptions, setGameOptions] = useState<{ [gameName: string]: ParsedOption[] }>({});
  const [originalDocument, setOriginalDocument] = useState<Document | undefined>(undefined);
  const [originalFile, setOriginalFile] = useState<File | undefined>(undefined);
  const [fileHandle, setFileHandle] = useState<any>(undefined);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [simpleMode, setSimpleMode] = useState(false);
  const [hasTemplate, setHasTemplate] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const validation = validateYaml(content);
        
        if (!validation.valid) {
          setError(`Invalid YAML: ${validation.error}`);
          return;
        }

        const parsed = parseYamlTemplate(content);
        setRootOptions(parsed.rootOptions);
        setGameOptions(parsed.gameOptions);
        setOriginalDocument(parsed.document);
        setOriginalFile(file);
        setHasTemplate(true);
        setError('');
      } catch (err) {
        setError(`Error parsing file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadFile = async () => {
    try {
      if (!('showOpenFilePicker' in window)) {
        setError('File System Access API not supported. Please use a modern browser like Chrome or Edge.');
        return;
      }

      const [handle] = await (window as any).showOpenFilePicker({
        types: [{
          description: 'YAML Files',
          accept: { 'text/yaml': ['.yaml', '.yml'] },
        }],
        multiple: false,
      });

      const file = await handle.getFile();
      const content = await file.text();
      
      const validation = validateYaml(content);
      if (!validation.valid) {
        setError(`Invalid YAML: ${validation.error}`);
        return;
      }

      const parsed = parseYamlTemplate(content);
      setRootOptions(parsed.rootOptions);
      setGameOptions(parsed.gameOptions);
      setOriginalDocument(parsed.document);
      setOriginalFile(file);
      setFileHandle(handle);
      setHasTemplate(true);
      setError('');
      setSuccess('');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // User cancelled
      }
      setError(`Error loading file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleLoadDefault = () => {
    try {
      const defaultTemplate = generateDefaultTemplate();
      const parsed = parseYamlTemplate(defaultTemplate);
      setRootOptions(parsed.rootOptions);
      setGameOptions(parsed.gameOptions);
      setOriginalDocument(parsed.document);
      setOriginalFile(undefined);
      setFileHandle(undefined);
      setHasTemplate(true);
      setError('');
      setSuccess('');
    } catch (err) {
      setError(`Error loading default template: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleSave = async () => {
    try {
      const yamlContent = exportToYaml(rootOptions, gameOptions, originalDocument);
      
      if (!fileHandle) {
        setError('No file handle available. The file was not loaded with File System Access API. Try using "Save As" instead or reload the file using the file picker.');
        return;
      }

      try {
        const writable = await fileHandle.createWritable();
        await writable.write(yamlContent);
        await writable.close();
        setError('');
        setSuccess('File saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (e: any) {
        if (e.name === 'NotAllowedError') {
          setError('Permission denied. The file may be in a protected folder. Use "Save As" to save to a different location.');
        } else {
          setError(`Could not save file: ${e.message || 'Unknown error'}`);
        }
      }
    } catch (err) {
      setError(`Error saving YAML: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleSaveAs = async () => {
    try {
      const yamlContent = exportToYaml(rootOptions, gameOptions, originalDocument);
      
      // Try to use the name from rootOptions if available
      const nameOption = rootOptions.find(opt => opt.key === 'name');
      const suggestedName = nameOption?.value ? `${nameOption.value}.yaml` : (originalFile?.name || 'archipelago-config.yaml');
      
      if (!('showSaveFilePicker' in window)) {
        setError('File System Access API not supported. Please use a modern browser like Chrome or Edge.');
        return;
      }

      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName,
          types: [{
            description: 'YAML Files',
            accept: { 'text/yaml': ['.yaml', '.yml'] },
          }],
        });
        
        const writable = await handle.createWritable();
        await writable.write(yamlContent);
        await writable.close();
        
        // Update the file handle for future saves
        setFileHandle(handle);
        setOriginalFile(new File([yamlContent], suggestedName, { type: 'text/yaml' }));
        
        setError('');
        setSuccess('File saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (e: any) {
        if (e.name === 'AbortError') {
          return; // User cancelled
        }
        if (e.name === 'NotAllowedError') {
          setError('Permission denied. Try saving to a different location.');
        } else {
          setError(`Could not save file: ${e.message || 'Unknown error'}`);
        }
      }
    } catch (err) {
      setError(`Error saving YAML: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const updateRootOption = (index: number, value: any) => {
    const newRootOptions = [...rootOptions];
    newRootOptions[index] = { ...newRootOptions[index], value };
    setRootOptions(newRootOptions);
  };

  const updateGameOption = (gameName: string, index: number, value: any) => {
    const newGameOptions = { ...gameOptions };
    newGameOptions[gameName] = [...newGameOptions[gameName]];
    newGameOptions[gameName][index] = { ...newGameOptions[gameName][index], value };
    setGameOptions(newGameOptions);
  };

  const removeGame = (gameName: string) => {
    const newGameOptions = { ...gameOptions };
    delete newGameOptions[gameName];
    setGameOptions(newGameOptions);
  };

  const getPreviewContent = () => {
    try {
      return exportToYaml(rootOptions, gameOptions, originalDocument);
    } catch (err) {
      return `Error generating preview: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="title">
            <FileText className="icon" />
            Archipelago YAML Editor
          </h1>
          <p className="subtitle">Generic YAML configuration editor for Archipelago multiworld randomizer</p>
        </div>
      </header>

      <main className="main">
        {!hasTemplate ? (
          <div className="welcome">
            <div className="welcome-content">
              <h2>Get Started</h2>
              <p>Load a YAML template file to begin editing your Archipelago configuration</p>
              
              <div className="welcome-actions">
                <button className="btn-primary" onClick={handleLoadFile}>
                  <Upload className="icon" />
                  Load Template
                </button>
                
                <button className="btn-secondary" onClick={handleLoadDefault}>
                  <FileText className="icon" />
                  Load Default Template
                </button>
              </div>

              {error && (
                <div className="error">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="success">
                  {success}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="toolbar">
              <button className="btn-secondary btn-small" onClick={handleLoadFile}>
                <Upload className="icon" />
                Load New Template
              </button>
              
              <button
                className="btn-secondary btn-small"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="icon" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
              
              <label className="toggle-container">
                <input
                  type="checkbox"
                  checked={simpleMode}
                  onChange={(e) => setSimpleMode(e.target.checked)}
                  className="toggle-checkbox"
                />
                <span className="toggle-label">Simple Mode</span>
              </label>
              
              <button className="btn-primary btn-small" onClick={handleSave}>
                <Save className="icon" />
                Save
              </button>
              
              <button className="btn-secondary btn-small" onClick={handleSaveAs}>
                <Download className="icon" />
                Save As
              </button>
            </div>

            {error && (
              <div className="error">
                {error}
              </div>
            )}
            
            {success && (
              <div className="success">
                {success}
              </div>
            )}

            <div className="editor-layout">
              <div className="editor-panel">
                <section className="section">
                  <h2 className="section-title">Root Options</h2>
                  <div className="options-grid">
                    {rootOptions.map((option, index) => (
                      <OptionEditor
                        key={option.key}
                        option={option}
                        simpleMode={simpleMode}
                        onChange={(value) => updateRootOption(index, value)}
                      />
                    ))}
                  </div>
                </section>

                <section className="section">
                  <h2 className="section-title">Game Options</h2>
                  {Object.keys(gameOptions).length === 0 ? (
                    <p className="no-games">No games configured in the template</p>
                  ) : (
                    Object.entries(gameOptions).map(([gameName, options]) => (
                      <GameSection
                        key={gameName}
                        gameName={gameName}
                        options={options}
                        simpleMode={simpleMode}
                        onChange={(index, value) => updateGameOption(gameName, index, value)}
                        onRemoveGame={() => removeGame(gameName)}
                      />
                    ))
                  )}
                </section>
              </div>

              {showPreview && (
                <div className="preview-panel">
                  <h3 className="preview-title">YAML Preview</h3>
                  <pre className="preview-content">
                    <code>{getPreviewContent()}</code>
                  </pre>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
