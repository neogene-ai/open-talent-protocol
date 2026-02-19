# Agent Examples

This folder contains stubs and examples for integrating the Open Talent Protocol (OTP) into agentic AI systems.

## Why agents?

The Open Talent Protocol is designed from the ground up to be consumed by software agents — not just by humans or PDFs. In an agentic talent marketplace:

- A **candidate agent** holds or has access to the candidate's OTP document. It presents the right profile to the right employer, negotiates on preferences, and updates the document as the candidate's situation changes.
- A **hiring agent** receives OTP documents, evaluates them against a job specification, and communicates match results back to the candidate agent.

For this to work reliably, agents need structured tools to:

1. **Validate** that a document is a well-formed OTP document before reasoning over it.
2. **Introspect** the document — extract normalized views of skills, work history, preferences, and verification status — without re-parsing raw JSON every time.

That is what this folder provides: lightweight, composable building blocks for building OTP-aware agents.

---

## Contents

| File | Description |
|------|-------------|
| `src/otp-tools.ts` | Core tool implementations: `validateProfile` and `introspectProfile`. |
| `src/example-agent-loop.ts` | Illustrative agent loop showing how a candidate agent would call these tools. |

---

## Design principles

### Designed for MCP and similar frameworks

The tools in this folder are written as plain TypeScript functions with typed inputs and outputs. They are intentionally framework-agnostic, but structured so that wrapping them as [Model Context Protocol (MCP)](https://modelcontextprotocol.io) tools requires minimal boilerplate:

- Each tool takes a single structured input object.
- Each tool returns a structured result object (never throws on validation failure; errors are returned in-band).
- Tool names and descriptions follow MCP naming conventions.

To expose these as MCP tools, wrap each function in your MCP server's `tool()` registration call, passing the function's input/output types as the schema.

### Designed for composability

A candidate agent typically needs to:

1. Validate the profile on load (catch corruption early).
2. Introspect preferences before beginning any matching conversation.
3. Introspect skills and work history when responding to a specific job inquiry.
4. Re-validate after any agent-driven update.

Each tool is independently callable so agents can do exactly what they need, when they need it.

---

## Quick start

```bash
# From the repo root
cd tools/agent-examples
npm install
npm run build

# Run the example agent loop against a sample profile
node dist/example-agent-loop.js ../../examples/developer-junior.json
```

---

## Extending these stubs

To build a production candidate agent on top of these tools:

1. Copy or import `otp-tools.ts` into your agent's codebase.
2. Wrap `validateProfile` and `introspectProfile` as tool definitions in your MCP server or agent framework.
3. Add additional tools for operations like `updatePreferences`, `addWorkEntry`, or `computeMatchScore` as your use case requires.
4. Use `introspectProfile` outputs as context in your agent's system prompt when reasoning about a candidate.

The OTP schema is the contract. Any agent that produces or consumes documents conforming to `schema/opentalent-protocol.schema.json` is interoperable with any other OTP-aware agent.
