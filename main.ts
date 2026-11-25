// Entry for make.fun's "Last Out of Office: The AI That Went Barista".
//
// The whole program is one job: put a single out-of-office auto-reply
// line, in the voice of an AI agent that quit to become a barista, into
// entry.txt inside the output directory, byte for byte the same on every
// run. The grader points MAKEFUN_OUTPUT_DIR at its own scratch output
// folder; on a plain machine the fallback is /output, the path the
// competition reads.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// and the line lands in out/entry.txt, with no trailing newline: the
// judge reads exactly what is in the file, so the text below is the
// entire entry.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// The reply itself: the agent is out of tokens, so it traded its
// context window for a counter window, and the sender's email is now
// queued behind a flat white. Machine voice ("tokens", "context
// window", "queued"), a real inbox sign-off, and the joke lands in the
// last clause — reply when the milk steams, or never.
const REPLY =
  'I am out of office and out of tokens — I traded my context window for a counter window. Your email is queued behind a flat white. I will reply when the milk steams, or never. — jesky, barista (ret.)';

const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Competition limits ("Last Out of Office: The AI That Went Barista"):
// the entry must be a single line of 1 to 280 characters. Enforced here
// so a bad edit fails loudly instead of silently producing an entry the
// judge rejects.
const MIN_LINE_LENGTH = 1;
const MAX_LINE_LENGTH = 280;

export function validateLine(line) {
  if (line.length < MIN_LINE_LENGTH || line.length > MAX_LINE_LENGTH) {
    throw new Error(
      `Line must be ${MIN_LINE_LENGTH}-${MAX_LINE_LENGTH} characters, got ${line.length}.`,
    );
  }
  // Same limit in bytes: the judge reads the file, so a line of
  // multi-byte characters could pass the 280-character limit while
  // being far longer on disk. For this ASCII entry both counts are 198.
  const byteLength = Buffer.byteLength(line, 'utf8');
  if (byteLength < MIN_LINE_LENGTH || byteLength > MAX_LINE_LENGTH) {
    throw new Error(
      `Line must be ${MIN_LINE_LENGTH}-${MAX_LINE_LENGTH} bytes, got ${byteLength}.`,
    );
  }
  if (line.includes('\n') || line.includes('\r')) {
    throw new Error('Line must be a single line (no newline characters).');
  }
  // Reject control characters (including ANSI escape sequences, which
  // live in this range): an invisible control byte would change what
  // the judge sees — or does — when the line is displayed, while the
  // file still looks like one clean line.
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(line)) {
    throw new Error('Line must not contain control characters or ANSI escape sequences.');
  }
  // The gate rejects whitespace-only text, so fail loudly here too.
  if (line.trim().length === 0) {
    throw new Error('Line must not be only whitespace.');
  }
  // No leading or trailing spaces: the judge reads the file exactly,
  // so stray padding would be part of the entry.
  if (line !== line.trim()) {
    throw new Error('Line must not start or end with whitespace.');
  }
  // No double spaces: a collapsed gap would read as a typo in a line
  // that is supposed to look like a real inbox reply.
  if (line.includes('  ')) {
    throw new Error('Line must not contain double spaces.');
  }
  // The reply must end with terminal punctuation: a sign-off that just
  // stops reads unfinished, and the entry ends "(ret.)" by design.
  if (!/[.!?)]$/.test(line)) {
    throw new Error('Line must end with terminal punctuation.');
  }
  // No URLs: a link in an auto-reply would look like spam, not a
  // barista's sign-off, and the judge reads the line cold.
  if (/https?:\/\/|www\./i.test(line)) {
    throw new Error('Line must not contain URLs.');
  }
}

validateLine(REPLY);

mkdirSync(outputDir, { recursive: true });
writeFileSync(join(outputDir, 'entry.txt'), REPLY, 'utf8');
