#!/usr/bin/env -S bun run

import PukuAI from '@puku-ai/sdk';
import { jsonSchemaOutputFormat } from '@puku-ai/sdk/vendor/helpers/json-schema';

const NumbersResponse = {
  type: 'object',
  properties: {
    primes: {
      type: 'array',
      items: {
        type: 'number',
      },
    },
  },
  required: ['primes'],
} as const;

async function main() {
  const client = new PukuAI();

  const message = await client.messages.parse({
    model: 'puku-ai-2.8',
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'What are the first 3 prime numbers?' }],
    output_config: {
      format: jsonSchemaOutputFormat(NumbersResponse),
    },
  });

  console.log('=== Full Message ===');
  console.log(JSON.stringify(message, null, 2));
  console.log('=== Parsed Output ===');
  console.log('\nPrime numbers:', message.parsed_output?.primes);
}

main();
