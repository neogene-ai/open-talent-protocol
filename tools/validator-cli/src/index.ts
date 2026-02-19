#!/usr/bin/env node
/**
 * Open Talent Protocol – Validator CLI
 *
 * Usage:
 *   node dist/index.js <path-to-otp-document.json>
 *
 * Validates the given JSON file against the Open Talent Protocol schema (v0.1)
 * and prints a human-readable result.
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

// The schema lives two directories up from tools/validator-cli/src/
const SCHEMA_PATH = resolve(
  __dirname,
  "../../../schema/opentalent-protocol.schema.json"
);

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printUsage();
    process.exit(0);
  }

  const documentPath = resolve(args[0]);

  // Load the schema
  let schema: unknown;
  try {
    schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
  } catch (err) {
    fatal(`Could not load schema from ${SCHEMA_PATH}: ${(err as Error).message}`);
  }

  // Load the document
  let document: unknown;
  try {
    document = JSON.parse(readFileSync(documentPath, "utf8"));
  } catch (err) {
    fatal(
      `Could not read document at ${documentPath}: ${(err as Error).message}`
    );
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
    console.log("\n✓ Valid Open Talent Protocol document\n");
    process.exit(0);
  } else {
    console.error("\n✗ Invalid Open Talent Protocol document\n");
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
  otp-validate <document.json>

Options:
  -h, --help    Show this help message

Examples:
  otp-validate examples/developer-junior.json
  otp-validate my-profile.json

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
