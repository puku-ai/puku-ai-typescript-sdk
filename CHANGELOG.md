# Changelog

All notable changes to `@puku-ai/sdk` are documented in this file.

This project follows [Semantic Versioning](https://semver.org/). The latest published version is **4.0.6**.

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
