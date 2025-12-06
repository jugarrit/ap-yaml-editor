import React from 'react';
import { ParsedOption } from '../utils/yamlParser';
import { OptionEditor } from './OptionEditor';

interface GameSectionProps {
  gameName: string;
  options: ParsedOption[];
  onChange: (index: number, value: any) => void;
  onRemoveGame: () => void;
}

export const GameSection: React.FC<GameSectionProps> = ({
  gameName,
  options,
  onChange,
  onRemoveGame,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  
  return (
    <div className="game-section">
      <div className="game-header">
        <button
          className="expand-button"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
        <h3 className="game-title">{gameName}</h3>
        <button
          className="btn-remove-game"
          onClick={onRemoveGame}
          title="Remove game section"
        >
          Remove Game
        </button>
      </div>
      
      {isExpanded && (
        <div className="game-options">
          {options.length === 0 ? (
            <p className="no-options">No options configured for this game</p>
          ) : (
            options.map((option, index) => (
              <OptionEditor
                key={option.key}
                option={option}
                onChange={(value) => onChange(index, value)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
