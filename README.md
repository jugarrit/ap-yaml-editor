# Archipelago YAML Editor

A React-based web application for editing YAML configuration files for the Archipelago multiworld randomizer. This editor is completely generic and supports any Archipelago game without hardcoded logic.

## Features

- 📝 **Generic YAML Editing**: Works with any Archipelago YAML template
- 🎮 **Multi-Game Support**: Edit configurations for any supported Archipelago game
- ⚖️ **Weight-Based Options**: Full support for weighted randomization options
- 🔍 **Live Preview**: See your YAML output in real-time
- 📦 **Import/Export**: Load templates and export configured YAML files
- 🎨 **Modern UI**: Clean, dark-themed interface with intuitive controls

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## Usage

### 1. Load a Template

You can start editing in two ways:

- **Load Template**: Upload an existing Archipelago YAML template file
- **Load Default Template**: Start with a basic template for A Link to the Past

### 2. Edit Your Configuration

The editor automatically detects and provides appropriate controls for different option types:

#### Root Options
- `description`: Text description of your configuration
- `name`: Player name (supports multiple weighted names)
- `game`: Game selection (supports multiple weighted games)
- `requires`: Version and mod requirements

#### Game-Specific Options
Each game section contains its specific settings:

- **Simple Values**: Text inputs for strings, numbers for numeric values
- **Booleans**: Checkboxes for true/false options
- **Arrays**: Add/remove list items (for `local_items`, `exclude_locations`, etc.)
- **Weighted Options**: Multiple choices with weight values for randomization
- **Complex Objects**: JSON editor for advanced structures (triggers, item_links, etc.)

### 3. Preview and Export

- Click **Show Preview** to see the generated YAML in real-time
- Click **Export YAML** to download your configuration file

## Supported Option Types

### Weighted Options
Options with multiple choices and weights:

```yaml
game:
  A Link to the Past: 10
  Timespinner: 10
```

The editor provides fields to add/remove options and adjust their weights.

### Arrays
List-based options:

```yaml
local_items:
  - Bombos
  - Ether
  - Quake
```

Add or remove items dynamically.

### Random Numbers
The editor preserves special random values:
- `random`
- `random-low`, `random-middle`, `random-high`
- `random-range-X-Y`
- `random-range-low-X-Y`, etc.

### Universal Options
Supports all Archipelago universal options:
- `accessibility`
- `progression_balancing`
- `triggers`
- `local_items` / `non_local_items`
- `start_inventory`
- `start_hints` / `start_location_hints`
- `exclude_locations` / `priority_locations`
- `item_links`
- And more...

## Example Template

See `example-template.yaml` for a comprehensive example demonstrating various option types and configurations.

## Technology Stack

- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe code
- **Vite**: Fast build tool and dev server
- **js-yaml**: YAML parsing and generation
- **Lucide React**: Beautiful icons

## Architecture

The application follows a component-based architecture:

- `App.tsx`: Main application component with state management
- `utils/yamlParser.ts`: YAML parsing, validation, and export logic
- `components/OptionEditor.tsx`: Dynamic option editor factory
- `components/OptionEditors.tsx`: Specific editors for each data type
- `components/GameSection.tsx`: Collapsible game configuration sections

## Contributing

This is a generic editor that adapts to any template structure. No game-specific logic needs to be added - the editor automatically handles any valid Archipelago YAML structure.

## Resources

- [Archipelago Official Site](https://archipelago.gg/)
- [Advanced YAML Guide](https://archipelago.gg/tutorial/Archipelago/advanced_settings_en)
- [Supported Games](https://archipelago.gg/games)

## License

MIT License - feel free to use and modify as needed.
