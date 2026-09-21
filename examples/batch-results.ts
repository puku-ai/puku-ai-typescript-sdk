#!/usr/bin/env -S bun run

import PukuAI from '@puku-ai/sdk';

const puku = new PukuAI();

async function main() {
  // Allow override via argv[2] for re-running against a known batch.
  let batch_id = process.argv[2];

  if (!batch_id) {
    console.log('Creating a small batch (1 request) to fetch results for...');
    const batch = await puku.messages.batches.create({
      requests: [
        {
          custom_id: 'demo-1',
          params: {
            model: 'puku-ai-2.8',
            max_tokens: 32,
            messages: [
              { role: 'user', content: 'Reply with the single word OK.' },
            ],
          },
        },
      ],
    });
    console.log('Created batch:', batch.id, 'status=', batch.processing_status);
    batch_id = batch.id;
  } else {
    console.log(`fetching results for ${batch_id}`);
  }

  const results = await puku.messages.batches.results(batch_id);

  for await (const result of results) {
    console.log(JSON.stringify(result, null, 2));
  }
}

main();
