import { parseDocument, Document, isMap } from 'yaml';

export type OptionValue = string | number | boolean | OptionValue[] | { [key: string]: number };

export interface ParsedOption {
  key: string;
  value: OptionValue;
  type: 'string' | 'number' | 'boolean' | 'array' | 'weighted' | 'object';
  originalValue?: any;
  comment?: string;
  isFlowStyle?: boolean;
}

export interface ParsedTemplate {
  rootOptions: ParsedOption[];
  gameOptions: {
    [gameName: string]: ParsedOption[];
  };
  raw: any;
  document: Document;
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
  const document = parseDocument(yamlContent);
  const parsed = document.toJSON() as any;
  
  const rootKeys = ['description', 'name', 'game', 'requires'];
  const rootOptions: ParsedOption[] = [];
  const gameOptions: { [gameName: string]: ParsedOption[] } = {};
  
  // Helper function to extract comment from a YAML node
  const getComment = (key: string, parent?: any): string | undefined => {
    if (!document.contents || !isMap(document.contents)) return undefined;
    
    try {
      if (parent) {
        const parentNode = document.contents.get(parent, true);
        if (parentNode && isMap(parentNode)) {
          const node = parentNode.get(key, true);
          if (node && typeof node === 'object' && 'commentBefore' in node) {
            return (node.commentBefore as string)?.trim();
          }
          if (node && typeof node === 'object' && 'comment' in node) {
            return (node.comment as string)?.trim();
          }
        }
      } else {
        const node = document.contents.get(key, true);
        if (node && typeof node === 'object' && 'commentBefore' in node) {
          return (node.commentBefore as string)?.trim();
        }
        if (node && typeof node === 'object' && 'comment' in node) {
          return (node.comment as string)?.trim();
        }
      }
    } catch (e) {
      // Ignore errors when accessing nodes
    }
    return undefined;
  };
  
  // Helper function to check if a node uses flow style (braces)
  const isFlowStyle = (key: string, parent?: any): boolean => {
    if (!document.contents || !isMap(document.contents)) return false;
    
    try {
      if (parent) {
        const parentNode = document.contents.get(parent, true);
        if (parentNode && isMap(parentNode)) {
          const node = parentNode.get(key, true);
          if (node && typeof node === 'object' && 'flow' in node) {
            return node.flow === true;
          }
        }
      } else {
        const node = document.contents.get(key, true);
        if (node && typeof node === 'object' && 'flow' in node) {
          return node.flow === true;
        }
      }
    } catch (e) {
      // Ignore errors when accessing nodes
    }
    return false;
  };
  
  // Extract root options
  for (const key of rootKeys) {
    if (parsed[key] !== undefined) {
      rootOptions.push({
        key,
        value: parsed[key],
        type: determineType(parsed[key]),
        originalValue: parsed[key],
        comment: getComment(key),
        isFlowStyle: isFlowStyle(key)
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
          originalValue: gameSettings[settingKey],
          comment: getComment(settingKey, key),
          isFlowStyle: isFlowStyle(settingKey, key)
        }));
      }
    }
  }
  
  return { rootOptions, gameOptions, raw: parsed, document };
}

/**
 * Convert edited options back to YAML format
 */
export function exportToYaml(
  rootOptions: ParsedOption[],
  gameOptions: { [gameName: string]: ParsedOption[] },
  originalDocument?: Document
): string {
  // If we have the original document, clone it and update to preserve all comments
  if (originalDocument && originalDocument.contents && isMap(originalDocument.contents)) {
    try {
      // Clone the document by re-parsing its string representation
      const clonedDoc = parseDocument(originalDocument.toString());
      
      if (!clonedDoc.contents || !isMap(clonedDoc.contents)) {
        throw new Error('Invalid document structure');
      }
      
      // Update root options - find the pair and update only the value
      for (const option of rootOptions) {
        const pair = (clonedDoc.contents.items as any[]).find((item: any) => {
          const keyValue = item.key?.value || item.key?.toString();
          return keyValue === option.key;
        });
        
        if (pair) {
          // Replace only the value node, keeping the key with its comments intact
          pair.value = clonedDoc.createNode(option.value);
        }
      }
      
      // Update game options
      for (const gameName in gameOptions) {
        // Find the game section pair
        const gamePair = (clonedDoc.contents.items as any[]).find((item: any) => {
          const keyValue = item.key?.value || item.key?.toString();
          return keyValue === gameName;
        });
        
        if (gamePair && gamePair.value && isMap(gamePair.value)) {
          const gameMap = gamePair.value;
          
          for (const option of gameOptions[gameName]) {
            // Find the option pair within the game map
            const optionPair = (gameMap.items as any[]).find((item: any) => {
              const keyValue = item.key?.value || item.key?.toString();
              return keyValue === option.key;
            });
            
            if (optionPair) {
              const oldValue = optionPair.value;
              
              // For simple values, just replace
              if (typeof option.value !== 'object' || option.value === null || Array.isArray(option.value)) {
                optionPair.value = clonedDoc.createNode(option.value);
              } else if (isMap(oldValue)) {
                // For maps (like weighted options), update each key individually to preserve comments
                const newValueObj = option.value as { [key: string]: any };
                
                // Update existing keys
                for (const [key, val] of Object.entries(newValueObj)) {
                  const existingPair = (oldValue.items as any[]).find((item: any) => {
                    const keyValue = item.key?.value || item.key?.toString();
                    return keyValue === key;
                  });
                  
                  if (existingPair) {
                    // Update the value, keeping the key and its comments
                    existingPair.value = clonedDoc.createNode(val);
                  } else {
                    // Add new key
                    oldValue.add({ key, value: val });
                  }
                }
                
                // Remove keys that no longer exist
                const newKeys = Object.keys(newValueObj);
                oldValue.items = (oldValue.items as any[]).filter((item: any) => {
                  const keyValue = item.key?.value || item.key?.toString();
                  return newKeys.includes(keyValue);
                });
              } else {
                // Fallback for non-map objects
                optionPair.value = clonedDoc.createNode(option.value);
              }
            }
          }
        }
      }
      
      return clonedDoc.toString();
    } catch (e) {
      console.error('Could not update original document:', e);
      // Fall through to fallback
    }
  }
  
  // Fallback: create a new document if we don't have the original
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
  
  const document = parseDocument('');
  document.contents = document.createNode(result) as any;
  
  return document.toString();
}

/**
 * Validate YAML syntax
 */
export function validateYaml(yamlContent: string): { valid: boolean; error?: string } {
  try {
    parseDocument(yamlContent);
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
