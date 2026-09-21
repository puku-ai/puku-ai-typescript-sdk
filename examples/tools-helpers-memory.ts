#!/usr/bin/env -S bun run

import PukuAI from '@puku-ai/sdk';
import { betaMemoryTool } from '@puku-ai/sdk/vendor/helpers/beta/memory';
import type { BetaContextManagementConfig } from '@puku-ai/sdk/vendor/resources/beta/index';
import { BetaLocalFilesystemMemoryTool } from '@puku-ai/sdk/vendor/tools/memory/node';

const client = new PukuAI();

const MESSAGE = 'Remember that I like TypeScript';
const CONTEXT_MANAGEMENT = {
  edits: [
    {
      type: 'clear_tool_uses_20250919',
      // The below parameters are OPTIONAL:
      // Trigger clearing when threshold is exceeded
      trigger: { type: 'input_tokens', value: 30000 },
      // Number of tool uses to keep after clearing
      keep: { type: 'tool_uses', value: 3 },
      // Optional: Clear at least this many tokens
      clear_at_least: { type: 'input_tokens', value: 5000 },
      // Exclude these tools uses from being cleared
      exclude_tools: ['web_search'],
    },
  ],
} satisfies BetaContextManagementConfig;

async function main() {
  const fs = await BetaLocalFilesystemMemoryTool.init('./memory');
  const memory = betaMemoryTool(fs);

  const runner = client.beta.messages.toolRunner({
    messages: [
      {
        role: 'user',
        content: MESSAGE,
      },
    ],
    tools: [memory],
    model: 'puku-ai-2.8',
    context_management: CONTEXT_MANAGEMENT,
    betas: ['context-management-2025-06-27'],
    max_tokens: 1024,
    // the maximum number of iterations to run the tool
    max_iterations: 10,
  });

  for await (const message of runner) {
    console.dir(message, { depth: 4 });
    console.log(await runner.generateToolResponse());
    console.log('---');
  }

  console.log(await runner.runUntilDone());
}

main();
