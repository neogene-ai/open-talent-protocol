# Governance

## Project scope

The Open Talent Protocol (OTP) is an open, vendor-neutral JSON/JSON-LD data standard for representing professional profiles. It is designed for use by humans, platforms, and autonomous agents in modern talent and career ecosystems.

OTP is not controlled by any single company. Its specification, schema, tooling, and documentation are developed in the open under the MIT license. Any individual, team, or organization may implement, adopt, or extend it without requiring permission.

---

## Roles

### Contributors

Anyone who submits an issue, pull request, or participates in a discussion is a contributor. No special access or approval is required to contribute.

### Maintainers

Maintainers are trusted individuals with the authority and responsibility to:

- Review and merge pull requests.
- Cut releases and update the schema version.
- Drive evolution of the specification.
- Enforce the [Code of Conduct](CODE_OF_CONDUCT.md).

The current list of maintainers is kept in the `MAINTAINERS` file at the repository root. Each entry includes name, affiliation, and GitHub handle.

---

## Decision-making

### Default: lazy consensus

Most decisions — bug fixes, documentation improvements, non-breaking schema additions, tooling changes — are made by **lazy consensus**:

1. A pull request or proposal is opened and described clearly.
2. Maintainers have **5 business days** to review and raise objections.
3. If no maintainer raises a sustained objection within that window, the PR may be merged by any maintainer.
4. Trivial fixes (typos, broken links, formatting) may be merged sooner at maintainer discretion.

### Breaking or controversial changes

Changes that are breaking (incrementing the minor version), architecturally significant, or where at least one maintainer raises a sustained objection require an **explicit decision**:

1. The proposer opens a GitHub issue or discussion labeled `proposal`.
2. A minimum 10 business-day comment window applies.
3. If consensus is still not reached, a simple majority vote among active maintainers decides. Each maintainer has one vote. Votes are cast openly in the GitHub thread.

### Schema versioning

Breaking changes to the schema increment the minor version (`0.1 → 0.2`). Additive, backward-compatible changes may be released as patch notes within the same minor version. Maintainers must document changes in `CHANGELOG.md` for every release.

---

## Becoming a maintainer

Any contributor may be nominated as a maintainer. Criteria for nomination:

- Sustained, high-quality contributions over at least three months (issues, PRs, design discussions, documentation, or tooling).
- Demonstrated understanding of the spec's goals and design principles.
- Constructive, respectful engagement with the community.

**Process:**

1. Any existing maintainer opens a `nomination:` issue naming the candidate and summarizing their contributions.
2. The nomination is open for 5 business days.
3. If a majority of active maintainers approve (no veto), the candidate is added to `MAINTAINERS` and granted repository access.

---

## Stepping down and removal

### Stepping down voluntarily

Maintainers may step down at any time by opening a PR removing themselves from `MAINTAINERS`. Their contributions remain credited and they are welcome to return as contributors.

An inactive maintainer (no substantive activity for six months) may be moved to "emeritus" status after a brief courtesy notice.

### Removal

In rare cases, a maintainer may be removed for:

- Sustained violation of the [Code of Conduct](CODE_OF_CONDUCT.md).
- Repeated actions that are clearly contrary to the project's interests, after good-faith discussion has failed.

Removal requires a two-thirds majority vote of the remaining active maintainers, conducted privately if necessary to protect affected parties.

---

## Conflict resolution

1. **Direct discussion first.** Most disagreements are resolved in the relevant issue or pull request thread. Be direct, specific, and respectful.
2. **Maintainer mediation.** If a contributor and a maintainer are in conflict, another maintainer can be asked to mediate.
3. **Majority vote.** If maintainers themselves disagree, the decision goes to a simple majority vote as described above.
4. **Steering group (future).** If and when the project moves under a neutral foundation or establishes a formal steering group, that group serves as the final escalation path. Until then, the maintainer council is the final authority.

---

## Amendments to this document

Changes to this governance document follow the same "breaking or controversial changes" process: a 10 business-day comment window and explicit majority approval from active maintainers.
