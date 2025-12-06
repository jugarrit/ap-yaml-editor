import React, { useState } from 'react';
import { Upload, Download, FileText, Eye } from 'lucide-react';
import { parseYamlTemplate, exportToYaml, validateYaml, generateDefaultTemplate, ParsedOption } from './utils/yamlParser';
import { GameSection } from './components/GameSection';
import { OptionEditor } from './components/OptionEditor';
import './App.css';

function App() {
  const [rootOptions, setRootOptions] = useState<ParsedOption[]>([]);
  const [gameOptions, setGameOptions] = useState<{ [gameName: string]: ParsedOption[] }>({});
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string>('');
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
        setHasTemplate(true);
        setError('');
      } catch (err) {
        setError(`Error parsing file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadDefault = () => {
    try {
      const defaultTemplate = generateDefaultTemplate();
      const parsed = parseYamlTemplate(defaultTemplate);
      setRootOptions(parsed.rootOptions);
      setGameOptions(parsed.gameOptions);
      setHasTemplate(true);
      setError('');
    } catch (err) {
      setError(`Error loading default template: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleExport = () => {
    try {
      const yamlContent = exportToYaml(rootOptions, gameOptions);
      const blob = new Blob([yamlContent], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Try to use the name from rootOptions if available
      const nameOption = rootOptions.find(opt => opt.key === 'name');
      const fileName = nameOption?.value ? `${nameOption.value}.yaml` : 'archipelago-config.yaml';
      
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Error exporting YAML: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
      return exportToYaml(rootOptions, gameOptions);
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
                <label className="btn-primary">
                  <Upload className="icon" />
                  Load Template
                  <input
                    type="file"
                    accept=".yaml,.yml"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
                
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
            </div>
          </div>
        ) : (
          <>
            <div className="toolbar">
              <label className="btn-secondary btn-small">
                <Upload className="icon" />
                Load New Template
                <input
                  type="file"
                  accept=".yaml,.yml"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
              
              <button
                className="btn-secondary btn-small"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="icon" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
              
              <button className="btn-primary btn-small" onClick={handleExport}>
                <Download className="icon" />
                Export YAML
              </button>
            </div>

            {error && (
              <div className="error">
                {error}
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
