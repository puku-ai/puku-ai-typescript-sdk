#!/usr/bin/env -S bun run

import PukuAI from '@puku-ai/sdk';

const client = new PukuAI(); // gets API Key from environment variable PUKU_API_KEY

async function main() {
  let thinkingState = 'not-started';

  const stream = client.messages
    .stream({
      model: 'puku-ai-2.8',
      max_tokens: 16000,
      thinking: { type: 'adaptive', display: 'summarized' },
      output_config: { effort: 'high' },
      messages: [
        {
          role: 'user',
          content: 'Create a haiku about Puku AI. Think carefully about syllable counts before answering.',
        },
      ],
    })
    .on('thinking', (thinking) => {
      if (thinkingState === 'not-started') {
        console.log('Thinking:\n---------');
        thinkingState = 'started';
      }

      process.stdout.write(thinking);
    })
    .on('text', (text) => {
      if (thinkingState !== 'finished') {
        console.log('\n\nText:\n-----');
        thinkingState = 'finished';
      }
      process.stdout.write(text);
    });

  const finalMessage = await stream.finalMessage();
  console.log('\n\nFinal message object:\n--------------------', finalMessage);
}

main();
