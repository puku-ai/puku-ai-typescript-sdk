#!/usr/bin/env -S bun run

import PukuAI from '@puku-ai/sdk';

const client = new PukuAI(); // gets API Key from environment variable PUKU_API_KEY

async function main() {
  const result = await client.messages.create({
    messages: [
      {
        role: 'user',
        content: 'Hey Puku!?',
      },
    ],
    model: 'puku-ai-2.8',
    max_tokens: 1024,
  });
  console.dir(result);
}

main();
