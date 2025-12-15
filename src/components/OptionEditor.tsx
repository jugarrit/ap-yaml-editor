import React from 'react';
import { ParsedOption } from '../utils/yamlParser';
import {
  StringEditor,
  NumberEditor,
  BooleanEditor,
  ArrayEditor,
  WeightedEditor,
  ObjectEditor,
} from './OptionEditors';

interface OptionEditorProps {
  option: ParsedOption;
  simpleMode?: boolean;
  onChange: (value: any) => void;
}

export const OptionEditor: React.FC<OptionEditorProps> = ({ option, simpleMode = false, onChange }) => {
  switch (option.type) {
    case 'string':
      return <StringEditor option={option} onChange={onChange} />;
    case 'number':
      return <NumberEditor option={option} onChange={onChange} />;
    case 'boolean':
      return <BooleanEditor option={option} onChange={onChange} />;
    case 'array':
      return <ArrayEditor option={option} onChange={onChange} />;
    case 'weighted':
      return <WeightedEditor option={option} simpleMode={simpleMode} onChange={onChange} />;
    case 'object':
      return <ObjectEditor option={option} onChange={onChange} />;
    default:
      return null;
  }
};
