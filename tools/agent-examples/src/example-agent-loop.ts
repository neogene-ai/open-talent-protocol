/**
 * Open Talent Protocol – Example Agent Loop
 *
 * Illustrates how a candidate agent would use the OTP tools
 * when it receives a profile and needs to reason about it.
 *
 * This is a STUB — not a production agent. It prints structured
 * output to stdout to demonstrate what a real agent would receive.
 *
 * Usage:
 *   node dist/example-agent-loop.js <path-to-otp-document.json>
 */

import { resolve } from "path";
import { validateProfile, introspectProfile } from "./otp-tools.js";

function main(): void {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: node dist/example-agent-loop.js <otp-document.json>");
    process.exit(1);
  }

  const filePath = resolve(args[0]);

  console.log("=".repeat(60));
  console.log("Open Talent Protocol — Example Agent Loop");
  console.log("=".repeat(60));
  console.log();

  // -------------------------------------------------------------------------
  // Step 1: Validate
  // An agent should always validate a profile on first load to ensure it
  // is well-formed before reasoning over it.
  // -------------------------------------------------------------------------

  console.log("[ TOOL CALL ] otp_validate_profile");
  console.log(`  input: { filePath: "${filePath}" }`);
  console.log();

  const validationResult = validateProfile({ filePath });

  console.log("[ TOOL RESULT ]");
  console.log(JSON.stringify(validationResult, null, 2));
  console.log();

  if (!validationResult.valid) {
    console.error("Profile failed validation. Agent cannot proceed.");
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // Step 2: Quick preference check
  // A candidate agent first checks preferences to decide whether to engage
  // with a given role or employer — before reading the full work history.
  // -------------------------------------------------------------------------

  console.log("[ TOOL CALL ] otp_introspect_profile (preferences only)");
  console.log(`  input: { filePath: "${filePath}", sections: ["preferences", "identity"] }`);
  console.log();

  const prefsResult = introspectProfile({
    filePath,
    sections: ["preferences", "identity"],
  });

  console.log("[ TOOL RESULT ]");
  console.log(JSON.stringify(prefsResult, null, 2));
  console.log();

  // -------------------------------------------------------------------------
  // Step 3: Full introspection
  // The agent now has all context needed to build a system prompt or
  // respond to a matching query from a hiring agent.
  // -------------------------------------------------------------------------

  console.log("[ TOOL CALL ] otp_introspect_profile (full)");
  console.log(`  input: { filePath: "${filePath}" }`);
  console.log();

  const fullResult = introspectProfile({ filePath });

  console.log("[ TOOL RESULT ]");
  console.log(JSON.stringify(fullResult, null, 2));
  console.log();

  // -------------------------------------------------------------------------
  // Step 4: Agent system prompt excerpt
  // Show how the agentSummary field would be used.
  // -------------------------------------------------------------------------

  console.log("=".repeat(60));
  console.log("EXAMPLE: Agent system prompt excerpt");
  console.log("=".repeat(60));
  console.log();
  console.log("You are a career agent representing the following candidate:");
  console.log();
  console.log(fullResult.agentSummary);
  console.log();
  console.log(
    "Your role is to represent this candidate honestly and accurately,",
  );
  console.log(
    "present them to employers whose requirements match their preferences,",
  );
  console.log(
    "and decline opportunities that violate their stated constraints.",
  );
  console.log();
}

main();
