#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { botManager, goals } from './utils/bot-manager.js';
import { Vec3 } from 'vec3';

// Create the MCP server
const server = new McpServer({
  name: 'minecraft-mcp',
  version: '1.0.0',
});

// ============================================================================
// CONNECTION TOOLS
// ============================================================================

server.tool(
  'connect',
  'Connect the bot to a Minecraft server',
  {
    host: z.string().describe('Server hostname or IP address'),
    port: z.number().default(25565).describe('Server port (default: 25565)'),
    username: z.string().describe('Bot username'),
    version: z.string().optional().describe('Minecraft version (auto-detect if not specified)'),
    auth: z.enum(['offline', 'microsoft']).default('offline').describe('Authentication type'),
  },
  async ({ host, port, username, version, auth }) => {
    try {
      const result = await botManager.connect({ host, port, username, version, auth });
      return { content: [{ type: 'text', text: result }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Failed to connect: ${error}` }], isError: true };
    }
  }
);

server.tool(
  'disconnect',
  'Disconnect the bot from the current server',
  {},
  async () => {
    const result = botManager.disconnect();
    return { content: [{ type: 'text', text: result }] };
  }
);

server.tool(
  'get_status',
  'Get the current status of the bot including health, hunger, position, etc.',
  {},
  async () => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    const status = {
      connected: botManager.isConnected(),
      username: bot.username,
      health: bot.health,
      food: bot.food,
      saturation: bot.foodSaturation,
      gameMode: bot.game.gameMode,
      difficulty: bot.game.difficulty,
      position: bot.entity?.position ? {
        x: Math.floor(bot.entity.position.x),
        y: Math.floor(bot.entity.position.y),
        z: Math.floor(bot.entity.position.z),
      } : null,
      dimension: bot.game.dimension,
      time: {
        day: Math.floor(bot.time.day),
        timeOfDay: bot.time.timeOfDay,
      },
      experience: {
        level: bot.experience.level,
        points: bot.experience.points,
        progress: bot.experience.progress,
      },
      isRaining: bot.isRaining,
      biome: bot.entity?.position ? bot.blockAt(bot.entity.position)?.biome?.name : 'unknown',
    };

    return { content: [{ type: 'text', text: JSON.stringify(status, null, 2) }] };
  }
);

// ============================================================================
// MOVEMENT TOOLS
// ============================================================================

server.tool(
  'goto',
  'Navigate the bot to specific coordinates using pathfinding',
  {
    x: z.number().describe('X coordinate'),
    y: z.number().describe('Y coordinate'),
    z: z.number().describe('Z coordinate'),
  },
  async ({ x, y, z }) => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    try {
      const goal = new goals.GoalNear(x, y, z, 1);
      await bot.pathfinder.goto(goal);
      return { content: [{ type: 'text', text: `Arrived at coordinates (${x}, ${y}, ${z})` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Failed to navigate: ${error}` }], isError: true };
    }
  }
);

server.tool(
  'follow_player',
  'Follow a specific player',
  {
    playerName: z.string().describe('Name of the player to follow'),
    distance: z.number().default(2).describe('Distance to maintain from the player'),
  },
  async ({ playerName, distance }) => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    const player = bot.players[playerName];
    if (!player || !player.entity) {
      return { content: [{ type: 'text', text: `Player ${playerName} not found or not in range.` }], isError: true };
    }

    try {
      const goal = new goals.GoalFollow(player.entity, distance);
      bot.pathfinder.setGoal(goal, true); // true for dynamic goal
      return { content: [{ type: 'text', text: `Now following ${playerName} at distance ${distance}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Failed to follow player: ${error}` }], isError: true };
    }
  }
);

server.tool(
  'stop_movement',
  'Stop all movement and pathfinding',
  {},
  async () => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    bot.pathfinder.setGoal(null);
    bot.clearControlStates();
    return { content: [{ type: 'text', text: 'Movement stopped.' }] };
  }
);

server.tool(
  'jump',
  'Make the bot jump',
  {},
  async () => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    bot.setControlState('jump', true);
    setTimeout(() => bot.setControlState('jump', false), 500);
    return { content: [{ type: 'text', text: 'Jumped!' }] };
  }
);

server.tool(
  'look_at',
  'Make the bot look at specific coordinates',
  {
    x: z.number().describe('X coordinate to look at'),
    y: z.number().describe('Y coordinate to look at'),
    z: z.number().describe('Z coordinate to look at'),
  },
  async ({ x, y, z }) => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    await bot.lookAt(new Vec3(x, y, z));
    return { content: [{ type: 'text', text: `Now looking at (${x}, ${y}, ${z})` }] };
  }
);

// ============================================================================
// BLOCK INTERACTION TOOLS
// ============================================================================

server.tool(
  'dig_block',
  'Dig/break a block at specific coordinates',
  {
    x: z.number().describe('X coordinate of the block'),
    y: z.number().describe('Y coordinate of the block'),
    z: z.number().describe('Z coordinate of the block'),
  },
  async ({ x, y, z }) => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    const block = bot.blockAt(new Vec3(x, y, z));
    if (!block) {
      return { content: [{ type: 'text', text: 'No block found at that position.' }], isError: true };
    }

    try {
      await bot.dig(block);
      return { content: [{ type: 'text', text: `Successfully dug ${block.name} at (${x}, ${y}, ${z})` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Failed to dig block: ${error}` }], isError: true };
    }
  }
);

server.tool(
  'place_block',
  'Place a block from inventory at specific coordinates',
  {
    x: z.number().describe('X coordinate to place the block'),
    y: z.number().describe('Y coordinate to place the block'),
    z: z.number().describe('Z coordinate to place the block'),
    blockName: z.string().describe('Name of the block to place (e.g., "cobblestone", "dirt")'),
  },
  async ({ x, y, z, blockName }) => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    // Find the item in inventory
    const item = bot.inventory.items().find(i => i.name.includes(blockName.toLowerCase()));
    if (!item) {
      return { content: [{ type: 'text', text: `No ${blockName} found in inventory.` }], isError: true };
    }

    try {
      await bot.equip(item, 'hand');
      
      // Find a reference block to place against
      const referenceBlock = bot.blockAt(new Vec3(x, y - 1, z));
      if (!referenceBlock || referenceBlock.name === 'air') {
        return { content: [{ type: 'text', text: 'No reference block to place against.' }], isError: true };
      }

      await bot.placeBlock(referenceBlock, new Vec3(0, 1, 0));
      return { content: [{ type: 'text', text: `Successfully placed ${blockName} at (${x}, ${y}, ${z})` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Failed to place block: ${error}` }], isError: true };
    }
  }
);

server.tool(
  'get_block_info',
  'Get information about a block at specific coordinates',
  {
    x: z.number().describe('X coordinate'),
    y: z.number().describe('Y coordinate'),
    z: z.number().describe('Z coordinate'),
  },
  async ({ x, y, z }) => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    const block = bot.blockAt(new Vec3(x, y, z));
    if (!block) {
      return { content: [{ type: 'text', text: 'No block found at that position.' }], isError: true };
    }

    const info = {
      name: block.name,
      type: block.type,
      hardness: block.hardness,
      diggable: block.diggable,
      boundingBox: block.boundingBox,
      material: block.material,
      position: { x, y, z },
    };

    return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] };
  }
);

server.tool(
  'find_blocks',
  'Find blocks of a specific type near the bot',
  {
    blockName: z.string().describe('Name of the block to find (e.g., "diamond_ore", "iron_ore")'),
    maxDistance: z.number().default(32).describe('Maximum search distance'),
    count: z.number().default(10).describe('Maximum number of blocks to find'),
  },
  async ({ blockName, maxDistance, count }) => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    const mcData = require('minecraft-data')(bot.version);
    const blockType = mcData.blocksByName[blockName];
    
    if (!blockType) {
      return { content: [{ type: 'text', text: `Unknown block type: ${blockName}` }], isError: true };
    }

    const blocks = bot.findBlocks({
      matching: blockType.id,
      maxDistance,
      count,
    });

    if (blocks.length === 0) {
      return { content: [{ type: 'text', text: `No ${blockName} found within ${maxDistance} blocks.` }] };
    }

    const results = blocks.map(pos => ({ x: pos.x, y: pos.y, z: pos.z }));
    return { content: [{ type: 'text', text: `Found ${blocks.length} ${blockName} blocks:\n${JSON.stringify(results, null, 2)}` }] };
  }
);

// ============================================================================
// INVENTORY TOOLS
// ============================================================================

server.tool(
  'get_inventory',
  'Get the current inventory contents',
  {},
  async () => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    const items = bot.inventory.items().map(item => ({
      name: item.name,
      count: item.count,
      slot: item.slot,
      displayName: item.displayName,
    }));

    if (items.length === 0) {
      return { content: [{ type: 'text', text: 'Inventory is empty.' }] };
    }

    return { content: [{ type: 'text', text: JSON.stringify(items, null, 2) }] };
  }
);

server.tool(
  'equip_item',
  'Equip an item from inventory',
  {
    itemName: z.string().describe('Name of the item to equip'),
    destination: z.enum(['hand', 'off-hand', 'head', 'torso', 'legs', 'feet']).default('hand').describe('Where to equip the item'),
  },
  async ({ itemName, destination }) => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    const item = bot.inventory.items().find(i => i.name.includes(itemName.toLowerCase()));
    if (!item) {
      return { content: [{ type: 'text', text: `No ${itemName} found in inventory.` }], isError: true };
    }

    try {
      await bot.equip(item, destination);
      return { content: [{ type: 'text', text: `Equipped ${item.name} to ${destination}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Failed to equip item: ${error}` }], isError: true };
    }
  }
);

server.tool(
  'drop_item',
  'Drop items from inventory',
  {
    itemName: z.string().describe('Name of the item to drop'),
    count: z.number().optional().describe('Number of items to drop (all if not specified)'),
  },
  async ({ itemName, count }) => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    const item = bot.inventory.items().find(i => i.name.includes(itemName.toLowerCase()));
    if (!item) {
      return { content: [{ type: 'text', text: `No ${itemName} found in inventory.` }], isError: true };
    }

    try {
      await bot.toss(item.type, null, count || item.count);
      return { content: [{ type: 'text', text: `Dropped ${count || item.count} ${item.name}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Failed to drop item: ${error}` }], isError: true };
    }
  }
);

// ============================================================================
// CRAFTING TOOLS
// ============================================================================

server.tool(
  'craft_item',
  'Craft an item using available materials',
  {
    itemName: z.string().describe('Name of the item to craft'),
    count: z.number().default(1).describe('Number of items to craft'),
  },
  async ({ itemName, count }) => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    const mcData = require('minecraft-data')(bot.version);
    const item = mcData.itemsByName[itemName];
    
    if (!item) {
      return { content: [{ type: 'text', text: `Unknown item: ${itemName}` }], isError: true };
    }

    const recipes = bot.recipesFor(item.id, null, 1, null);
    if (recipes.length === 0) {
      return { content: [{ type: 'text', text: `No recipe found for ${itemName}` }], isError: true };
    }

    try {
      // Find crafting table nearby or craft without one
      const craftingTable = bot.findBlock({
        matching: mcData.blocksByName.crafting_table?.id,
        maxDistance: 4,
      });

      await bot.craft(recipes[0], count, craftingTable || undefined);
      return { content: [{ type: 'text', text: `Successfully crafted ${count} ${itemName}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Failed to craft: ${error}` }], isError: true };
    }
  }
);

server.tool(
  'get_recipes',
  'Get available crafting recipes for an item',
  {
    itemName: z.string().describe('Name of the item to get recipes for'),
  },
  async ({ itemName }) => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    const mcData = require('minecraft-data')(bot.version);
    const item = mcData.itemsByName[itemName];
    
    if (!item) {
      return { content: [{ type: 'text', text: `Unknown item: ${itemName}` }], isError: true };
    }

    const recipes = bot.recipesFor(item.id, null, 1, null);
    if (recipes.length === 0) {
      return { content: [{ type: 'text', text: `No recipes found for ${itemName}` }] };
    }

    const recipeInfo = recipes.map((recipe, i) => ({
      index: i,
      requiresCraftingTable: recipe.requiresTable,
      ingredients: recipe.ingredients || recipe.inShape?.flat().filter(Boolean),
    }));

    return { content: [{ type: 'text', text: JSON.stringify(recipeInfo, null, 2) }] };
  }
);

// ============================================================================
// COMBAT TOOLS
// ============================================================================

server.tool(
  'attack_entity',
  'Attack a nearby entity',
  {
    entityType: z.string().describe('Type of entity to attack (e.g., "zombie", "skeleton", or a player name)'),
  },
  async ({ entityType }) => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    // Find the entity
    const entity = Object.values(bot.entities).find(e => {
      if (e.type === 'player') {
        return e.username?.toLowerCase() === entityType.toLowerCase();
      }
      return e.name?.toLowerCase() === entityType.toLowerCase();
    });

    if (!entity) {
      return { content: [{ type: 'text', text: `No ${entityType} found nearby.` }], isError: true };
    }

    try {
      bot.pvp.attack(entity);
      return { content: [{ type: 'text', text: `Now attacking ${entityType}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Failed to attack: ${error}` }], isError: true };
    }
  }
);

server.tool(
  'stop_attack',
  'Stop attacking the current target',
  {},
  async () => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    bot.pvp.stop();
    return { content: [{ type: 'text', text: 'Stopped attacking.' }] };
  }
);

server.tool(
  'get_nearby_entities',
  'Get a list of nearby entities',
  {
    maxDistance: z.number().default(32).describe('Maximum distance to search'),
  },
  async ({ maxDistance }) => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    const entities = Object.values(bot.entities)
      .filter(e => {
        if (!e.position || !bot.entity?.position) return false;
        return e.position.distanceTo(bot.entity.position) <= maxDistance && e !== bot.entity;
      })
      .map(e => ({
        type: e.type,
        name: e.name || e.username || 'unknown',
        position: {
          x: Math.floor(e.position!.x),
          y: Math.floor(e.position!.y),
          z: Math.floor(e.position!.z),
        },
        distance: Math.floor(e.position!.distanceTo(bot.entity!.position)),
        health: (e as any).health,
      }));

    if (entities.length === 0) {
      return { content: [{ type: 'text', text: 'No entities found nearby.' }] };
    }

    return { content: [{ type: 'text', text: JSON.stringify(entities, null, 2) }] };
  }
);

// ============================================================================
// CHAT TOOLS
// ============================================================================

server.tool(
  'send_chat',
  'Send a chat message in the game',
  {
    message: z.string().describe('Message to send'),
  },
  async ({ message }) => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    bot.chat(message);
    return { content: [{ type: 'text', text: `Sent message: ${message}` }] };
  }
);

server.tool(
  'whisper',
  'Send a private message to a player',
  {
    playerName: z.string().describe('Name of the player to whisper to'),
    message: z.string().describe('Message to send'),
  },
  async ({ playerName, message }) => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    bot.whisper(playerName, message);
    return { content: [{ type: 'text', text: `Whispered to ${playerName}: ${message}` }] };
  }
);

// ============================================================================
// UTILITY TOOLS
// ============================================================================

server.tool(
  'get_players',
  'Get a list of all players on the server',
  {},
  async () => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    const players = Object.values(bot.players).map(p => ({
      username: p.username,
      ping: p.ping,
      gamemode: p.gamemode,
      position: p.entity?.position ? {
        x: Math.floor(p.entity.position.x),
        y: Math.floor(p.entity.position.y),
        z: Math.floor(p.entity.position.z),
      } : 'Not in view range',
    }));

    return { content: [{ type: 'text', text: JSON.stringify(players, null, 2) }] };
  }
);

server.tool(
  'use_item',
  'Use/activate the currently held item (right-click action)',
  {},
  async () => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    try {
      await bot.activateItem();
      return { content: [{ type: 'text', text: 'Item activated.' }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Failed to use item: ${error}` }], isError: true };
    }
  }
);

server.tool(
  'eat',
  'Eat a specific food item',
  {
    foodName: z.string().optional().describe('Name of the food to eat (auto-selects if not specified)'),
  },
  async ({ foodName }) => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    try {
      if (foodName) {
        const food = bot.inventory.items().find(i => i.name.includes(foodName.toLowerCase()));
        if (!food) {
          return { content: [{ type: 'text', text: `No ${foodName} found in inventory.` }], isError: true };
        }
        await bot.equip(food, 'hand');
        await bot.consume();
        return { content: [{ type: 'text', text: `Ate ${food.name}` }] };
      } else {
        // Let auto-eat handle it
        bot.autoEat.eat();
        return { content: [{ type: 'text', text: 'Eating...' }] };
      }
    } catch (error) {
      return { content: [{ type: 'text', text: `Failed to eat: ${error}` }], isError: true };
    }
  }
);

server.tool(
  'sleep',
  'Sleep in a nearby bed',
  {},
  async () => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    const mcData = require('minecraft-data')(bot.version);
    const bedBlocks = Object.keys(mcData.blocksByName).filter(name => name.includes('bed'));
    const bedIds = bedBlocks.map(name => mcData.blocksByName[name]?.id).filter(Boolean);

    const bed = bot.findBlock({
      matching: bedIds,
      maxDistance: 6,
    });

    if (!bed) {
      return { content: [{ type: 'text', text: 'No bed found nearby.' }], isError: true };
    }

    try {
      await bot.sleep(bed);
      return { content: [{ type: 'text', text: 'Now sleeping.' }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Failed to sleep: ${error}` }], isError: true };
    }
  }
);

server.tool(
  'wake',
  'Wake up from sleeping',
  {},
  async () => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    try {
      await bot.wake();
      return { content: [{ type: 'text', text: 'Woke up.' }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Failed to wake up: ${error}` }], isError: true };
    }
  }
);

server.tool(
  'collect_block',
  'Navigate to and collect a specific block type',
  {
    blockName: z.string().describe('Name of the block to collect'),
    count: z.number().default(1).describe('Number of blocks to collect'),
  },
  async ({ blockName, count }) => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    const mcData = require('minecraft-data')(bot.version);
    const blockType = mcData.blocksByName[blockName];
    
    if (!blockType) {
      return { content: [{ type: 'text', text: `Unknown block type: ${blockName}` }], isError: true };
    }

    const blocks = bot.findBlocks({
      matching: blockType.id,
      maxDistance: 64,
      count: count,
    });

    if (blocks.length === 0) {
      return { content: [{ type: 'text', text: `No ${blockName} found nearby.` }], isError: true };
    }

    try {
      const targets = blocks.map(pos => bot.blockAt(pos)!).filter(Boolean);
      await bot.collectBlock.collect(targets);
      return { content: [{ type: 'text', text: `Collected ${targets.length} ${blockName}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Failed to collect: ${error}` }], isError: true };
    }
  }
);

server.tool(
  'activate_block',
  'Activate/interact with a block (like opening a chest, pressing a button)',
  {
    x: z.number().describe('X coordinate of the block'),
    y: z.number().describe('Y coordinate of the block'),
    z: z.number().describe('Z coordinate of the block'),
  },
  async ({ x, y, z }) => {
    const bot = botManager.getBot();
    if (!bot) {
      return { content: [{ type: 'text', text: 'Bot is not connected.' }], isError: true };
    }

    const block = bot.blockAt(new Vec3(x, y, z));
    if (!block) {
      return { content: [{ type: 'text', text: 'No block found at that position.' }], isError: true };
    }

    try {
      await bot.activateBlock(block);
      return { content: [{ type: 'text', text: `Activated ${block.name} at (${x}, ${y}, ${z})` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Failed to activate block: ${error}` }], isError: true };
    }
  }
);

// ============================================================================
// RESOURCE - Current State Resource
// ============================================================================

server.resource(
  'bot_state',
  'minecraft://state',
  async (uri) => {
    const bot = botManager.getBot();
    if (!bot) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ connected: false }),
        }],
      };
    }

    const state = {
      connected: true,
      username: bot.username,
      health: bot.health,
      food: bot.food,
      position: bot.entity?.position ? {
        x: bot.entity.position.x,
        y: bot.entity.position.y,
        z: bot.entity.position.z,
      } : null,
      gameMode: bot.game.gameMode,
      dimension: bot.game.dimension,
    };

    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(state, null, 2),
      }],
    };
  }
);

// ============================================================================
// START SERVER
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Minecraft MCP Server running on stdio');
}

main().catch(console.error);
