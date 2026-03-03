#!/usr/bin/env node
/**
 * Open Talent Protocol – Validator CLI
 *
 * Usage:
 *   node dist/index.js [--schema otp|ojp] <path-to-document.json>
 *
 * Validates the given JSON file against the Open Talent Protocol (OTP) or
 * Open Job Protocol (OJP) schema (v0.1) and prints a human-readable result.
 *
 * When --schema is omitted, the schema is auto-detected from the document:
 *   - meta.schemaVersion present → OTP
 *   - meta.version present       → OJP
 */

import { readFileSync } from "fs";
import { resolve } from "path";
// ajv v8 exposes a dedicated 2020-12 entrypoint
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Ajv2020 = require("ajv/dist/2020");
import addFormats from "ajv-formats";
import type { ErrorObject } from "ajv";

// ---------------------------------------------------------------------------
// Resolve paths
// ---------------------------------------------------------------------------

const OTP_SCHEMA_PATH = resolve(
  __dirname,
  "../../../schema/opentalent-protocol.schema.json"
);

const OJP_SCHEMA_PATH = resolve(
  __dirname,
  "../../../schema/openjob-protocol.schema.json"
);

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function main(): void {
  const rawArgs = process.argv.slice(2);

  if (rawArgs.length === 0 || rawArgs[0] === "--help" || rawArgs[0] === "-h") {
    printUsage();
    process.exit(0);
  }

  // Parse --schema flag
  let schemaHint: "otp" | "ojp" | null = null;
  const args: string[] = [];
  for (let i = 0; i < rawArgs.length; i++) {
    if (rawArgs[i] === "--schema") {
      const val = rawArgs[++i];
      if (val !== "otp" && val !== "ojp") {
        fatal(`--schema must be 'otp' or 'ojp', got '${val}'`);
      }
      schemaHint = val as "otp" | "ojp";
    } else {
      args.push(rawArgs[i]);
    }
  }

  if (args.length === 0) {
    fatal("No document path provided. Run with --help for usage.");
  }

  const documentPath = resolve(args[0]);

  // Load the document
  let document: unknown;
  try {
    document = JSON.parse(readFileSync(documentPath, "utf8"));
  } catch (err) {
    fatal(
      `Could not read document at ${documentPath}: ${(err as Error).message}`
    );
  }

  // Determine schema type
  const schemaType = schemaHint ?? detectSchema(document);
  const schemaPath = schemaType === "ojp" ? OJP_SCHEMA_PATH : OTP_SCHEMA_PATH;
  const schemaLabel =
    schemaType === "ojp" ? "Open Job Protocol" : "Open Talent Protocol";

  // Load the schema
  let schema: unknown;
  try {
    schema = JSON.parse(readFileSync(schemaPath, "utf8"));
  } catch (err) {
    fatal(`Could not load schema from ${schemaPath}: ${(err as Error).message}`);
  }

  // Set up AJV with draft-2020-12 support
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const ajv = new Ajv2020({
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);

  const validate = ajv.compile(schema!);
  const valid = validate(document);

  if (valid) {
    console.log(`\n✓ Valid ${schemaLabel} document\n`);
    process.exit(0);
  } else {
    console.error(`\n✗ Invalid ${schemaLabel} document\n`);
    console.error("Validation errors:");

    for (const error of validate.errors ?? []) {
      const path = error.instancePath || "(root)";
      const message = formatError(error);
      console.error(`  • ${path}: ${message}`);
    }

    console.error("");
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Auto-detect schema from document structure
// ---------------------------------------------------------------------------

function detectSchema(doc: unknown): "otp" | "ojp" {
  if (
    doc !== null &&
    typeof doc === "object" &&
    "meta" in (doc as Record<string, unknown>)
  ) {
    const meta = (doc as Record<string, unknown>).meta;
    if (
      meta !== null &&
      typeof meta === "object" &&
      "version" in (meta as Record<string, unknown>)
    ) {
      return "ojp";
    }
  }
  return "otp";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatError(error: ErrorObject): string {
  switch (error.keyword) {
    case "enum":
      return `must be one of: ${(error.params as { allowedValues: unknown[] }).allowedValues
        .map((v) => JSON.stringify(v))
        .join(", ")}`;
    case "type":
      return `must be of type ${(error.params as { type: string }).type}`;
    case "required":
      return `missing required property '${(error.params as { missingProperty: string }).missingProperty}'`;
    case "format":
      return `must match format '${(error.params as { format: string }).format}'`;
    case "additionalProperties":
      return `has unexpected additional property '${(error.params as { additionalProperty: string }).additionalProperty}'`;
    case "const":
      return `must equal ${JSON.stringify((error.params as { allowedValue: unknown }).allowedValue)}`;
    case "minimum":
      return `must be >= ${(error.params as { limit: number }).limit}`;
    case "pattern":
      return `must match pattern ${(error.params as { pattern: string }).pattern}`;
    default:
      return error.message ?? "unknown error";
  }
}

function printUsage(): void {
  console.log(`
Open Talent Protocol Validator v0.1

Usage:
  otp-validate [--schema otp|ojp] <document.json>

Options:
  --schema otp   Validate against the Open Talent Protocol schema
  --schema ojp   Validate against the Open Job Protocol schema
  -h, --help     Show this help message

  When --schema is omitted, the schema is auto-detected from the document.

Examples:
  otp-validate examples/developer-junior.json
  otp-validate --schema ojp examples/backend-engineer-berlin.json
  otp-validate --schema otp my-profile.json

Exit codes:
  0  Document is valid
  1  Document is invalid or could not be read
`);
}

function fatal(message: string): never {
  console.error(`Error: ${message}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

main();
