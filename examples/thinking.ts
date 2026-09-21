#!/usr/bin/env -S bun run

import PukuAI from '@puku-ai/sdk';

const client = new PukuAI();

async function main() {
  const message = await client.messages.create({
    model: 'puku-ai-2.8',
    // SDK caps non-streaming max_tokens at 8192 for puku-ai-2.8; the
    // streaming variant (`thinking-stream.ts`) handles 16000.
    max_tokens: 8192,
    thinking: { type: 'adaptive', display: 'summarized' },
    output_config: { effort: 'high' },
    messages: [
      {
        role: 'user',
        content: 'Create a haiku about Puku AI. Think carefully about syllable counts before answering.',
      },
    ],
  });

  for (const block of message.content) {
    if (block.type === 'thinking') {
      console.log(`Thinking: ${block.thinking}`);
    } else if (block.type === 'text') {
      console.log(`Text: ${block.text}`);
    }
  }
}

main();
