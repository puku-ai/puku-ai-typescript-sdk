#!/usr/bin/env -S bun run

// Load PUKU_API_KEY / PUKU_BASE_URL / PUKU_ENVIRONMENT_* from ./.env when run
// directly via `bun run examples/...`. The bundled runner
// (`scripts/run-all-examples.mjs`) already loads .env and propagates it to
// spawned children, so this import is a no-op there — kept for parity so the
// example runs the same either way.
import './_load-env.mjs';
import PukuAI from '@puku-ai/sdk';
import { betaZodTool } from '@puku-ai/sdk/vendor/helpers/beta/zod';
import type { BetaToolUseBlock } from '@puku-ai/sdk/vendor/resources/beta/index';
import { z } from 'zod/v4';

const client = new PukuAI();

async function main() {
  const runner = client.beta.messages.toolRunner({
    messages: [
      {
        role: 'user',
        content: `I'm planning a trip to San Francisco and I need some information. Can you help me with the weather, current time, and currency exchange rates (from EUR)? Please use parallel tool use`,
      },
    ],
    tools: [
      betaZodTool({
        name: 'getWeather',
        description: 'Get the weather at a specific location',
        inputSchema: z.object({
          location: z.string().describe('The city and state, e.g. San Francisco, CA'),
        }),
        run: ({ location }) => {
          return `The weather is sunny with a temperature of 20°C in ${location}.`;
        },
      }),
      betaZodTool({
        name: 'getTime',
        description: 'Get the current time in a specific timezone',
        inputSchema: z.object({
          timezone: z.string().describe('The timezone, e.g. America/Los_Angeles'),
        }),
        run: ({ timezone }) => {
          return `The current time in ${timezone} is 3:00 PM.`;
        },
      }),
      betaZodTool({
        name: 'getCurrencyExchangeRate',
        description: 'Get the exchange rate between two currencies',
        inputSchema: z.object({
          from_currency: z.string().describe('The currency to convert from, e.g. USD'),
          to_currency: z.string().describe('The currency to convert to, e.g. EUR'),
        }),
        run: ({ from_currency, to_currency }) => {
          return `The exchange rate from ${from_currency} to ${to_currency} is 0.85.`;
        },
      }),
    ],
    model: 'puku-ai-2.8',
    max_tokens: 1024,
    // This limits the conversation to at most 10 back and forth between the API.
    max_iterations: 10,
  });

  console.log(`\n🚀 Running tools...\n`);

  for await (const message of runner) {
    console.log(`┌─ Message ${message.id} `.padEnd(process.stdout.columns, '─'));
    console.log();

    for (const block of message.content) {
      switch (block.type) {
        case 'text':
          console.log(`${block.text}\n`);
          break;
        case 'tool_use':
          console.log(`${block.name}(${JSON.stringify(block.input, null, 2)})\n`);
          break;
      }
    }

    console.log(`└─`.padEnd(process.stdout.columns, '─'));
    console.log();
    console.log();

    const defaultResponse = await runner.generateToolResponse();
    if (defaultResponse && typeof defaultResponse.content !== 'string') {
      console.log(`┌─ Response `.padEnd(process.stdout.columns, '─'));
      console.log();

      for (const block of defaultResponse.content) {
        if (block.type === 'tool_result') {
          const toolUseBlock = message.content.find((b): b is BetaToolUseBlock => {
            return b.type === 'tool_use' && b.id === block.tool_use_id;
          })!;
          console.log(`${toolUseBlock.name}(): ${block.content}`);
        }
      }

      console.log();
      console.log(`└─`.padEnd(process.stdout.columns, '─'));
      console.log();
      console.log();
    }
  }
}

main();
