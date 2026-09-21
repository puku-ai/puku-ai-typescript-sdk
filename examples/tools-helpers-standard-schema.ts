#!/usr/bin/env -S bun run
import './_load-env.mjs';
import PukuAI from '@puku-ai/sdk';
import { betaStandardSchemaTool } from '@puku-ai/sdk/vendor/helpers/beta/standard-schema';
import { z } from 'zod/v4';

// Any library implementing Standard Schema works here (Valibot, ArkType, Zod, ...).
// Zod is included in this repo's dependencies; for Valibot / ArkType, install
// the matching peer package first.

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
      betaStandardSchemaTool({
        name: 'getWeather',
        description: 'Get the weather at a specific location',
        inputSchema: z.object({
          location: z.string().describe('The city and state, e.g. San Francisco, CA'),
        }),
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
