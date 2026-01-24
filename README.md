# 🎮 Minecraft MCP Server

[![npm version](https://img.shields.io/npm/v/minecraft-ai-mcp.svg)](https://www.npmjs.com/package/minecraft-ai-mcp)
[![npm downloads](https://img.shields.io/npm/dm/minecraft-ai-mcp.svg)](https://www.npmjs.com/package/minecraft-ai-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/minecraft-ai-mcp.svg)](https://nodejs.org)

An MCP (Model Context Protocol) server that allows AI agents to play Minecraft! Built with [Mineflayer](https://github.com/PrismarineJS/mineflayer) and the official [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk).

## 🚀 Features

### Connection Management
- Connect/disconnect to any Minecraft server
- Support for offline and Microsoft authentication
- Automatic version detection

### Movement & Navigation
- **Pathfinding**: Navigate to any coordinates using A* pathfinding
- **Follow players**: Dynamically follow other players
- **Look at**: Point the bot's view at specific coordinates
- **Jump**: Make the bot jump

### Block Interaction
- **Dig blocks**: Break blocks at specific coordinates
- **Place blocks**: Place blocks from inventory
- **Find blocks**: Search for specific block types nearby
- **Activate blocks**: Interact with chests, buttons, doors, etc.
- **Collect blocks**: Navigate to and mine specific blocks

### Inventory Management
- **View inventory**: See all items in inventory
- **Equip items**: Equip items to hand, off-hand, or armor slots
- **Drop items**: Discard items from inventory

### Crafting
- **Craft items**: Automatically craft items with available recipes
- **Get recipes**: Query available recipes for any item

### Combat
- **Attack entities**: Attack mobs or players
- **Stop attacking**: Cease combat
- **Get nearby entities**: List all entities within range

### Chat & Communication
- **Send chat**: Send public chat messages
- **Whisper**: Send private messages to players
- **Get players**: List all players on the server

### Survival Features
- **Auto-eat**: Automatic food consumption when hungry
- **Eat**: Manually eat specific food items
- **Sleep**: Find and sleep in nearby beds
- **Get status**: Full status report (health, hunger, position, etc.)

## 📦 Installation

### Quick Start (Recommended)

Run directly with npx - no installation required:

```bash
npx -y minecraft-ai-mcp
```

### Global Installation

```bash
npm install -g minecraft-ai-mcp
minecraft-ai-mcp
```

### From Source

```bash
# Clone the repository
git clone https://github.com/harjjotsinghh/minecraft-mcp.git
cd minecraft-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Run the server
npm start
```

## 🔧 Configuration

### Claude Desktop Configuration

Add to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "minecraft": {
      "command": "npx",
      "args": ["-y", "minecraft-ai-mcp"]
    }
  }
}
```

### Cursor Configuration

Add to your `.cursor/mcp.json` file:

```json
{
  "mcpServers": {
    "minecraft": {
      "command": "npx",
      "args": ["-y", "minecraft-ai-mcp"]
    }
  }
}
```

### Alternative: Using Global Installation

If you installed globally, you can use the command directly:

```json
{
  "mcpServers": {
    "minecraft": {
      "command": "minecraft-ai-mcp"
    }
  }
}
```

## 🎯 Available Tools

| Tool | Description |
|------|-------------|
| `connect` | Connect to a Minecraft server |
| `disconnect` | Disconnect from the server |
| `get_status` | Get bot's current status |
| `goto` | Navigate to coordinates |
| `follow_player` | Follow a specific player |
| `stop_movement` | Stop all movement |
| `jump` | Make the bot jump |
| `look_at` | Look at coordinates |
| `dig_block` | Break a block |
| `place_block` | Place a block |
| `get_block_info` | Get info about a block |
| `find_blocks` | Find nearby blocks |
| `get_inventory` | View inventory contents |
| `equip_item` | Equip an item |
| `drop_item` | Drop items |
| `craft_item` | Craft an item |
| `get_recipes` | Get crafting recipes |
| `attack_entity` | Attack an entity |
| `stop_attack` | Stop attacking |
| `get_nearby_entities` | List nearby entities |
| `send_chat` | Send chat message |
| `whisper` | Private message a player |
| `get_players` | List online players |
| `use_item` | Use held item |
| `eat` | Eat food |
| `sleep` | Sleep in a bed |
| `wake` | Wake up |
| `collect_block` | Collect specific blocks |
| `activate_block` | Interact with a block |

## 💡 Example Usage

### Connecting to a Server
```
Connect to my local Minecraft server at localhost:25565 with username "AIBot"
```

### Mining Diamonds
```
Find diamond ore near me and navigate to collect it
```

### Building
```
Build a 3x3 cobblestone platform at my current position
```

### Combat
```
Find and attack any zombies within 20 blocks
```

### Crafting
```
Craft a wooden pickaxe using the wood in my inventory
```

## 🏗️ Development

```bash
# Run in development mode with auto-reload
npm run dev

# Build for production
npm run build

# Start the built server
npm start
```

## 🔐 Authentication

### Offline Mode (Default)
For servers with `online-mode=false`:
```
Connect with auth: "offline"
```

### Microsoft Account
For online servers (requires Microsoft account):
```
Connect with auth: "microsoft"
```

Note: Microsoft authentication will open a browser window for login.

## ⚠️ Known Limitations

1. **No GUI**: The bot operates headlessly - no game window is displayed
2. **Server Compatibility**: Works best with vanilla Minecraft servers
3. **Version Support**: Supports Minecraft 1.8 through 1.21+
4. **Single Bot**: Currently supports one bot connection at a time

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📄 License

MIT License - feel free to use this in your own projects!

## 🙏 Credits

- [Mineflayer](https://github.com/PrismarineJS/mineflayer) - The amazing Minecraft bot framework
- [PrismarineJS](https://github.com/PrismarineJS) - For all the Minecraft tooling
- [Anthropic](https://github.com/anthropics) - For the MCP specification
- Built with ❤️ by [Harjot Singh Rana](https://harjotrana.com) for the AI gaming revolution
