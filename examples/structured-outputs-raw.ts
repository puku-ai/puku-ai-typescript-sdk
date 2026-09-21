#!/usr/bin/env -S bun run

import PukuAI from '@puku-ai/sdk';

async function main() {
  const client = new PukuAI();

  const message = await client.messages.parse({
    model: 'puku-ai-2.8',
    max_tokens: 100,
    output_config: {
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            answer: { type: 'string', description: 'The final answer' },
          },
          required: ['answer'],
          additionalProperties: false,
        },
      },
    },
    messages: [
      {
        role: 'user',
        content: 'What is bigger: 738 * 5678 or 98123 - 2711?',
      },
    ],
  });
  console.log(JSON.stringify(message.parsed_output, null, 2));
}

main();
