#!/usr/bin/env -S bun run

import { betaStandardSchemaOutputFormat } from '@puku-ai/sdk/vendor/helpers/beta/standard-schema';
import PukuAI from '@puku-ai/sdk';
import { z } from 'zod';

// Any Standard-Schema-compliant library works here (Zod, Valibot, ArkType).
// This example uses Zod because it's already in `devDependencies`; the
// underlying `betaStandardSchemaOutputFormat` only depends on
// `StandardSchemaV1`, not on a specific validator.
const NumbersResponse = z.object({
  primes: z.array(z.number()),
});

async function main() {
  const client = new PukuAI();

  const message = await client.beta.messages.parse({
    model: 'puku-ai-2.8',
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'What are the first 3 prime numbers?' }],
    output_config: {
      format: betaStandardSchemaOutputFormat(NumbersResponse),
    },
  });

  console.log('=== Full Message ===');
  console.log(JSON.stringify(message, null, 2));
  console.log('=== Parsed Output ===');
  console.log('\nPrime numbers:', message.parsed_output!.primes);
}

main();
