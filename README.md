# Open Talent Protocol

**An open, agent-ready standard for professional profiles.**

---

## What is this?

The Open Talent Protocol is an open, machine-first data standard for representing a person's professional profile. It defines a single JSON document format that any platform, tool, or autonomous agent can read, write, and reason over — without depending on a specific vendor.

Think of it as a resume designed to be read by software first, and rendered for humans second.

This repository contains:

- The **JSON Schema** defining the format (`schema/`)
- **Example documents** for three different professions (`examples/`)
- **Documentation** including design principles and migration guides (`docs/`)
- A **validator CLI** for checking documents against the schema (`tools/validator-cli/`)

---

## Why does this exist?

Existing resume formats — PDF, Word, LinkedIn exports, even JSON Resume — were designed for humans reading documents or for single-platform use. As autonomous hiring agents and career assistants become real, we need a format that:

- Encodes job preferences as first-class structured data, not cover letter prose
- Carries verification and provenance metadata so agents can weight claims
- Includes privacy controls so candidates decide what to share and with whom
- Is owned by the candidate, importable anywhere, and exportable everywhere

The Open Talent Protocol is that format.

---

## Motivation and ecosystem fit

The Open Talent Protocol is the canonical profile format for the **JobGrow** agentic career marketplace, but it is deliberately designed to be vendor-neutral. Any platform can implement it. Any candidate can export a conforming document and import it elsewhere without data loss.

The standard builds on prior art:

- **JSON Resume** — vocabulary and field naming; OTP is a superset. See [`docs/migration-json-resume.md`](docs/migration-json-resume.md).
- **schema.org** — OTP fields map naturally to `Person`, `Occupation`, and related types, enabling JSON-LD compatibility.
- **HR-XML / HR Open Standards** — reference for enterprise HR data modeling; OTP covers the candidate-facing slice. See [`docs/migration-hrxml.md`](docs/migration-hrxml.md).

---

## Schema

The core schema is at [`schema/opentalent-protocol.schema.json`](schema/opentalent-protocol.schema.json).

It is a JSON Schema (draft 2020-12) document describing an object with these top-level sections:

| Section | Required | Description |
|---------|----------|-------------|
| `meta` | **Yes** | Schema version, language, source. |
| `identity` | **Yes** | Name, contact details, profiles, work authorization. |
| `summary` | No | Plain-text professional summary. |
| `work` | No | Chronological work history with highlights and impact metrics. |
| `education` | No | Formal education history. |
| `skills` | No | Normalized skill inventory with levels and categories. |
| `projects` | No | Selected projects with technologies and links. |
| `credentials` | No | Certifications and regulated licenses. |
| `languages` | No | Human language proficiencies (CEFR). |
| `preferences` | No | **Agent-facing** job search preferences and constraints. |
| `evidence` | No | Portfolio artifacts linked to skills and experience. |
| `verification` | No | Document provenance and integrity hash. |
| `visibility` | No | Privacy controls: default level and per-field overrides. |
| `custom` | No | Extension namespace for platform-specific fields. |

---

## Examples

Three complete example documents are in [`examples/`](examples/):

| File | Profile |
|------|---------|
| [`developer-junior.json`](examples/developer-junior.json) | Lukas Bauer — junior frontend developer in Berlin |
| [`product-manager-senior.json`](examples/product-manager-senior.json) | Sofia Marchetti — Head of Product in EU fintech |
| [`nurse-midcareer.json`](examples/nurse-midcareer.json) | Marta Kowalczyk — mid-career oncology nurse in Warsaw |

These examples illustrate how `preferences`, `verification`, and `visibility` work in practice, and demonstrate that the schema is not developer-centric.

---

## Validate a document

### Prerequisites

- Node.js 18+
- npm or a compatible package manager

### Install and run

```bash
# From the repo root
cd tools/validator-cli
npm install
npm run build

# Validate one of the example documents
node dist/index.js ../../examples/developer-junior.json

# Or validate your own document
node dist/index.js /path/to/your/profile.json
```

Successful output:

```
✓ Valid Open Talent Protocol document
```

On failure, the validator prints a list of specific errors with JSON Pointer paths.

---

## Integrate with other systems

### Import from JSON Resume

See [`docs/migration-json-resume.md`](docs/migration-json-resume.md) for a field-by-field mapping. All core JSON Resume fields map to OTP; OTP adds `preferences`, `verification`, and `visibility` which must be populated separately.

### Import from HR-XML

See [`docs/migration-hrxml.md`](docs/migration-hrxml.md). The mapping is many-to-one in some areas and intentionally lossy for internal ATS fields (recruiter notes, workflow state, compensation history) that do not belong in a candidate-controlled document.

### Use in your own platform

1. Validate incoming documents with the validator CLI or by embedding `ajv` in your application.
2. Index the `preferences` section first for matching; it is designed to be the primary filter.
3. Use `visibility` to enforce access controls before returning data to any consumer.
4. Use `custom` for any platform-specific fields, namespaced as `"yourplatform:fieldName"`.

---

## Documentation

| Document | Description |
|----------|-------------|
| [`docs/overview.md`](docs/overview.md) | High-level explanation of goals and design. |
| [`docs/design-principles.md`](docs/design-principles.md) | Principles behind schema decisions. |
| [`docs/migration-json-resume.md`](docs/migration-json-resume.md) | JSON Resume → OTP field mapping. |
| [`docs/migration-hrxml.md`](docs/migration-hrxml.md) | HR-XML → OTP migration guide. |

---

## Status

This is **v0.1** — minimal but opinionated. It covers the core use cases and is expected to evolve based on real-world adoption.

Planned for future versions:
- Extension schemas for specific verticals (healthcare, academia, legal)
- JSON-LD context document for schema.org compatibility
- Verifiable credentials integration (W3C VC)
- Agent-to-agent negotiation protocol (separate spec)

Breaking changes before 1.0 will increment the minor version (`0.2`, `0.3`, …). The `meta.schemaVersion` field in every document makes it easy to handle multiple versions.

---

## Contributing

Issues and pull requests are welcome. Please open an issue before submitting a large change.

---

## License

[MIT](LICENSE) — Copyright (c) 2026 neogene.ai
