/**
 * Open Job Protocol – Agent Tools
 *
 * Core tool implementations for OJP-aware agents.
 *
 * These functions are plain TypeScript — no framework dependency.
 * Wrap them in an MCP server, a LangChain tool, or any other agent
 * framework by registering them as tool definitions with the typed
 * inputs and outputs shown here.
 *
 * MCP registration example (pseudocode):
 *
 *   server.tool("ojp_validate_job_posting", ValidateJobPostingInput, async (input) => {
 *     return validateJobPosting(input);
 *   });
 *
 *   server.tool("ojp_introspect_job_posting", IntrospectJobPostingInput, async (input) => {
 *     return introspectJobPosting(input);
 *   });
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// ajv with 2020-12 support
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Ajv2020 = require("ajv/dist/2020");
import addFormats from "ajv-formats";
import type { ErrorObject, ValidateFunction } from "ajv";

// ---------------------------------------------------------------------------
// Schema loading (cached at module load time)
// ---------------------------------------------------------------------------

const OJP_SCHEMA_PATH = resolve(__dirname, "../../../schema/openjob-protocol.schema.json");

let _ojpValidate: ValidateFunction | null = null;

function getOjpValidator(): ValidateFunction {
  if (!_ojpValidate) {
    const schema = JSON.parse(readFileSync(OJP_SCHEMA_PATH, "utf8"));
    const ajv = new Ajv2020({ strict: true, allErrors: true });
    addFormats(ajv);
    _ojpValidate = ajv.compile(schema);
  }
  return _ojpValidate!;
}

// ---------------------------------------------------------------------------
// Shared types (subset of OJP document — not exhaustive)
// ---------------------------------------------------------------------------

interface OjpMeta {
  version: string;
  job_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  valid_through?: string;
  source?: string;
  source_url?: string;
  locale?: string;
}

interface OjpRole {
  title: string;
  description: string;
  employment_type: string;
  role_summary?: string;
  function?: string;
  seniority?: string;
  total_openings?: number;
  responsibilities?: string[];
  work_hours?: string;
  job_start_date?: string;
  immediate_start?: boolean;
}

interface OjpOrganization {
  name: string;
  url?: string;
  logo_url?: string;
  industry?: string;
  size?: string;
  department?: string;
  founded?: number;
  headquarters?: string;
}

interface OjpSkillRequirement {
  name: string;
  min_years?: number;
}

interface OjpRequirements {
  must_have?: {
    skills?: OjpSkillRequirement[];
    experience_years?: { min?: number; max?: number };
    credentials?: string[];
    certifications?: string[];
    languages?: Array<{ code: string; level: string }>;
    legal?: {
      work_authorization?: string;
      security_clearance?: string;
      physical_requirements?: string;
    };
  };
  nice_to_have?: {
    skills?: OjpSkillRequirement[];
    experience_years?: { min?: number; max?: number };
    credentials?: string[];
    certifications?: string[];
    languages?: Array<{ code: string; level: string }>;
    legal?: {
      work_authorization?: string;
      security_clearance?: string;
      physical_requirements?: string;
    };
    experience_in_place_of_education?: boolean;
    preferred_qualifications?: string[];
  };
}

interface OjpOffering {
  compensation?: {
    salary?: {
      min?: number;
      max?: number;
      currency?: string;
      period?: string;
    };
    additional_compensation?: string[];
    transparency?: string;
  };
  location?: {
    arrangement?: string;
    primary_location?: string;
    alternate_locations?: string[];
    remote_regions?: string[];
    relocation_support?: boolean;
    visa_sponsorship?: boolean;
  };
  benefits?: {
    benefits?: Array<{ category: string; description: string }>;
  };
  growth?: {
    career_path?: string;
    mentorship?: string;
    promotion_cadence?: string;
  };
}

interface OjpDocument {
  meta: OjpMeta;
  role: OjpRole;
  organization: OjpOrganization;
  requirements?: OjpRequirements;
  offering?: OjpOffering;
  team?: {
    name?: string;
    size?: number;
    reports_to?: string;
    tech_stack?: string[];
    methodology?: string;
    description?: string;
  };
  process?: {
    stages?: Array<{ name: string; duration_minutes?: number; type: string }>;
    total_duration_days?: number;
    decision_timeline?: string;
    application_url?: string;
    direct_apply?: boolean;
    accepts_otp_profile?: boolean;
    ai_screening?: boolean;
  };
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Tool 1: validateJobPosting
// ---------------------------------------------------------------------------

/**
 * Input for the validateJobPosting tool.
 * Accept either a file path or an already-parsed document object.
 */
export interface ValidateJobPostingInput {
  /** Absolute or relative path to an OJP JSON document. Mutually exclusive with `document`. */
  filePath?: string;
  /** A pre-parsed OJP document object. Mutually exclusive with `filePath`. */
  document?: unknown;
}

export interface ValidateJobPostingResult {
  /** True if the document is a valid OJP document. */
  valid: boolean;
  /**
   * Human-readable summary for the agent to include in a response or log.
   * e.g. "Valid Open Job Protocol document" or "3 validation errors found."
   */
  summary: string;
  /** Structured list of validation errors, empty when valid. */
  errors: Array<{
    path: string;
    message: string;
  }>;
}

/**
 * Validates an OJP document against the official JSON Schema.
 *
 * MCP tool name suggestion: "ojp_validate_job_posting"
 * MCP tool description: "Validate a JSON document against the Open Job Protocol schema. Returns validity status and a list of errors."
 */
export function validateJobPosting(input: ValidateJobPostingInput): ValidateJobPostingResult {
  let doc: unknown;

  if (input.filePath) {
    try {
      doc = JSON.parse(readFileSync(resolve(input.filePath), "utf8"));
    } catch (err) {
      return {
        valid: false,
        summary: `Could not read file: ${(err as Error).message}`,
        errors: [{ path: "(file)", message: (err as Error).message }],
      };
    }
  } else if (input.document !== undefined) {
    doc = input.document;
  } else {
    return {
      valid: false,
      summary: "Either filePath or document must be provided.",
      errors: [{ path: "(input)", message: "Either filePath or document must be provided." }],
    };
  }

  const validate = getOjpValidator();
  const valid = validate(doc);

  if (valid) {
    return { valid: true, summary: "Valid Open Job Protocol document.", errors: [] };
  }

  const errors = (validate.errors ?? []).map((e: ErrorObject) => ({
    path: e.instancePath || "(root)",
    message: e.message ?? "unknown error",
  }));

  return {
    valid: false,
    summary: `${errors.length} validation error${errors.length === 1 ? "" : "s"} found.`,
    errors,
  };
}

// ---------------------------------------------------------------------------
// Tool 2: introspectJobPosting
// ---------------------------------------------------------------------------

/**
 * Input for the introspectJobPosting tool.
 */
export interface IntrospectJobPostingInput {
  /** Absolute or relative path to a valid OJP JSON document. */
  filePath?: string;
  /** A pre-parsed OJP document. */
  document?: unknown;
}

export interface IntrospectJobPostingResult {
  /** Stable identifier for the job posting. */
  jobId: string;
  /** Current status of the posting. */
  status: string;
  /** Job title. */
  title: string;
  /** Employment type (e.g. full_time, contract). */
  employmentType: string;
  /** Seniority level. */
  seniority: string | null;
  /** Hiring organization summary. */
  organization: {
    name: string;
    industry: string | null;
    size: string | null;
  };
  /** Requirements summary. */
  requirements: {
    mustHaveSkills: Array<{ name: string; min_years: number | null }>;
    niceToHaveSkills: Array<{ name: string; min_years: number | null }>;
    minExperience: number | null;
    languages: Array<{ code: string; level: string }>;
    credentials: string[];
    legal: string | null;
  };
  /** Compensation details. */
  compensation: {
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string | null;
    salaryPeriod: string | null;
    transparency: string | null;
  };
  /** Location and work arrangement. */
  location: {
    arrangement: string | null;
    primaryLocation: string | null;
    remoteRegions: string[];
    visaSponsorship: boolean | null;
    relocationSupport: boolean | null;
  };
  /** Team context. */
  team: {
    size: number | null;
    reportsTo: string | null;
    techStack: string[];
    methodology: string | null;
  };
  /** Hiring process summary. */
  process: {
    stages: Array<{ name: string; type: string }>;
    totalDurationDays: number | null;
    acceptsOtpProfile: boolean | null;
  };
  /**
   * A short natural-language description of the job for use in
   * an agent's system prompt or a retrieval-augmented context window.
   *
   * Format: "Role: {title} ({seniority}, {employment_type}) at {org} ({industry}, {size}).
   *          Location: {arrangement}. Must-have: {top skills}. Salary: {range}.
   *          Process: {N} stages ({duration} days)."
   */
  agentSummary: string;
}

/**
 * Returns a normalized, agent-friendly view of an OJP document.
 * Handles missing optional fields gracefully.
 *
 * MCP tool name suggestion: "ojp_introspect_job_posting"
 * MCP tool description: "Extract a structured, agent-friendly summary of an Open Job Protocol document. Returns normalized requirements, compensation, and location details ready for agent reasoning."
 */
export function introspectJobPosting(input: IntrospectJobPostingInput): IntrospectJobPostingResult {
  let doc: OjpDocument;

  if (input.filePath) {
    doc = JSON.parse(readFileSync(resolve(input.filePath), "utf8")) as OjpDocument;
  } else if (input.document) {
    doc = input.document as OjpDocument;
  } else {
    throw new Error("Either filePath or document must be provided.");
  }

  const mustHaveSkills = (doc.requirements?.must_have?.skills ?? []).map((s) => ({
    name: s.name,
    min_years: s.min_years ?? null,
  }));

  const niceToHaveSkills = (doc.requirements?.nice_to_have?.skills ?? []).map((s) => ({
    name: s.name,
    min_years: s.min_years ?? null,
  }));

  const compensation = {
    salaryMin: doc.offering?.compensation?.salary?.min ?? null,
    salaryMax: doc.offering?.compensation?.salary?.max ?? null,
    salaryCurrency: doc.offering?.compensation?.salary?.currency ?? null,
    salaryPeriod: doc.offering?.compensation?.salary?.period ?? null,
    transparency: doc.offering?.compensation?.transparency ?? null,
  };

  const location = {
    arrangement: doc.offering?.location?.arrangement ?? null,
    primaryLocation: doc.offering?.location?.primary_location ?? null,
    remoteRegions: doc.offering?.location?.remote_regions ?? [],
    visaSponsorship: doc.offering?.location?.visa_sponsorship ?? null,
    relocationSupport: doc.offering?.location?.relocation_support ?? null,
  };

  const team = {
    size: doc.team?.size ?? null,
    reportsTo: doc.team?.reports_to ?? null,
    techStack: doc.team?.tech_stack ?? [],
    methodology: doc.team?.methodology ?? null,
  };

  const processStages = (doc.process?.stages ?? []).map((s) => ({
    name: s.name,
    type: s.type,
  }));

  // Build agent summary
  const salaryStr =
    compensation.salaryMin !== null && compensation.salaryCurrency
      ? `${compensation.salaryCurrency} ${compensation.salaryMin.toLocaleString()}–${(compensation.salaryMax ?? compensation.salaryMin).toLocaleString()} ${compensation.salaryPeriod ?? ""}`
      : null;

  const topSkills = mustHaveSkills
    .slice(0, 5)
    .map((s) => (s.min_years ? `${s.name} (${s.min_years}y+)` : s.name))
    .join(", ");

  const locationStr =
    location.arrangement === "remote"
      ? `Remote${location.remoteRegions.length ? ` (${location.remoteRegions.join(", ")})` : ""}`
      : location.arrangement === "hybrid"
      ? `Hybrid – ${location.primaryLocation ?? "location TBC"}`
      : location.primaryLocation ?? location.arrangement ?? "TBC";

  const parts: string[] = [];
  parts.push(
    `Role: ${doc.role.title} (${doc.role.seniority ?? "unspecified"}, ${doc.role.employment_type}) at ${doc.organization.name} (${doc.organization.industry ?? "industry unspecified"}, ${doc.organization.size ?? "size unspecified"}).`
  );
  parts.push(`Location: ${locationStr}.`);
  if (topSkills) parts.push(`Must-have: ${topSkills}.`);
  if (salaryStr) parts.push(`Salary: ${salaryStr}.`);
  if (processStages.length) {
    parts.push(
      `Process: ${processStages.length} stage${processStages.length === 1 ? "" : "s"}${doc.process?.total_duration_days ? ` (~${doc.process.total_duration_days} days)` : ""}.`
    );
  }
  if (doc.process?.accepts_otp_profile) parts.push("Accepts OTP profile.");

  return {
    jobId: doc.meta.job_id,
    status: doc.meta.status,
    title: doc.role.title,
    employmentType: doc.role.employment_type,
    seniority: doc.role.seniority ?? null,
    organization: {
      name: doc.organization.name,
      industry: doc.organization.industry ?? null,
      size: doc.organization.size ?? null,
    },
    requirements: {
      mustHaveSkills,
      niceToHaveSkills,
      minExperience: doc.requirements?.must_have?.experience_years?.min ?? null,
      languages: doc.requirements?.must_have?.languages ?? [],
      credentials: doc.requirements?.must_have?.credentials ?? [],
      legal: doc.requirements?.must_have?.legal?.work_authorization ?? null,
    },
    compensation,
    location,
    team,
    process: {
      stages: processStages,
      totalDurationDays: doc.process?.total_duration_days ?? null,
      acceptsOtpProfile: doc.process?.accepts_otp_profile ?? null,
    },
    agentSummary: parts.join(" "),
  };
}
