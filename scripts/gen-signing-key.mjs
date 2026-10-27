/**
 * Main Responsibility: Writes a throwaway ES256 key to supabase/signing_keys.json.
 *
 * Sensitive Dependencies:
 * - supabase/config.toml sets `signing_keys_path`, and the Supabase CLI reads that file on EVERY
 *   command (start, link, db push, db dump), not just `start`. The real file is a private key and
 *   git-ignored, so a fresh CI checkout has none and the CLI aborts. All three workflows that run
 *   the CLI (playwright, deploy, supabase-backup) call this first.
 * - The key is never used against a remote project: it only has to exist and parse. Local CI
 *   `supabase start` uses it to sign MCP OAuth tokens for the run.
 */
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const jwk = generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey.export({ format: 'jwk' });
const key = { ...jwk, kid: randomUUID(), use: 'sig', key_ops: ['sign', 'verify'], alg: 'ES256', ext: true };
writeFileSync('supabase/signing_keys.json', JSON.stringify([key]));
