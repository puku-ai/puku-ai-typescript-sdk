#!/usr/bin/env -S bun run

import PukuAI from '@puku-ai/sdk';
import type { BetaRunnableTool } from '@puku-ai/sdk/vendor/lib/tools/BetaRunnableTool';
import { betaAgentToolset20260401 } from '@puku-ai/sdk/vendor/tools/agent-toolset/node';

const client = new PukuAI();

// Base directory for the per-session AgentToolContext. An orchestrator typically
// points this at the sandbox's scratch space.
const workdir = process.env['PUKU_WORKDIR'] ?? '.';

// A custom tool, in the same BetaRunnableTool shape that
// `client.beta.messages.toolRunner` accepts. The worker executes it alongside
// the defaults whenever the model emits a matching `agent.tool_use` event.
const CURRENT_TIME_DESCRIPTION = 'Get the current time in ISO 8601 format.';
const currentTime: BetaRunnableTool<Record<string, never>> = {
  type: 'custom',
  name: 'current_time',
  description: CURRENT_TIME_DESCRIPTION,
  input_schema: { type: 'object', properties: {} },
  parse: (x) => x as Record<string, never>,
  run: async () => new Date().toISOString(),
};

async function main() {
  const environmentId = requireEnv('PUKU_ENVIRONMENT_ID');

  // Create an agent that exposes the standard toolset plus our custom tool.
  const agent = await client.beta.agents.create({
    name: 'worker-dispatch-example',
    model: 'puku-ai-2.7',
    system: 'You are running in a self-hosted sandbox. Use the available tools to answer.',
    tools: [
      { type: 'agent_toolset_20260401' },
      {
        type: 'custom',
        name: currentTime.name,
        description: CURRENT_TIME_DESCRIPTION,
        input_schema: { type: 'object', properties: {} },
      },
    ],
  });
  console.log('created agent', agent.id);

  // Pin a session to the self-hosted environment — this enqueues a work item
  // for the poller to claim.
  const session = await client.beta.sessions.create({
    agent: agent.id,
    environment_id: environmentId,
    title: 'worker-dispatch-example',
  });
  console.log('created session', session.id);

  // Send the initial prompt so the agent loop has something to drive.
  await client.beta.sessions.events.send(session.id, {
    events: [
      {
        type: 'user.message',
        content: [{ type: 'text', text: 'What is the current time?' }],
      },
    ],
  });

  // Build the worker with a `tools` factory — the standard agent_toolset_20260401
  // set plus our one custom tool — and run the poll loop. `run()` blocks until
  // the deadline; we use a 60s ceiling so the demo exits even if the gateway
  // never produces more work.
  const worker = client.beta.environments.work.worker({
    environmentId,
    environmentKey: requireEnv('PUKU_ENVIRONMENT_KEY'),
    workdir,
    tools: (ctx) => [...betaAgentToolset20260401(ctx), currentTime],
  });

  await worker.run(AbortSignal.timeout(60_000));
  console.log('work item handled');
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

main();
