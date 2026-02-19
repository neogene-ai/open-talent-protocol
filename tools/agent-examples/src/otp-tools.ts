/**
 * Open Talent Protocol – Agent Tools
 *
 * Core tool implementations for OTP-aware agents.
 *
 * These functions are plain TypeScript — no framework dependency.
 * Wrap them in an MCP server, a LangChain tool, or any other agent
 * framework by registering them as tool definitions with the typed
 * inputs and outputs shown here.
 *
 * MCP registration example (pseudocode):
 *
 *   server.tool("otp_validate_profile", ValidateProfileInput, async (input) => {
 *     return validateProfile(input);
 *   });
 *
 *   server.tool("otp_introspect_profile", IntrospectProfileInput, async (input) => {
 *     return introspectProfile(input);
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

const SCHEMA_PATH = resolve(__dirname, "../../../schema/opentalent-protocol.schema.json");

let _validate: ValidateFunction | null = null;

function getValidator(): ValidateFunction {
  if (!_validate) {
    const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
    const ajv = new Ajv2020({ strict: true, allErrors: true });
    addFormats(ajv);
    _validate = ajv.compile(schema);
  }
  return _validate!;
}

// ---------------------------------------------------------------------------
// Shared types (subset of OTP document — not exhaustive)
// ---------------------------------------------------------------------------

interface OtpMeta {
  schemaVersion: string;
  language?: string;
  lastUpdated?: string;
  source?: string;
  dataController?: string;
  subjectId?: string;
}

interface OtpContactLocation {
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
}

interface OtpContact {
  email?: string;
  phone?: string;
  location?: OtpContactLocation;
  timezone?: string;
}

interface OtpIdentity {
  fullName: string;
  preferredName?: string;
  pronouns?: string;
  contact?: OtpContact;
  workAuthorization?: {
    description?: string;
    authorizedCountries?: string[];
    requiresSponsorship?: boolean;
  };
}

interface OtpSkill {
  name: string;
  level?: "beginner" | "intermediate" | "advanced" | "expert";
  category?: string;
  lastUsed?: string;
  yearsOfExperience?: number;
}

interface OtpWorkEntry {
  organization: string;
  role: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  employmentType?: string;
  highlights?: string[];
  impact?: Array<{ metric: string; value: string; period?: string }>;
  tags?: string[];
}

interface OtpPreferences {
  desiredRoles?: string[];
  industries?: string[];
  locations?: string[];
  workModes?: string[];
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
    period?: string;
    negotiable?: boolean;
  };
  workHours?: string[];
  constraints?: {
    noticePeriod?: string;
    availableFrom?: string;
    travelWillingness?: string;
    notes?: string;
  };
}

interface OtpDocument {
  meta: OtpMeta;
  identity: OtpIdentity;
  summary?: string;
  work?: OtpWorkEntry[];
  skills?: OtpSkill[];
  preferences?: OtpPreferences;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Tool 1: validateProfile
// ---------------------------------------------------------------------------

/**
 * Input for the validateProfile tool.
 * Accept either a file path or an already-parsed document object.
 */
export interface ValidateProfileInput {
  /** Absolute or relative path to an OTP JSON document. Mutually exclusive with `document`. */
  filePath?: string;
  /** A pre-parsed OTP document object. Mutually exclusive with `filePath`. */
  document?: unknown;
}

export interface ValidateProfileResult {
  /** True if the document is a valid OTP document. */
  valid: boolean;
  /**
   * Human-readable summary for the agent to include in a response or log.
   * e.g. "Valid Open Talent Protocol document" or "3 validation errors found."
   */
  summary: string;
  /** Structured list of validation errors, empty when valid. */
  errors: Array<{
    path: string;
    message: string;
  }>;
}

/**
 * Validates an OTP document against the official JSON Schema.
 *
 * MCP tool name suggestion: "otp_validate_profile"
 * MCP tool description: "Validate a JSON document against the Open Talent Protocol schema. Returns validity status and a list of errors."
 */
export function validateProfile(input: ValidateProfileInput): ValidateProfileResult {
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

  const validate = getValidator();
  const valid = validate(doc);

  if (valid) {
    return { valid: true, summary: "Valid Open Talent Protocol document.", errors: [] };
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
// Tool 2: introspectProfile
// ---------------------------------------------------------------------------

/**
 * Input for the introspectProfile tool.
 */
export interface IntrospectProfileInput {
  /** Absolute or relative path to a valid OTP JSON document. */
  filePath?: string;
  /** A pre-parsed OTP document. */
  document?: unknown;
  /**
   * Which sections to include in the output. Defaults to all sections.
   * Useful when an agent only needs a specific slice (e.g. just preferences for matching).
   */
  sections?: Array<"identity" | "summary" | "skills" | "work" | "preferences">;
}

export interface IntrospectedSkill {
  name: string;
  level: string;
  category: string;
  yearsOfExperience: number | null;
  lastUsed: string | null;
}

export interface IntrospectedWorkEntry {
  organization: string;
  role: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  employmentType: string;
  topHighlights: string[];
  impactMetrics: Array<{ metric: string; value: string }>;
}

export interface IntrospectedPreferences {
  desiredRoles: string[];
  preferredWorkModes: string[];
  preferredLocations: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: string | null;
  salaryNegotiable: boolean;
  engagementTypes: string[];
  noticePeriod: string | null;
  availableFrom: string | null;
  constraints: string | null;
}

export interface IntrospectProfileResult {
  /** Schema version of the document. */
  schemaVersion: string;
  /** Identifier for the document's subject (if present). */
  subjectId: string | null;
  /** Display name for use in agent reasoning. */
  displayName: string;
  /** Current or most recent location. */
  location: string | null;
  /** Plain-text professional summary. */
  summary: string | null;
  /** Normalized skill list, sorted by years of experience descending. */
  skills: IntrospectedSkill[];
  /** Work history, most recent first. */
  workHistory: IntrospectedWorkEntry[];
  /** Flattened, agent-friendly preferences object. */
  preferences: IntrospectedPreferences | null;
  /**
   * A short natural-language description of the profile for use in
   * an agent's system prompt or a retrieval-augmented context window.
   */
  agentSummary: string;
}

/**
 * Returns a normalized, agent-friendly view of an OTP document.
 * Handles missing optional fields gracefully.
 *
 * MCP tool name suggestion: "otp_introspect_profile"
 * MCP tool description: "Extract a structured, agent-friendly summary of an Open Talent Protocol document. Returns normalized skills, work history, and preferences ready for agent reasoning."
 */
export function introspectProfile(input: IntrospectProfileInput): IntrospectProfileResult {
  let doc: OtpDocument;

  if (input.filePath) {
    doc = JSON.parse(readFileSync(resolve(input.filePath), "utf8")) as OtpDocument;
  } else if (input.document) {
    doc = input.document as OtpDocument;
  } else {
    throw new Error("Either filePath or document must be provided.");
  }

  const sections = input.sections ?? ["identity", "summary", "skills", "work", "preferences"];
  const include = (s: string) => sections.includes(s as never);

  // Identity
  const identity = doc.identity;
  const displayName = identity.preferredName
    ? `${identity.preferredName} (${identity.fullName})`
    : identity.fullName;

  const locationParts = [
    identity.contact?.location?.city,
    identity.contact?.location?.country,
  ].filter(Boolean);
  const location = locationParts.length ? locationParts.join(", ") : null;

  // Skills
  const skills: IntrospectedSkill[] = include("skills")
    ? (doc.skills ?? [])
        .map((s) => ({
          name: s.name,
          level: s.level ?? "unknown",
          category: s.category ?? "uncategorized",
          yearsOfExperience: s.yearsOfExperience ?? null,
          lastUsed: s.lastUsed ?? null,
        }))
        .sort((a, b) => (b.yearsOfExperience ?? 0) - (a.yearsOfExperience ?? 0))
    : [];

  // Work history
  const workHistory: IntrospectedWorkEntry[] = include("work")
    ? (doc.work ?? []).map((w) => ({
        organization: w.organization,
        role: w.role,
        startDate: w.startDate,
        endDate: w.endDate ?? null,
        current: w.current ?? false,
        employmentType: w.employmentType ?? "unknown",
        topHighlights: (w.highlights ?? []).slice(0, 3),
        impactMetrics: (w.impact ?? []).map((i) => ({
          metric: i.metric,
          value: i.value,
        })),
      }))
    : [];

  // Preferences
  let preferences: IntrospectedPreferences | null = null;
  if (include("preferences") && doc.preferences) {
    const p = doc.preferences;
    preferences = {
      desiredRoles: p.desiredRoles ?? [],
      preferredWorkModes: p.workModes ?? [],
      preferredLocations: p.locations ?? [],
      salaryMin: p.salary?.min ?? null,
      salaryMax: p.salary?.max ?? null,
      salaryCurrency: p.salary?.currency ?? null,
      salaryPeriod: p.salary?.period ?? null,
      salaryNegotiable: p.salary?.negotiable ?? true,
      engagementTypes: p.workHours ?? [],
      noticePeriod: p.constraints?.noticePeriod ?? null,
      availableFrom: p.constraints?.availableFrom ?? null,
      constraints: p.constraints?.notes ?? null,
    };
  }

  // Agent-readable summary string
  const currentRole = workHistory.find((w) => w.current);
  const topSkillNames = skills
    .filter((s) => s.level === "expert" || s.level === "advanced")
    .slice(0, 5)
    .map((s) => s.name);

  const salaryStr =
    preferences?.salaryMin && preferences?.salaryCurrency
      ? `${preferences.salaryCurrency} ${preferences.salaryMin.toLocaleString()}–${(preferences.salaryMax ?? preferences.salaryMin).toLocaleString()} ${preferences.salaryPeriod ?? ""}`
      : null;

  const parts: string[] = [];
  parts.push(`Candidate: ${displayName}.`);
  if (location) parts.push(`Location: ${location}.`);
  if (currentRole) parts.push(`Currently: ${currentRole.role} at ${currentRole.organization}.`);
  if (include("summary") && doc.summary) parts.push(`Summary: ${doc.summary.slice(0, 200)}${doc.summary.length > 200 ? "…" : ""}`);
  if (topSkillNames.length) parts.push(`Top skills: ${topSkillNames.join(", ")}.`);
  if (preferences?.desiredRoles?.length) parts.push(`Seeking: ${preferences.desiredRoles.join(", ")}.`);
  if (preferences?.preferredWorkModes?.length) parts.push(`Work modes: ${preferences.preferredWorkModes.join(", ")}.`);
  if (salaryStr) parts.push(`Salary expectation: ${salaryStr}.`);
  if (preferences?.noticePeriod) parts.push(`Notice period: ${preferences.noticePeriod}.`);
  if (preferences?.constraints) parts.push(`Non-negotiables: ${preferences.constraints}`);

  return {
    schemaVersion: doc.meta.schemaVersion,
    subjectId: doc.meta.subjectId ?? null,
    displayName,
    location,
    summary: include("summary") ? (doc.summary ?? null) : null,
    skills,
    workHistory,
    preferences,
    agentSummary: parts.join(" "),
  };
}
