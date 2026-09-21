#!/usr/bin/env -S bun run

import PukuAI from '@puku-ai/sdk';
import { betaTool } from '@puku-ai/sdk/vendor/helpers/beta/json-schema';

const client = new PukuAI();

async function main() {
  const message = await client.beta.messages.toolRunner({
    messages: [
      {
        role: 'user',
        content: `What is the weather in SF?`,
      },
    ],
    tools: [
      betaTool({
        name: 'getWeather',
        description: 'Get the weather at a specific location',
        inputSchema: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'The city and state, e.g. San Francisco, CA',
            },
          },
          required: ['location'],
        },
        run: ({ location }) => {
          return `The weather is foggy with a temperature of 20°C in ${location}.`;
        },
      }),
    ],
    model: 'puku-ai-2.8',
    max_tokens: 1024,
    // the maximum number of iterations to run the tool
    max_iterations: 10,
  });

  console.log('Final response:', message.content);
}

main();
