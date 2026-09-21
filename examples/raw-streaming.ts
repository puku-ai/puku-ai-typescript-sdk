#!/usr/bin/env -S bun run

import PukuAI from '@puku-ai/sdk';

const client = new PukuAI(); // gets API Key from environment variable PUKU_API_KEY

async function main() {
  const stream = await client.messages.create({
    model: 'puku-ai-2.8',
    stream: true,
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: 'Hey Puku!',
      },
    ],
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      process.stdout.write(event.delta.text);
    }
  }
  process.stdout.write('\n');
}

main();
