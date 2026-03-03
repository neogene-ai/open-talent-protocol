/**
 * Open Talent Protocol – Resume Parser
 *
 * Produces a structured extraction template from raw resume text.
 * Does NOT call an LLM. Instead, it returns a partially-filled OTP document
 * skeleton with field annotations and confidence levels — ready for the calling
 * agent (Claude) to populate via its own reasoning.
 *
 * The calling agent should:
 *   1. Call parseResume({ text }) to get the skeleton and field map
 *   2. Fill in the document fields using its own extraction from the text
 *   3. Call validateProfile({ document }) to validate the result
 *   4. Return the completed OTP document to the user
 *
 * MCP tool name: otp_parse_resume
 */

import { validateProfile } from "../otp-tools.js";

// ---------------------------------------------------------------------------
// Input / Output types
// ---------------------------------------------------------------------------

export interface ParseResumeInput {
  /** Raw resume text (plain text, markdown, or extracted PDF text). */
  text: string;
}

export interface FieldConfidence {
  /** JSON Pointer path in the OTP document (e.g. '/identity/fullName'). */
  path: string;
  /** Extraction confidence level. */
  confidence: "high" | "medium" | "low";
  /** Why this confidence level was assigned. */
  reason: string;
}

export interface ParseResumeResult {
  /**
   * A partially-filled OTP document skeleton.
   * Fields with _EXTRACT_ annotations should be populated by the calling agent.
   * Fields with concrete values were inferred structurally (not extracted).
   */
  document: Record<string, unknown>;
  /**
   * Confidence guide for each field group.
   * Agents should use this to know which fields to prioritize and double-check.
   */
  fieldConfidence: FieldConfidence[];
  /**
   * List of fields that are commonly missing from resumes and require
   * explicit questions to the candidate (e.g. salary expectations, work mode).
   */
  gaps: string[];
  /** Whether the skeleton passes OTP schema validation (always false until populated). */
  valid: boolean;
  /** Validation errors on the skeleton. */
  errors: Array<{ path: string; message: string }>;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Produces a structured OTP extraction template from raw resume text.
 *
 * MCP tool name suggestion: "otp_parse_resume"
 * MCP tool description: "Produce a structured OTP extraction template from raw resume text.
 * Returns a document skeleton with field annotations, confidence levels, and a list of
 * fields commonly missing from resumes. The calling agent should use this as a guide
 * to extract and populate the full OTP document."
 */
export function parseResume(input: ParseResumeInput): ParseResumeResult {
  const { text } = input;

  // Build a skeleton OTP document with extraction annotations
  // The calling agent replaces _EXTRACT_* markers with actual extracted values
  const skeleton: Record<string, unknown> = {
    meta: {
      schemaVersion: "0.1",
      language: "_EXTRACT_language_from_text_default_en",
      lastUpdated: new Date().toISOString(),
      source: "import:resume",
    },
    identity: {
      fullName: "_EXTRACT_full_name",
      preferredName: "_EXTRACT_preferred_name_or_first_name",
      contact: {
        email: "_EXTRACT_email_address_or_null",
        phone: "_EXTRACT_phone_number_or_null",
        location: {
          city: "_EXTRACT_city_or_null",
          region: "_EXTRACT_region_state_or_null",
          country: "_EXTRACT_iso3166_country_code_or_null",
        },
      },
      profiles: "_EXTRACT_array_of_online_profiles_github_linkedin_portfolio",
      workAuthorization: {
        description: "_EXTRACT_work_authorization_statement_or_null",
        authorizedCountries: "_EXTRACT_array_of_authorized_country_codes_or_empty",
        requiresSponsorship: "_EXTRACT_boolean_visa_sponsorship_required_or_null",
      },
    },
    summary: "_EXTRACT_professional_summary_or_objective_statement",
    work: "_EXTRACT_array_of_work_experience_entries_most_recent_first",
    education: "_EXTRACT_array_of_education_entries",
    skills: "_EXTRACT_array_of_skills_with_name_level_and_years_of_experience",
    projects: "_EXTRACT_array_of_notable_projects_or_empty",
    credentials: "_EXTRACT_array_of_certifications_and_credentials_or_empty",
    languages: "_EXTRACT_array_of_human_languages_spoken_or_empty",
    verification: {
      createdBy: "import",
      createdAt: new Date().toISOString(),
      updatedBy: "agent",
    },
  };

  // Field-level extraction guide
  const fieldConfidence: FieldConfidence[] = [
    // High confidence — reliably extractable from standard resumes
    {
      path: "/identity/fullName",
      confidence: "high",
      reason: "Full name is always present at the top of a resume.",
    },
    {
      path: "/identity/contact/email",
      confidence: "high",
      reason: "Email address is present in >95% of resumes.",
    },
    {
      path: "/work",
      confidence: "high",
      reason: "Job titles, company names, and date ranges are structured and reliable.",
    },
    {
      path: "/education",
      confidence: "high",
      reason: "Institution, degree, and dates are typically explicit.",
    },
    {
      path: "/skills",
      confidence: "high",
      reason: "Skills sections list canonical skill names reliably.",
    },
    {
      path: "/credentials",
      confidence: "high",
      reason: "Certifications with issuer and date are explicit when present.",
    },
    // Medium confidence — present but require interpretation
    {
      path: "/skills[*]/level",
      confidence: "medium",
      reason: "Proficiency levels are rarely stated; infer from years and context.",
    },
    {
      path: "/skills[*]/yearsOfExperience",
      confidence: "medium",
      reason: "Calculate from work history dates where skill is mentioned.",
    },
    {
      path: "/work[*]/employmentType",
      confidence: "medium",
      reason: "Employment type (full-time vs contract) may not be stated explicitly.",
    },
    {
      path: "/identity/contact/location",
      confidence: "medium",
      reason: "Location format varies; map to city/country fields carefully.",
    },
    {
      path: "/languages",
      confidence: "medium",
      reason: "Language proficiency levels may not use CEFR notation.",
    },
    // Low confidence — rarely on resume; ask candidate
    {
      path: "/preferences",
      confidence: "low",
      reason: "Salary expectations and work mode preferences are rarely on resumes. Ask the candidate.",
    },
    {
      path: "/identity/workAuthorization/requiresSponsorship",
      confidence: "low",
      reason: "Visa/sponsorship requirements are often unstated. Ask the candidate.",
    },
    {
      path: "/work[*]/impact",
      confidence: "low",
      reason: "Quantified impact metrics are present on some resumes but rarely complete.",
    },
  ];

  // Common gaps that require explicit elicitation from the candidate
  const gaps: string[] = [
    "preferences.salary — salary expectation (min, max, currency, period) not typically on resume",
    "preferences.workModes — remote/hybrid/onsite preference not stated",
    "preferences.desiredRoles — target role titles may differ from last held role",
    "preferences.constraints.availableFrom — start date availability not on resume",
    "preferences.constraints.noticePeriod — notice period not stated",
    "visibility — candidate must choose who can see salary, contact, etc.",
    "verification — claims should be marked as self-reported until verified",
    "identity.workAuthorization.requiresSponsorship — visa/sponsorship needs often unstated",
    "work[*].impact — quantified metrics often missing; worth eliciting",
    "preferences.locations — preferred cities may differ from current location",
  ];

  // Hint to the agent about the text length and structure
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const hasLinkedIn = /linkedin\.com/i.test(text);
  const hasGitHub = /github\.com/i.test(text);

  // Annotate the skeleton with contextual hints
  (skeleton.meta as Record<string, unknown>)["_hints"] = {
    wordCount,
    hasLinkedIn,
    hasGitHub,
    instruction:
      "Replace all _EXTRACT_* values with actual values from the resume text. " +
      "Remove _hints from the final document. " +
      "Use null for fields that cannot be determined. " +
      "For arrays, return [] if nothing is found.",
  };

  // Validate the skeleton (will always fail — it's a template)
  const validation = validateProfile({ document: skeleton });

  return {
    document: skeleton,
    fieldConfidence,
    gaps,
    valid: validation.valid,
    errors: validation.errors,
  };
}
