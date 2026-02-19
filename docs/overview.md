# Open Talent Protocol – Overview

## What is the Open Talent Protocol?

The Open Talent Protocol (OTP) is an open, machine-first standard for representing a person's professional profile. It defines a single JSON document format that any platform, tool, or autonomous agent can read, write, and reason over — without depending on a specific vendor or proprietary format.

Think of it as a resume that knows how to talk to software.

Version 0.1 is intentionally minimal: it covers the data that matters most and provides clear extension points for what comes next.

---

## Why does this exist?

### The problem with today's resumes

The dominant resume formats — PDF, Word documents, and even most structured formats like LinkedIn exports — were designed for humans reading documents, not software processing data. As a result:

- ATSs parse them with fragile heuristics and lose information.
- Recruiters re-key data between systems.
- Candidates fill out the same fields dozens of times.
- AI tools train on and reproduce inconsistent, unstructured text.

When autonomous agents try to match candidates to roles, they are working with imprecise, lossy representations of real people.

### The opportunity

A consistent, structured, machine-first format lets:

- **Candidate agents** present exactly the right information to the right employer, in the right format, every time.
- **Hiring agents** evaluate candidates fairly and reproducibly, against explicit criteria.
- **Platforms** import and export profiles without lossy conversion.
- **Candidates** control their own data: what is shown, to whom, and when.

### Why not just use JSON Resume?

JSON Resume is a good standard and the Open Talent Protocol deliberately maps to it (see `migration-json-resume.md`). But JSON Resume was designed for human-facing themes and rendering, not agentic negotiation. It lacks:

- A first-class `preferences` section for matching.
- Structured `verification` and provenance fields.
- `visibility` controls for privacy.
- `impact` metrics as structured data.
- A path toward JSON-LD and semantic web compatibility.

The Open Talent Protocol builds on JSON Resume's vocabulary, adds what is missing, and removes what is out of scope.

---

## Design goals

| Goal | Description |
|------|-------------|
| **Machine-first** | JSON is the canonical format. Human rendering (PDF, HTML) is done by separate tooling and is out of scope for this spec. |
| **Candidate-controlled** | The candidate owns the document. Privacy overrides are built in, not bolted on. |
| **Agent-ready** | `preferences`, `verification`, and `impact` are first-class fields designed to be consumed by autonomous agents. |
| **Open and vendor-neutral** | MIT licensed. No required dependency on any platform, registry, or identity provider. |
| **Extensible, not bloated** | The `custom` namespace allows domain-specific extensions without polluting the core schema. |
| **Interoperable** | Clearly mappable to JSON Resume, HR-XML, and schema.org vocabularies. |

---

## Non-goals

- **Rendering and theming.** How a document looks as a PDF or webpage is explicitly outside scope. Use any resume theme that can consume this format.
- **Identity verification.** OTP records who verified something and at what level, but it is not an identity provider and does not issue credentials.
- **Real-time negotiation protocol.** The format is the data layer. The wire protocol for agent-to-agent negotiation is a separate concern.
- **Exhaustive HR data modeling.** Enterprise HR systems (SAP SuccessFactors, Workday, etc.) model far more than a candidate profile. OTP covers the candidate-facing slice only.

---

## Document structure at a glance

An Open Talent Protocol document is a single JSON object with these top-level sections:

| Section | Required | Purpose |
|---------|----------|---------|
| `meta` | Yes | Schema version, language, source, and last-updated timestamp. |
| `identity` | Yes | Name, contact, profiles, and work authorization. |
| `summary` | No | Short professional summary in plain text. |
| `work` | No | Chronological work history with structured highlights and impact metrics. |
| `education` | No | Formal education history. |
| `skills` | No | Normalized skill inventory with levels, categories, and optionally years of experience. |
| `projects` | No | Selected personal or professional projects. |
| `credentials` | No | Certifications, degrees, and regulated licenses. |
| `languages` | No | Human language proficiencies using CEFR levels. |
| `preferences` | No | Job search preferences for agentic matching (roles, locations, salary, constraints). |
| `evidence` | No | Portfolio artifacts and proof-of-work linked to skills and experience. |
| `verification` | No | Document-level provenance: who created it, when, and an integrity hash. |
| `visibility` | No | Privacy controls: default visibility level and per-field overrides. |
| `custom` | No | Free extension namespace for platform-specific or domain-specific data. |

---

## Versioning

This document describes **v0.1** of the Open Talent Protocol. The `meta.schemaVersion` field in every document must be set to `"0.1"`.

Breaking changes will increment the minor version (0.2, 0.3, …) until the standard stabilizes, at which point a 1.0 will be published. Implementations should validate against the schema version declared in the document.

---

## Relation to other standards

| Standard | Relationship |
|----------|-------------|
| **JSON Resume** | Primary inspiration for vocabulary and field naming. OTP is a superset. A lossless mapping exists in both directions. |
| **schema.org** | OTP fields map naturally to `Person`, `EducationalOccupationalCredential`, `Occupation`, and related types. JSON-LD framing is possible. |
| **HR-XML** | OTP can receive data migrated from HR-XML `Resume` objects. Not all enterprise fields are preserved; complex fields go into `custom`. |
| **OpenID Connect / DID** | Future versions may add integration points for decentralized identity and verifiable credentials. Out of scope for v0.1. |
