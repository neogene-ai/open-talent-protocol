# Governance Roadmap

This document outlines how the Open Talent Protocol's governance is structured today and how it may evolve as the project grows. It is **aspirational, not binding** — its purpose is to show that the project is designed to be sustainable infrastructure, not a side-effect of any one company's roadmap.

---

## Current model (v0.1)

The project currently operates under a **maintainer council** model as described in [GOVERNANCE.md](../GOVERNANCE.md):

- All decisions are made by the maintainer council using lazy consensus or, where needed, a simple majority vote.
- The initial maintainers come from the organization that originated the project (neogene.ai / JobGrow).
- The process is public, documented, and open to external participation from day one.

This model is lightweight and appropriate for a project in its earliest stage. It prioritizes moving fast and making real decisions over process for its own sake.

**What we commit to, even now:**

- All schema changes are discussed publicly in GitHub issues before merging.
- The schema version is incremented deliberately; nothing breaks without warning.
- The project accepts external contributors and takes their input seriously.
- The MIT license is permanent; the spec will never be locked down.

---

## Contributor → maintainer path

Growing the maintainer base is important for the long-term health and neutrality of the project. Here is the rough path:

### What makes a good maintainer candidate?

A maintainer candidate should have demonstrated, over a period of **at least three months**:

- **Schema contributions**: proposed or meaningfully reviewed schema changes; understands the design principles.
- **Tooling or documentation contributions**: shipped something real (validator improvements, migration guides, agent examples, etc.).
- **Design participation**: engaged substantively in discussions about direction, trade-offs, or compatibility.
- **Community behavior**: consistently respectful, constructive, and aligned with the project's values.

There is no minimum number of PRs merged. Quality and judgment matter more than quantity.

### Nomination process

1. Any active maintainer opens a GitHub issue titled `Nomination: <GitHub handle>`.
2. The issue describes the candidate's contributions and why they would make a good maintainer.
3. The community has 5 business days to comment.
4. If a majority of active maintainers approve, the candidate is added to `MAINTAINERS` and granted merge rights.
5. The candidate is notified and onboarded (access, expectations, contacts).

### First external maintainer

A concrete goal for v0.2 is to have **at least one maintainer from outside neogene.ai/JobGrow**. This is the clearest signal that the project is genuinely open. If you are an early adopter and interested in helping govern the spec, open an issue and say so.

---

## Toward neutral foundation hosting (12–24 month horizon)

If the project gains meaningful adoption across organizations — multiple platforms implementing it, candidates and employers relying on it, agents consuming it — it becomes important to move governance beyond any single company's control.

### Signals that would indicate readiness

- Three or more distinct organizations (platforms, employers, or tool vendors) implementing the schema in production.
- A maintainer council that includes people from at least two organizations.
- Active community discussion in issues and discussions, not just consumption.
- External requests to participate in governance or specification evolution.

### What "moving to a foundation" would likely mean

Possible homes include:

- A **Linux Foundation** project (e.g., under the LF AI & Data umbrella or a new Agentic AI working group).
- An **OpenAPI Initiative**-style working group if the agentic HR/talent space develops its own consortium.
- A standalone **Open Talent Protocol Foundation** if the community is large enough to justify it.

Regardless of structure, the following would remain constant:

- MIT license. The spec is and will always be free to implement.
- Public, documented decision-making. No closed-door steering.
- Candidate data sovereignty as a core value — no governance model may impose data flows that undermine it.

What would change:

- A formal steering committee with representation from adopting organizations.
- Likely alignment with emerging agentic AI standards from other foundations.
- More rigorous RFC process for schema changes.
- Possible trademark registration of "Open Talent Protocol" to prevent fragmentation.

### What would NOT change

Moving to a foundation is not a commercialization event. The spec stays open. JobGrow (and any other initial sponsor) does not gain preferential treatment over other adopters once the project is donated to neutral governance.

---

## Intentional direction, not a promise

This document does not commit the project to any specific governance structure or timeline. It commits to one thing: **the project is designed to outlast its originators**. The schema, tooling, and governance are built with the assumption that one day someone other than neogene.ai will be running it.

If you are evaluating the Open Talent Protocol for adoption and have questions about governance, open an issue. We would rather answer hard questions early than discover misaligned expectations later.
