import yaml from 'js-yaml';

export type OptionValue = string | number | boolean | OptionValue[] | { [key: string]: number };

export interface ParsedOption {
  key: string;
  value: OptionValue;
  type: 'string' | 'number' | 'boolean' | 'array' | 'weighted' | 'object';
  originalValue?: any;
}

export interface ParsedTemplate {
  rootOptions: ParsedOption[];
  gameOptions: {
    [gameName: string]: ParsedOption[];
  };
  raw: any;
}

/**
 * Determines the type of an option value
 */
function determineType(value: any): ParsedOption['type'] {
  if (Array.isArray(value)) {
    return 'array';
  }
  if (typeof value === 'object' && value !== null) {
    // Check if it's a weighted option (all values are numbers)
    const values = Object.values(value);
    if (values.every(v => typeof v === 'number')) {
      return 'weighted';
    }
    return 'object';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (typeof value === 'number') {
    return 'number';
  }
  return 'string';
}

/**
 * Parse a YAML template file and extract its structure
 */
export function parseYamlTemplate(yamlContent: string): ParsedTemplate {
  const parsed = yaml.load(yamlContent) as any;
  
  const rootKeys = ['description', 'name', 'game', 'requires'];
  const rootOptions: ParsedOption[] = [];
  const gameOptions: { [gameName: string]: ParsedOption[] } = {};
  
  // Extract root options
  for (const key of rootKeys) {
    if (parsed[key] !== undefined) {
      rootOptions.push({
        key,
        value: parsed[key],
        type: determineType(parsed[key]),
        originalValue: parsed[key]
      });
    }
  }
  
  // Extract game-specific options
  for (const key in parsed) {
    if (!rootKeys.includes(key)) {
      const gameSettings = parsed[key];
      if (typeof gameSettings === 'object' && gameSettings !== null) {
        gameOptions[key] = Object.keys(gameSettings).map(settingKey => ({
          key: settingKey,
          value: gameSettings[settingKey],
          type: determineType(gameSettings[settingKey]),
          originalValue: gameSettings[settingKey]
        }));
      }
    }
  }
  
  return { rootOptions, gameOptions, raw: parsed };
}

/**
 * Convert edited options back to YAML format
 */
export function exportToYaml(
  rootOptions: ParsedOption[],
  gameOptions: { [gameName: string]: ParsedOption[] }
): string {
  const result: any = {};
  
  // Add root options
  for (const option of rootOptions) {
    result[option.key] = option.value;
  }
  
  // Add game options
  for (const gameName in gameOptions) {
    result[gameName] = {};
    for (const option of gameOptions[gameName]) {
      result[gameName][option.key] = option.value;
    }
  }
  
  return yaml.dump(result, {
    indent: 2,
    lineWidth: -1,
    noRefs: true
  });
}

/**
 * Validate YAML syntax
 */
export function validateYaml(yamlContent: string): { valid: boolean; error?: string } {
  try {
    yaml.load(yamlContent);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate a default template YAML
 */
export function generateDefaultTemplate(): string {
  return `description: My Archipelago Configuration
name: Player1
game:
  A Link to the Past: 1

A Link to the Past:
  accessibility: full
  progression_balancing: 50
`;
}
