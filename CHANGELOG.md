# Changelog

All notable changes to `@puku-ai/sdk` are documented in this file.

This project follows [Semantic Versioning](https://semver.org/). The latest published version is **4.0.7**.

---

## [4.0.7] — 2026-09-21

TypeScript-only patch release. No runtime behavior changes.

The curated `export type { ... }` block at `src/vendor/index.ts:84-102` was omitting 10 Beta message types that puku-cli's downstream code imports from `@puku-ai/sdk`, producing `TS2614` / `TS2724` errors of the form `Module '"@puku-ai/sdk"' has no exported member 'BetaStopReason'`. The 10 missing types are declared inside `src/vendor/resources/beta/messages/messages.ts` but were never surfaced at the package root, so the SDK's own `tsc --noEmit` (which uses relative imports) didn't catch the curation defect.

Additionally, the `Beta` namespace declared in `src/vendor/resources/beta/beta.ts` (line 867) was not re-exported, breaking the `PukuAI.Beta.Messages.*` nested-namespace access pattern that puku-cli uses in `src/utils/sideQuery.ts`, `src/utils/analyzeContext.ts`, `src/services/tokenEstimation.ts`, and `src/utils/permissions/yoloClassifier.ts`.

Refs [puku-sh/puku-code-cli#419](https://github.com/puku-sh/puku-code-cli/issues/419).

### Fixed
- **10 missing Beta message types now exported from the package root.** `BetaJSONOutputFormat`, `BetaMessageDeltaUsage`, `BetaOutputConfig`, `BetaRawMessageStreamEvent`, `BetaRedactedThinkingBlock`, `BetaRedactedThinkingBlockParam`, `BetaRequestDocumentBlock`, `BetaStopReason`, `BetaToolChoiceAuto`, `BetaToolChoiceTool` resolve via both `import type { BetaStopReason } from "@puku-ai/sdk"` and the nested `PukuAI.Beta.Messages.BetaStopReason` access pattern.
- **`Beta` namespace re-exported.** `import { Beta } from "@puku-ai/sdk"` now resolves to the namespace declaration in `src/vendor/resources/beta/beta.ts`, restoring the `PukuAI.Beta.Messages.*` access pattern puku-cli relies on.

### Added
- **`examples/issue-419-beta-type-exports.ts`** — type-level regression test covering all three access paths (top-level named import, `Beta.Messages.*`, `PukuAI.Beta.Messages.*`). Wire with `bunx tsc --noEmit -p examples/tsconfig.json`.
- **`examples/tsconfig.json`** — dedicated tsconfig that resolves `@puku-ai/sdk` to the local source tree (mirrors jest's `moduleNameMapper`).

### Notes
- Patch release. No API or runtime behavior changes. `bun update @puku-ai/sdk` under the existing `^4.0.3` constraint will pick this up automatically.

---

## [4.0.6] — 2026-09-16

The Puku gateway now responds to more of the SDK surface, so existing
SDK code that previously received `404` or partial responses now
round-trips end-to-end. No SDK package changes are required — these
fixes live entirely in the gateway.

### Fixed
- **`client.messages.countTokens(...)` works.** Returns `{ input_tokens }` instead of `404 Not Found`.
- **Message batches round-trip end-to-end.** `client.messages.batches.create` / `retrieve` / `results` no longer 404.
- **`client.files.*` works.** `upload`, `list`, `retrieve`, `download`, and `delete` round-trip; `download` returns the original bytes.
- **Session resources round-trip.** `client.beta.sessions.resources.list` / `retrieve` / `create` / `update` / `delete` return resources instead of `404`.
- **Server-side `web_search` executes.** When you register the `web_search` tool, the gateway now runs the search and returns the result as a `web_search_tool_result` block. Previously the tool_use block was returned to your code and you had to handle the search yourself.
- **Structured outputs work in all four flavors.** `output_config.format` (and `response_format`) now returns parseable JSON for `zod`, `json-schema`, `raw`, and `standard-schema` inputs. Previously the model often returned prose instead of JSON for these requests.
- **`messages.stream` no longer crashes on empty `message_delta` events.** The streaming parser tolerates empty data frames from the upstream model.
- **`client.beta.agents.versions.list(...)` works.** Returns an empty page instead of `404`.
- **`client.beta.skills.*` round-trips.** `create` (multipart), `list`, `retrieve`, and `delete` all return Anthropic-shaped responses.
- **`client.beta.skills.versions.*` round-trips.** `create` (multipart), `list` (paginated), `retrieve`, `delete`, and `download` all work. `download` returns a valid (empty) archive blob. Creating the same version twice returns `409 Conflict`.
- **Beta managed-agent sessions actually run.** `client.beta.sessions.events.stream(...)` now emits the Anthropic-shaped event sequence the SDK expects (`session.status_running`, `agent.tool_use`, `user.tool_result`, `agent.message`, `session.status_idle`), so the SDK's `toolRunner` drives a real LLM turn and exits cleanly. `client.beta.agents`, `client.beta.environments`, `client.beta.environments.work.{poll,ack,heartbeat,stop}`, and `client.beta.vaults` all return Anthropic-shaped responses for create / list / retrieve / delete — see the README's "Beta managed-agents surface (preview)" section for what each does.

### Known issues (not regressions)
- **`output_config.format` — streaming variant is occasionally flaky.** Passes most runs. The underlying model sometimes emits a duplicate JSON key in the structured payload which the SDK's Zod parser rejects (`conditions.0` etc.). Re-running usually succeeds. Model-output variance, not a code bug.
- **`output_config.format` — `raw` variant is occasionally flaky.** Same root cause as the streaming variant. The model sometimes emits non-JSON prose (e.g. `I computed …`) or a malformed JSON payload (e.g. an unterminated string) inside the synthetic tool call. Re-running usually succeeds.

---

## [4.0.5] — 2026-09-07

### Fixed
- **Structured outputs reproduction script** added to help users reproduce and report issues with the `output_format` / `output_config.format` JSON parser.

### Notes
- Patch release. No API changes.
