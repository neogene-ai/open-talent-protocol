# Migration Guide: JSON Resume → Open Talent Protocol

This guide describes how to translate a document conforming to the [JSON Resume schema](https://jsonresume.org/schema/) into an Open Talent Protocol (OTP) document. The mapping is intended to be lossless for all core fields.

---

## Overview

JSON Resume and the Open Talent Protocol share much of the same vocabulary. Both use JSON, and both model the same fundamental units: work history, education, skills, projects, and credentials. The primary differences are:

1. OTP adds sections that JSON Resume does not have: `preferences`, `evidence`, `verification` (document-level and per-item), and `visibility`.
2. OTP uses a `meta` wrapper instead of inline version information.
3. Some field names are slightly different (see table below).
4. OTP normalizes enumerations that JSON Resume leaves as free text (e.g., `employmentType`, `skills[].level`).

---

## Section-by-section mapping

### `basics` → `identity` + `summary`

JSON Resume puts core identity and contact information in a `basics` object. OTP splits this across `identity` (structured contact data) and `summary` (the plain-text professional blurb).

| JSON Resume field | OTP path | Notes |
|---|---|---|
| `basics.name` | `identity.fullName` | Direct rename. |
| `basics.label` | No direct equivalent | If it represents a current job title, it can go in `custom`. The preferred approach is to derive the label from `work[0].role`. |
| `basics.image` | No direct equivalent | OTP deliberately omits photo fields to reduce bias vectors. Store in `custom` if needed. |
| `basics.email` | `identity.contact.email` | Direct. |
| `basics.phone` | `identity.contact.phone` | Direct. |
| `basics.url` | `identity.profiles[]` | Create a profile entry with `"network": "personal"` and the URL. |
| `basics.summary` | `summary` | Promoted to top-level string. |
| `basics.location.address` | No direct equivalent | Store in `custom` or omit; OTP location intentionally does not store street addresses. |
| `basics.location.postalCode` | `identity.contact.location.postalCode` | Direct. |
| `basics.location.city` | `identity.contact.location.city` | Direct. |
| `basics.location.countryCode` | `identity.contact.location.country` | Direct (both use ISO 3166-1 alpha-2). |
| `basics.location.region` | `identity.contact.location.region` | Direct. |
| `basics.profiles[].network` | `identity.profiles[].network` | Direct. |
| `basics.profiles[].username` | `identity.profiles[].username` | Direct. |
| `basics.profiles[].url` | `identity.profiles[].url` | Direct. |

> OTP does not have a `basics.label` equivalent at the top level. The person's current title is recorded in `work[0].role`. A desired future title goes in `preferences.desiredRoles`.

---

### `work` → `work`

The mapping is close to 1:1. OTP adds `impact`, `tags`, `employmentType`, and optional `verification`.

| JSON Resume field | OTP path | Notes |
|---|---|---|
| `work[].name` | `work[].organization` | Renamed for clarity (`name` is ambiguous). |
| `work[].url` | `work[].organizationUrl` | Renamed for clarity. |
| `work[].position` | `work[].role` | Renamed (`position` reads as a noun, `role` reads as both noun and function). |
| `work[].startDate` | `work[].startDate` | Direct. OTP requires ISO 8601 date format (`YYYY-MM-DD`). Convert partial dates (e.g., `"2021"`) to `"2021-01-01"`. |
| `work[].endDate` | `work[].endDate` | Same as above. |
| `work[].summary` | No direct equivalent | If the summary is a narrative paragraph, it can become the first entry in `work[].highlights`. |
| `work[].highlights[]` | `work[].highlights[]` | Direct. |
| `work[].description` | No direct equivalent | Can be stored in `custom` on the work item, or merged into the first `highlights` entry. |

Fields OTP adds that have no JSON Resume equivalent: `work[].current`, `work[].employmentType`, `work[].impact`, `work[].tags`, `work[].location`, `work[].verification`. These should be populated from available context if possible, or left undefined.

---

### `volunteer` → `work[]` with `employmentType: "volunteer"`

JSON Resume has a separate top-level `volunteer` array. OTP consolidates volunteer work into `work` with the `"volunteer"` employment type. Map each `volunteer` entry as a `work` entry and set `"employmentType": "volunteer"`.

---

### `education` → `education`

| JSON Resume field | OTP path | Notes |
|---|---|---|
| `education[].institution` | `education[].institution` | Direct. |
| `education[].url` | `education[].institutionUrl` | Renamed. |
| `education[].area` | `education[].field` | Renamed (field of study). |
| `education[].studyType` | `education[].degree` | Renamed. |
| `education[].startDate` | `education[].startDate` | Direct. ISO 8601 required. |
| `education[].endDate` | `education[].endDate` | Direct. |
| `education[].score` | `education[].grade` | Renamed. Free text accepted in both formats. |
| `education[].courses[]` | `education[].highlights[]` | Relevant courses can be stored as highlight bullets. |

---

### `awards` → `credentials[]` or `evidence[]`

JSON Resume's `awards` array has no direct OTP equivalent but maps cleanly to either `credentials` (for formal recognitions) or `evidence` (for portfolio-style proofs).

| JSON Resume field | OTP path | Notes |
|---|---|---|
| `awards[].title` | `credentials[].name` or `evidence[].title` | Depends on whether it is a formal credential or a portfolio item. |
| `awards[].date` | `credentials[].issueDate` | Direct. |
| `awards[].awarder` | `credentials[].issuer` | Direct. |
| `awards[].summary` | `credentials` has no summary field | Store in `custom` or prepend to `evidence[].description`. |

---

### `certificates` → `credentials`

This is a direct mapping.

| JSON Resume field | OTP path | Notes |
|---|---|---|
| `certificates[].name` | `credentials[].name` | Direct. |
| `certificates[].date` | `credentials[].issueDate` | Direct. |
| `certificates[].issuer` | `credentials[].issuer` | Direct. |
| `certificates[].url` | `credentials[].url` | Direct. |

---

### `publications` → `evidence[]`

| JSON Resume field | OTP path | Notes |
|---|---|---|
| `publications[].name` | `evidence[].title` | Direct rename. |
| `publications[].publisher` | `evidence[].issuer` | Direct rename. |
| `publications[].releaseDate` | No direct OTP field | Store in `custom`. |
| `publications[].url` | `evidence[].url` | Direct. |
| `publications[].summary` | `evidence[].description` | Direct. |

Set `evidence[].type` to `"publication"`.

---

### `skills` → `skills`

| JSON Resume field | OTP path | Notes |
|---|---|---|
| `skills[].name` | `skills[].name` | Direct. |
| `skills[].level` | `skills[].level` | OTP normalizes to `enum: ["beginner", "intermediate", "advanced", "expert"]`. Map JSON Resume's free-text levels (e.g., `"Master"`, `"Intermediate"`) to the closest OTP value. |
| `skills[].keywords[]` | No direct equivalent | Keywords become separate `skills` entries or go in `work[].tags`. |

---

### `languages` → `languages`

| JSON Resume field | OTP path | Notes |
|---|---|---|
| `languages[].language` | `languages[].name` | Direct. Add `languages[].code` as a BCP 47 tag (e.g., `"de"`, `"fr"`). |
| `languages[].fluency` | `languages[].level` | OTP uses CEFR levels (`A1`–`C2`, `native`). Map JSON Resume free-text fluency (e.g., `"Fluent"`, `"Native Speaker"`) to the appropriate CEFR level. |

---

### `interests` → `custom`

OTP does not have a first-class `interests` section. Store the array at `custom["jsonresume:interests"]` or drop it if not needed for matching.

---

### `references` → `custom`

OTP does not include references; sharing contact details of third parties raises privacy concerns and references are rarely used in agentic matching. Store at `custom["jsonresume:references"]` if required.

---

### `projects` → `projects`

| JSON Resume field | OTP path | Notes |
|---|---|---|
| `projects[].name` | `projects[].name` | Direct. |
| `projects[].description` | `projects[].description` | Direct. |
| `projects[].highlights[]` | No direct equivalent | Can be appended to `projects[].description` as bullet points. |
| `projects[].keywords[]` | `projects[].technologies[]` | Rename. |
| `projects[].startDate` | `projects[].startDate` | Direct. |
| `projects[].endDate` | `projects[].endDate` | Direct. |
| `projects[].url` | `projects[].links[]` | Create a link entry with `"label": "Project"` and the URL. |
| `projects[].roles[]` | `projects[].role` | OTP uses a single string; join multiple roles with a comma if needed. |
| `projects[].entity` | No direct equivalent | Store in `custom`. |
| `projects[].type` | No direct equivalent | Store in `custom`. |

---

## Fields with no OTP equivalent

These JSON Resume fields have no standard OTP home. For any that are important to preserve, use the `custom` object with a `"jsonresume:"` prefix to namespace them:

- `basics.label`
- `basics.image`
- `interests[]`
- `references[]`
- `projects[].entity`
- `projects[].type`
- `work[].summary` (or merge into `highlights`)

---

## Adding OTP-only sections after migration

After mapping all JSON Resume fields, consider enriching the OTP document with sections that have no JSON Resume equivalent:

- **`preferences`** — crucial for agentic matching; populate from any context available (candidate questionnaire, recruiter notes, etc.).
- **`verification`** (per-item) — add at least `"level": "self"` to indicate the document is self-reported.
- **`visibility`** — set `defaultVisibility` based on the candidate's sharing preferences.
- **`meta`** — set `schemaVersion: "0.1"`, `source: "import:jsonresume"`, and `lastUpdated`.
