# Migration Guide: HR-XML Resume → Open Talent Protocol

This guide describes at a high level how to migrate data from an HR-XML `Resume` object into an Open Talent Protocol (OTP) document.

HR-XML (now maintained under the HR Open Standards Consortium as the Talent Standards) is an enterprise-oriented XML vocabulary designed for ATS integration, large-scale HR data exchange, and compliance workflows. It models far more than a candidate-facing profile: it includes structured compensation history, regulatory compliance flags, internal candidate IDs, recruiter notes, and workflow state.

The Open Talent Protocol covers only the candidate-facing slice of this data. The migration is therefore **many-to-one in some areas** (several HR-XML concepts collapse into one OTP field) and **lossy in others** (enterprise fields that have no meaningful candidate-facing representation are dropped or moved to `custom`).

---

## Migration philosophy

- **Preserve what matters to the candidate.** Work history, education, skills, credentials, and contact information map cleanly.
- **Drop or archive what is internal.** Recruiter notes, ATS workflow state, internal candidate IDs, and legal compliance flags do not belong in a candidate-controlled document.
- **Namespace what is proprietary.** HR-XML fields that have no OTP home but that an implementing platform needs to retain should be stored in `custom` with a clear namespace (e.g., `"hrxml:*"` or `"ats:*"`).

---

## High-level section mapping

### `StructuredResume` / `ResumeHeader` → `meta` + `identity`

HR-XML resumes carry a document header with creation timestamps, source system identifiers, and sometimes a schema version. Map these to OTP's `meta` section.

The resume's `ContactMethod` elements (address, phone, email) map to `identity.contact`. HR-XML typically separates postal address components in detail (street, building number, postal code); OTP's location object is coarser by design — street-level address is not stored.

The `PersonName` composite maps to `identity.fullName` (formatted name) and `identity.preferredName` if a `PreferredGivenName` element is present.

---

### `EmploymentHistory` → `work[]`

Each `PositionHistory` element in HR-XML maps to a `work` entry. The main field correspondences are:

| HR-XML | OTP path | Notes |
|---|---|---|
| `PositionHistory.PositionTitle` | `work[].role` | Direct. |
| `PositionHistory.OrganizationName` | `work[].organization` | Direct. |
| `PositionHistory.StartDate` | `work[].startDate` | Convert from `xsd:date` or flex-date to ISO 8601. |
| `PositionHistory.EndDate` | `work[].endDate` | Same. If absent and position is current, set `work[].current: true`. |
| `PositionHistory.Description` | `work[].highlights[]` | Parse or split into bullet points. |
| `PositionHistory.JobCategory` | `work[].tags[]` | May map to multiple tags. |
| `PositionHistory.EmployerContactInfo` | `work[].organizationUrl` | Use the organization URL if available. |

HR-XML's `PositionHistory` may also carry structured compensation history, performance ratings, and termination codes. These are internal HR fields and should not be migrated into OTP. Drop them or store under `custom["hrxml:compensation"]` if the platform needs to retain them.

---

### `EducationHistory` → `education[]`

| HR-XML | OTP path | Notes |
|---|---|---|
| `EducationHistory.SchoolOrInstitution.OrganizationName` | `education[].institution` | Direct. |
| `EducationHistory.Degree.DegreeName` | `education[].degree` | Direct. |
| `EducationHistory.Degree.FieldOfStudy` | `education[].field` | Direct. |
| `EducationHistory.StartDate` / `EndDate` | `education[].startDate` / `endDate` | Convert to ISO 8601. |
| `EducationHistory.Degree.EducationalMeasure` | `education[].grade` | The measure type (GPA, percentage, etc.) is free-text in OTP. |
| `EducationHistory.Degree.DegreeMajor` / `DegreeMinor` | `education[].field` | Combine major + minor into a single `field` string if needed, or store minor in `custom`. |

---

### `LicensesAndCertifications` → `credentials[]`

HR-XML licenses and certifications map well to OTP's `credentials` section.

| HR-XML | OTP path | Notes |
|---|---|---|
| `License.LicenseName` or `Certification.CertificationName` | `credentials[].name` | Direct. |
| `IssuingAuthority` | `credentials[].issuer` | Direct. |
| `FirstIssuedDate` | `credentials[].issueDate` | Direct. |
| `ExpirationDate` | `credentials[].expiryDate` | Direct. |
| `LicenseNumber` | `credentials[].credentialId` | Direct. |

Where the HR-XML record includes a verification status from the issuer, populate `credentials[].verification` with `"level": "issuer"` and the issuer details.

---

### `Competencies` / `SkillSet` → `skills[]`

HR-XML's competency models vary widely between implementations. The common elements are:

| HR-XML | OTP path | Notes |
|---|---|---|
| `CompetencyId.IdValue` or `CompetencyName` | `skills[].name` | Use the human-readable name. |
| `ProficiencyLevel` | `skills[].level` | Map to OTP enum: `beginner / intermediate / advanced / expert`. |
| `TaxonomyId` | `custom["hrxml:taxonomyId"]` on the skill item | OTP does not define a competency taxonomy reference, but this is useful to preserve. |
| `YearsExperience` | `skills[].yearsOfExperience` | Direct if available. |
| `LastUsed` | `skills[].lastUsed` | Direct if available. |

---

### `Languages` → `languages[]`

| HR-XML | OTP path | Notes |
|---|---|---|
| `Language.LanguageCode` | `languages[].code` | Use BCP 47. HR-XML may use ISO 639-1 or ISO 639-2; convert as needed. |
| `Language.LanguageName` | `languages[].name` | Direct. |
| `ProficiencyLevel` | `languages[].level` | Map to CEFR where possible. HR-XML levels (1–5 or `Basic` / `Conversational` / `Proficient` / `Fluent` / `Native`) should be mapped to the nearest CEFR value. |

---

### `Publications`, `Patents`, `Presentations` → `evidence[]` or `custom`

These sections map partially to OTP's `evidence` array with the appropriate `type` value (`"publication"`, `"talk"`, etc.). Fields that do not fit (patent numbers, co-inventor lists, submission status) should go into `custom`.

---

### HR-XML fields with no OTP equivalent

The following HR-XML concepts have no meaningful OTP home and should be handled as follows:

| HR-XML concept | Recommended handling |
|---|---|
| Internal candidate ID | Drop (belongs to the ATS, not the candidate profile). |
| ATS workflow stage | Drop (process state, not profile data). |
| Recruiter notes | Drop (confidential; not candidate-controlled data). |
| Reference contacts | Drop (third-party PII; not appropriate in a portable document). |
| Compensation history (past salaries) | Drop or store in `custom["hrxml:compensationHistory"]`. |
| Background check status | Drop (process state). |
| EEO / affirmative action data | Drop (regulatory; not appropriate in a portable candidate document). |
| Drug test results | Drop. |
| Immigration case numbers | Drop or store in `custom` if the candidate explicitly wants to carry them. |

---

## Populating OTP-only sections after migration

HR-XML does not have equivalents for OTP's `preferences`, `evidence`, `verification`, or `visibility` sections. After migrating the structural data:

1. **`preferences`** — must be populated from a separate source (candidate questionnaire, recruiter intake form, or candidate-facing portal data).
2. **`verification`** (document-level) — set `createdBy: "import"`, `createdAt` to the import timestamp, and `updatedBy` to the importing system.
3. **`visibility`** — default to `"recruiters"` unless the candidate has specified otherwise.
4. **`meta`** — set `schemaVersion: "0.1"`, `source: "import:hrxml"`, and `lastUpdated` to the import timestamp.

---

## Notes on HR-XML versions

HR-XML has evolved through several versions (3.x, 4.x) and the HR Open Standards variants. Field names and nesting differ across versions. This guide uses the conceptual level rather than specific XPath expressions because the exact XML structure depends on the version and vendor implementation. Implementors should validate their specific HR-XML input schema before writing migration code.
