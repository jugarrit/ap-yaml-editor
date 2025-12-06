import React from 'react';
import { ParsedOption } from '../utils/yamlParser';

interface StringEditorProps {
  option: ParsedOption;
  onChange: (value: string) => void;
}

export const StringEditor: React.FC<StringEditorProps> = ({ option, onChange }) => {
  return (
    <div className="option-editor">
      <label className="option-label">{option.key}</label>
      <input
        type="text"
        value={option.value as string}
        onChange={(e) => onChange(e.target.value)}
        className="option-input"
        placeholder={`Enter ${option.key}`}
      />
    </div>
  );
};

interface NumberEditorProps {
  option: ParsedOption;
  onChange: (value: number) => void;
}

export const NumberEditor: React.FC<NumberEditorProps> = ({ option, onChange }) => {
  return (
    <div className="option-editor">
      <label className="option-label">{option.key}</label>
      <input
        type="number"
        value={option.value as number}
        onChange={(e) => onChange(Number(e.target.value))}
        className="option-input"
        placeholder={`Enter ${option.key}`}
      />
    </div>
  );
};

interface BooleanEditorProps {
  option: ParsedOption;
  onChange: (value: boolean) => void;
}

export const BooleanEditor: React.FC<BooleanEditorProps> = ({ option, onChange }) => {
  return (
    <div className="option-editor">
      <label className="option-label">
        <input
          type="checkbox"
          checked={option.value as boolean}
          onChange={(e) => onChange(e.target.checked)}
          className="option-checkbox"
        />
        {option.key}
      </label>
    </div>
  );
};

interface ArrayEditorProps {
  option: ParsedOption;
  onChange: (value: any[]) => void;
}

export const ArrayEditor: React.FC<ArrayEditorProps> = ({ option, onChange }) => {
  const arr = option.value as any[];
  
  const handleAddItem = () => {
    onChange([...arr, '']);
  };
  
  const handleRemoveItem = (index: number) => {
    onChange(arr.filter((_, i) => i !== index));
  };
  
  const handleItemChange = (index: number, value: string) => {
    const newArr = [...arr];
    newArr[index] = value;
    onChange(newArr);
  };
  
  return (
    <div className="option-editor">
      <label className="option-label">{option.key}</label>
      <div className="array-editor">
        {arr.map((item, index) => (
          <div key={index} className="array-item">
            <input
              type="text"
              value={item}
              onChange={(e) => handleItemChange(index, e.target.value)}
              className="option-input"
              placeholder="Item value"
            />
            <button
              onClick={() => handleRemoveItem(index)}
              className="btn-remove"
              title="Remove item"
            >
              ×
            </button>
          </div>
        ))}
        <button onClick={handleAddItem} className="btn-add">
          + Add Item
        </button>
      </div>
    </div>
  );
};

interface WeightedEditorProps {
  option: ParsedOption;
  onChange: (value: { [key: string]: number }) => void;
}

export const WeightedEditor: React.FC<WeightedEditorProps> = ({ option, onChange }) => {
  const weighted = option.value as { [key: string]: number };
  
  const handleAddOption = () => {
    onChange({ ...weighted, 'new_option': 1 });
  };
  
  const handleRemoveOption = (key: string) => {
    const newWeighted = { ...weighted };
    delete newWeighted[key];
    onChange(newWeighted);
  };
  
  const handleKeyChange = (oldKey: string, newKey: string) => {
    const newWeighted: { [key: string]: number } = {};
    for (const k in weighted) {
      if (k === oldKey) {
        newWeighted[newKey] = weighted[k];
      } else {
        newWeighted[k] = weighted[k];
      }
    }
    onChange(newWeighted);
  };
  
  const handleWeightChange = (key: string, weight: number) => {
    onChange({ ...weighted, [key]: weight });
  };
  
  return (
    <div className="option-editor">
      <label className="option-label">{option.key} (Weighted Options)</label>
      <div className="weighted-editor">
        {Object.entries(weighted).map(([key, weight]) => (
          <div key={key} className="weighted-item">
            <input
              type="text"
              value={key}
              onChange={(e) => handleKeyChange(key, e.target.value)}
              className="option-input weighted-key"
              placeholder="Option name"
            />
            <input
              type="number"
              value={weight}
              onChange={(e) => handleWeightChange(key, Number(e.target.value))}
              className="option-input weighted-value"
              min="0"
              placeholder="Weight"
            />
            <button
              onClick={() => handleRemoveOption(key)}
              className="btn-remove"
              title="Remove option"
            >
              ×
            </button>
          </div>
        ))}
        <button onClick={handleAddOption} className="btn-add">
          + Add Option
        </button>
      </div>
    </div>
  );
};

interface ObjectEditorProps {
  option: ParsedOption;
  onChange: (value: any) => void;
}

export const ObjectEditor: React.FC<ObjectEditorProps> = ({ option, onChange }) => {
  const obj = option.value as any;
  
  return (
    <div className="option-editor">
      <label className="option-label">{option.key} (Complex Object)</label>
      <textarea
        value={JSON.stringify(obj, null, 2)}
        onChange={(e) => {
          try {
            onChange(JSON.parse(e.target.value));
          } catch (error) {
            // Invalid JSON, don't update
          }
        }}
        className="option-textarea"
        rows={6}
        placeholder="Edit as JSON"
      />
    </div>
  );
};
