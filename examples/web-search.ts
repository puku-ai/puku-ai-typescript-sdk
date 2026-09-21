#!/usr/bin/env -S bun run
import './_load-env.mjs';
import PukuAI from '@puku-ai/sdk';

const client = new PukuAI();

async function main() {
  console.log('Web Search Example');
  console.log('=================');

  // Create a message with web search enabled
  const message = await client.messages.create({
    model: 'puku-ai-2.8',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content:
          "fetch https://poridhi.io/ and summarize the content. Please use web search to gather any additional information if needed.",
      },
    ],
    tools: [
      {
        name: 'web_search',
        type: 'web_search_20250305',
      },
    ],
  });

  // Print the full response
  console.log('\nFull response:');
  console.dir(message, { depth: 4 });

  // Extract and print the content
  console.log('\nResponse content:');
  for (const contentBlock of message.content) {
    if (contentBlock.type === 'text') {
      console.log(contentBlock.text);
    }
  }

  // Print usage information
  console.log('\nUsage statistics:');
  console.log(`Input tokens: ${message.usage.input_tokens}`);
  console.log(`Output tokens: ${message.usage.output_tokens}`);

  if (message.usage.server_tool_use) {
    console.log(`Web search requests: ${message.usage.server_tool_use.web_search_requests}`);
  }
}

main();
