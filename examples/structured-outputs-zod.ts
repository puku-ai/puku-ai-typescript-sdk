#!/usr/bin/env -S bun run

import { zodOutputFormat } from '@puku-ai/sdk/vendor/helpers/zod';
import PukuAI from '@puku-ai/sdk';
import { z } from 'zod/v4';

const NumbersResponse = z.object({
  primes: z.array(z.number()),
});

async function main() {
  const client = new PukuAI();

  const message = await client.messages.parse({
    model: 'puku-ai-2.8',
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'What are the first 3 prime numbers?' }],
    output_config: {
      format: zodOutputFormat(NumbersResponse),
    },
  });

  console.log('=== Full Message ===');
  console.log(JSON.stringify(message, null, 2));
  console.log('=== Parsed Output ===');
  console.log('\nPrime numbers:', message.parsed_output!.primes);
}

main();
