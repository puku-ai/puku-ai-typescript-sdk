# <img src="https://raw.githubusercontent.com/puku-ai/puku-ai-sdk/main/image.png" alt="" width="32"> Puku SDK for TypeScript

[![NPM version](https://img.shields.io/npm/v/@puku-ai/sdk.svg)](https://npmjs.org/package/@puku-ai/sdk)

The Puku SDK for TypeScript provides access to the [Puku AI](https://puku.sh) platform from server-side TypeScript or JavaScript applications. It powers both the **Messages API** (chat, tools, structured outputs, streaming) and the **Managed Agents** beta (agents, environments, sessions, MCP).

## Documentation

Full SDK reference and guides live in [`./docs/readme.md`](./docs/readme.md).

## Installation

```sh
npm install @puku-ai/sdk
```

The SDK is published as a single ESM-first package with a CommonJS fallback. Subpath helpers from older pre-releases (`@puku-ai/sdk/helpers/beta/...`, `@puku-ai/sdk/tools/...`) are now re-exported from the package root — only `@puku-ai/sdk` is needed.

## Getting started

```ts
import PukuAI from "@puku-ai/sdk";

const client = new PukuAI({
  apiKey: process.env["PUKU_API_KEY"], // defaults to this env var
  baseURL: process.env["PUKU_BASE_URL"], // required — contact with Puku support 
});

const message = await client.messages.create({
  model: "puku-ai-2.8",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello, Puku" }],
});

console.log(message.content);
```

`PUKU_BASE_URL` is required — the HTTP transport does not fall back to a default endpoint. 

For Managed Agents, the same client exposes `client.beta.*`:

```ts
const agent = await client.beta.agents.create({
  name: "Coding Assistant",
  model: "puku-ai-2.8",
  system: "You are a helpful coding assistant.",
  tools: [{ type: "agent_toolset_20260401" }],
});
```

## Requirements

TypeScript >= 5.0 is supported.

The following runtimes are supported:

- Node.js 18 LTS or later ([non-EOL](https://endoflife.date/nodejs)) versions.
- Deno v1.28.0 or higher.
- Bun 1.0 or later.
- Cloudflare Workers.
- Vercel Edge Runtime.
- Jest 28 or greater with the `"node"` environment (`"jsdom"` is not supported at this time).
- Web browsers: disabled by default to avoid exposing your secret API credentials. Enable browser support by explicitly setting `dangerouslyAllowBrowser` to `true`.

Note that React Native is not supported at this time.

If you are interested in other runtime environments, please open or upvote an issue.

## Contributing
 
`PUKU AI`

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
