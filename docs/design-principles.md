# Design Principles

These principles explain the decisions behind the Open Talent Protocol schema. When in doubt about how to extend or interpret the spec, return to these.

---

## 1. Machine-first, human-friendly

**The canonical format is JSON. Human-readable output is a derivative.**

Resumes exist to communicate information. Historically, that meant formatting a document for a human reader. In a world where software processes most resumes first, the opposite should be true: the structured data format is primary, and visual representations are generated from it on demand.

This means:

- Fields use consistent, typed values rather than free text wherever possible (`"level": "advanced"` not `"advanced programmer"`).
- Dates are ISO 8601, not `"March 2023"` or `"last year"`.
- Salary is a structured object with `min`, `max`, `currency`, and `period` — not a string like `"€80k+"`.
- Arrays are used instead of comma-separated strings.

At the same time, the format is readable. Field names are English words, not abbreviations. The `description` field on every JSON Schema property explains intent. A human who has never seen the spec should be able to read a conforming document and understand it.

---

## 2. Minimal core, extensible edges

**The core schema is small and stable. Domain-specific richness lives in extensions.**

Version 0.1 deliberately omits fields that are important in some contexts but not universal: patents, publications, military service, volunteer board positions, teaching experience, and so on. These omissions are not oversights — they are choices made to keep the common case simple.

Extension happens through:

- The `custom` object at the root, where any platform or domain can add namespaced keys (`"jobgrow:*"`, `"healthcare:*"`).
- Per-item `custom` fields could be added in future versions at the array-item level.
- Future OTP extension specs can define canonical schemas for vertical domains (healthcare, law, academia) as separate but compatible documents.

The invariant: adding data to `custom` never breaks a conforming parser. Removing `custom` never breaks core functionality.

---

## 3. Privacy by design

**Candidates control their data. Visibility is structural, not an afterthought.**

The `visibility` section exists at the top level and applies recursively. A document owner sets a `defaultVisibility` for the whole document, then overrides specific paths using JSON Pointer references.

Three levels are defined:

- `public` – anyone can read this field.
- `recruiters` – only authenticated employer-side actors (recruiters, hiring agents) can read this.
- `private` – only the candidate and explicitly authorized parties can read this.

Platforms implementing OTP are expected to enforce these visibility rules before sharing or processing documents. The spec does not define the enforcement mechanism — that is a platform concern — but it ensures the intent is encoded in the data itself, not locked in a platform's UI.

This design reflects a core belief: a candidate's professional history belongs to the candidate. The standard should make it easy to share selectively, not make sharing the default.

---

## 4. Verifiability and provenance

**Claims are more useful when their origin is known. Verification is structured, not just a badge.**

Every major array item (`work`, `education`, `skills`, `credentials`, `evidence`) can carry a `verification` object with four fields:

- `level`: who verified it (`self`, `test`, `issuer`, `platform`).
- `issuerName` and `issuerType`: the verifying entity.
- `issuedAt`: when the verification was performed.
- `url`: a link to the artifact.

This allows agents to make trust-weighted decisions. A `level: "self"` work history entry and a `level: "platform"` one are different inputs for matching, even if the human-readable content is identical.

At the document level, the `verification` object records `createdBy`, `createdAt`, `updatedBy`, and an `integrity` hash. The hash is informational in v0.1 but provides the foundation for tamper detection in future versions.

The spec is deliberately not a full verifiable credentials system (see principle 6). It records provenance in a way that is easy to produce and consume, without requiring cryptographic infrastructure.

---

## 5. Preferences are first-class

**Matching happens on preferences, not just history.**

Most resume formats treat a candidate's job search preferences — roles, salary, location, work mode, constraints — as metadata or cover letter material. They are not part of the structured data.

In the Open Talent Protocol, `preferences` is a top-level section with fully typed fields. This is a deliberate architectural decision for agentic markets:

- A hiring agent's first filter is preferences, not work history. It is wasteful to parse 10 years of work history to discover that the candidate requires a salary the role cannot offer.
- Agents can negotiate on preferences (e.g., an employer agent proposes a slightly lower salary with a higher equity component) without reading or re-reading work history.
- Candidates can update preferences independently of experience — the two are logically separate.

The `constraints` sub-object is especially important: it is where non-negotiable conditions live. An OTP-compliant agent must not present a role to a candidate whose constraints the role violates.

---

## 6. Interoperability over purity

**Perfect should not block good. Map to existing standards, don't fight them.**

The Open Talent Protocol does not require implementors to abandon their existing tooling. It is designed to be imported from and exported to:

- **JSON Resume** (see `migration-json-resume.md`): All core JSON Resume fields map directly. OTP adds sections; it does not rename or restructure existing ones without cause.
- **HR-XML** (see `migration-hrxml.md`): Complex enterprise HR-XML fields that have no OTP equivalent go into `custom`, preserving the data without bloating the core.
- **schema.org**: OTP's field names and structures are chosen to make JSON-LD framing natural. A future context document can make any OTP document a valid schema.org `Person` with `workExperience` and `hasCredential` properties.

Interoperability is not compatibility theater. The goal is that moving data between systems loses as little as possible, and that what is lost is documented.

---

## 7. Simplicity over completeness

**A partial answer that is correct is better than a complete answer that is wrong.**

HR-XML can represent nearly anything a global HR system might need. The Open Talent Protocol represents what a person needs to present themselves professionally to an employer. These are different scopes.

When designing a new field, the question is not "could this ever be useful?" but "would a junior developer in Berlin, a senior PM in Milan, and a mid-career nurse in Warsaw all have a meaningful value for this?" If the answer is no, the field belongs in `custom` or a domain extension, not in the core schema.

This principle is why fields like `patents`, `publications`, and `referees` are absent from v0.1. They are important in some professions. They are not universal. They can be added in `custom` today and promoted to extensions tomorrow.

---

## 8. Stability through explicitness

**Ambiguous fields create incompatible implementations. Explicit enums and formats create interoperability.**

Where a field's valid values are bounded, OTP uses an `enum`. Where a field is a date, OTP uses `format: "date"`. Where a code should follow an external standard (country codes, currency codes, language tags), OTP says so and links to the standard.

This makes parsers simple and validation meaningful. A validator does not need domain knowledge to catch `"employmentType": "freelancer"` (should be `"freelance"`) or `"currency": "euro"` (should be `"EUR"`).

Free text is reserved for fields that are genuinely free-form: `summary`, `highlights`, `notes`. Everything that can be structured is structured.
