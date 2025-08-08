#!/usr/bin/env node

/**
 * Custom MCP Server for Context7 API
 * This server provides integration with Context7.com services
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

class Context7MCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'context7-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'create_context',
            description: 'Create a new context in Context7',
            inputSchema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Title of the context',
                },
                content: {
                  type: 'string',
                  description: 'Content to store in the context',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Tags for the context',
                },
              },
              required: ['title', 'content'],
            },
          },
          {
            name: 'search_context',
            description: 'Search for contexts in Context7',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results',
                  default: 10,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_context',
            description: 'Get a specific context by ID',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'Context ID',
                },
              },
              required: ['id'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'create_context':
            return await this.createContext(args);
          case 'search_context':
            return await this.searchContext(args);
          case 'get_context':
            return await this.getContext(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async createContext(args) {
    // Mock implementation - replace with actual Context7 API calls
    const context = {
      id: `ctx_${Date.now()}`,
      title: args.title,
      content: args.content,
      tags: args.tags || [],
      created_at: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: 'text',
          text: `Created context: ${JSON.stringify(context, null, 2)}`,
        },
      ],
    };
  }

  async searchContext(args) {
    // Mock implementation - replace with actual Context7 API calls
    const results = [
      {
        id: 'ctx_1',
        title: 'Sample Context',
        content: `Context matching "${args.query}"`,
        relevance: 0.95,
      },
    ];

    return {
      content: [
        {
          type: 'text',
          text: `Search results for "${args.query}":\n${JSON.stringify(results, null, 2)}`,
        },
      ],
    };
  }

  async getContext(args) {
    // Mock implementation - replace with actual Context7 API calls
    const context = {
      id: args.id,
      title: 'Retrieved Context',
      content: 'This is the context content',
      tags: ['sample', 'context'],
      created_at: '2025-01-01T00:00:00Z',
    };

    return {
      content: [
        {
          type: 'text',
          text: `Context ${args.id}:\n${JSON.stringify(context, null, 2)}`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Context7 MCP server running on stdio');
  }
}

const server = new Context7MCPServer();
server.run().catch(console.error);