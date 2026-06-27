[GENERATED USING CLAUDE CODE, OPUS 4.8]
AS OF COMMIT 9f883370e5bc91c357ae97b1b6cc84c6ba185516

I now have a comprehensive picture of the codebase. Let me compile the security audit report.

---
Security Audit Report — Alchemize

Scope: Full codebase (SvelteKit + Drizzle/Postgres). Audited against the priorities in CLAUDE.md: DB protection, secret/PII protection, admin-panel/impersonation defense, data-leak prevention, XSS.

Method: Read all server load functions, +server.ts endpoints, DB layer, auth flows, and the Svelte components rendering data. Agent findings were re-verified against source; several agent claims were downgraded after I confirmed the actual DB column selections.

I'll lead with the confirmed exploitable issues, ranked by severity.

---
🔴 CRITICAL

C-1.~ /admin/review2/[uuid] has NO authentication or authorization~
**FIXED AS OF COMMIT:61c439bbb7c9f4ee1d4f122b6b84488490899aa6 **

File: src/routes/admin/review2/[uuid]/+page.server.ts

export const load = async ({ params }) => {
    const { uuid } = params
    const projectResponse = await fetchProjectFromUnifiedUUID(uuid)
    ...
    return { project: data.records[0] }
}

There is no admin/+layout.server.ts — every admin route must guard itself, and this one doesn't read the admin_jwt cookie at all. Anyone (unauthenticated, any teenager) who has or guesses a project's unifiedId UUID can load this page and read the full project record: description, journals/logs, internal reviewer notes and justifications (message[].internalNote, message[].justification) — data your policy marks reviewer/admin-only. The [uuid]/+page.svelte explicitly renders internalNote.

▎ Note: fetchProjectFromUnifiedUUID (db.ts:890) does not select address/birthdate/lastName, so high-sensitivity PII is not leaked here — but internal notes leaking + a wide-open /admin/* route is still critical, and contradicts "Protect unauthorized access to the admin panel."

Fix: Add the same jwt.verify(admin_jwt, ADMIN_JWT_SECRET) + isT2Reviewer guard the sibling review2/+page.server.ts uses. Better: add an admin/+layout.server.ts that verifies the admin JWT once for the whole subtree (defense in depth — see C-2).

---
C-2. ~No shared admin guard → every admin route is one mistake away from C-1~
**FIXED, INTENDED BEHAVIOUR**

Files: all of src/routes/admin/**

There is no admin/+layout.server.ts. Each route re-implements the JWT check by hand. Most do it correctly, but C-1 proves the pattern is fragile: a single new route that forgets the boilerplate is fully exposed. SvelteKit layout loads do not automatically protect child +server.ts endpoints, but a layout guard would have caught the [uuid] page.

Fix: Add admin/+layout.server.ts performing the base admin-JWT verification and redirect. Keep per-endpoint role checks for the API +server.ts files (layouts don't cover those).

---
C-3. ~Reviewer endpoints allow acting on any project (IDOR) — by design, but unbounded~
**INTENDED BEHAVIOUR AS OF NOW, SUBJECT TO CHANGE AS WE GET MORE REVIEWERS**
Files: admin/review/accept/+server.ts, admin/review/reject/+server.ts, admin/review2/sendToAirtable/+server.ts
                    
These correctly verify admin_jwt + role (isReviewer / isT2Reviewer), but recordId/projectId come straight from the request body with no further scoping:

const { recordId, ... } = await request.json()
... patchProjectForShip(recordId, newLog, "accepted")   // accept
... addToJustifications({ ... })                          // sendToAirtable awards currency

For a trusted-reviewer model this is acceptable. The real risk is in sendToAirtable: it both ships PII to an external Airtable and credits user currency (updateUserCurrency) based on subtraction from the request body, with no idempotency / replay protection. A reviewer (or anyone who replays a captured request while the 6h admin JWT is valid) can call it repeatedly to mint currency and re-send PII. subtraction is also unvalidated (can be negative → inflate awarded hours).

Fix: Mark a project as "already submitted to HQ" atomically and reject re-submission; validate subtraction >= 0 and <= calculatedHours.

---
🟠 HIGH

H-1. ~Hardcoded fallback PII encryption key~
**FIXED AS OF COMMIT:61c439bbb7c9f4ee1d4f122b6b84488490899aa6 **


File: src/lib/utils.server.ts:4

const PII_ENCRYPTION_KEY = process.env.PII_ENCRYPTION_KEY || "default_key_32_bytes_long_1234567890";

If the env var is ever missing/empty, all PII (addresses, birthdates, names) is encrypted with a key committed to the repo — i.e., effectively plaintext to anyone with the source and a DB dump. AES-256-GCM also requires a 32-byte key passed as hex (Buffer.from(key,"hex")); this fallback string is 35 chars of non-hex, so it would actually throw — meaning the fallback gives a false sense of safety while masking misconfiguration.

Fix: Remove the fallback; fail closed at startup if PII_ENCRYPTION_KEY is absent or not 64 hex chars.

H-2. ~Admin OAuth id_token is decoded, not verified~
**FIXED: INTENDED BEHAVIOUR BECAUSE OF SERVER-SERVER COMMM**

File: src/routes/admin/callback/+server.ts:57

const decodedToken = jwt.decode(tokenBody.id_token) as {...}
const airtableRes = await doesAdminExist(decodedToken?.slack_id || "")

The user callback verifies its id_token signature against the HC JWKS (callback/+server.ts:87), but the admin callback only jwt.decodes it (no signature, no algorithms pin). The token comes from a server-to-server HTTPS exchange, so it's not trivially forgeable — but admission to the admin panel is gated entirely on slack_id from an unverified token. Any flaw allowing influence over that response (compromised egress, SSRF, a malicious token endpoint via misconfigured env) yields admin impersonation. Inconsistent with the user flow and with "make sure JWT tokens are verified."

Fix: Verify id_token against auth.hackclub.com/oauth/discovery/keys with algorithms:["RS256"], exactly like the user callback.

H-3. ~refer/+layout.server.ts "auth" check is presence-only~
**FIXED, JUST VERIFIES THE PERSON IS LOGGED IN, CHECKS IN +page.server.svelte ENSURES TOKEN INTEGRITY**

File: src/routes/refer/+layout.server.ts:15

const accessToken = cookies.get('access_token_new');
if (!accessToken || accessToken === "") { return { relogin: true } }

It only checks the cookie exists — never jwt.verify. The actual refer/+page.server.ts does verify user_token, so this is not independently exploitable today, but it's a misleading guard. Note +page.server.ts:82 also does data.id.slice(6) / data.slack_id with no null check — if user_token is missing/invalid, data is null and the page 500s (DoS-ish, minor).

Fix: Verify user_token in the layout and handle the null case.

---
🟡 MEDIUM

M-1. Hackatime access tokens stored in plaintext
**TO BE FIXED, HIGH PRIORITY**

File: src/routes/hackatime_callback/+server.ts:74 → patchUserHackatime → userTable.hackatime

Your policy lists Hackatime access tokens as HIGH sensitivity. They're persisted unencrypted in the users.hackatime column. A DB read compromise exposes long-lived (1-year) tokens to every user's Hackatime data. (Server-side handling is otherwise correct — the token is stripped from dashboard/+page.server.ts:84 before reaching the client. Good.)

Fix: Encrypt at rest with the same AES-GCM scheme used for project PII, or store in a secrets table with restricted access.

M-2. Currency/trade input lacks type & upper-bound validation

**TO BE FIXED, MEDIUM PRIORITY**

Files: dashboard/trade/trade/+server.ts:9-10, dashboard/shop/order/+server.ts:24

Both reject negativewith no Number.isInteger / Number.isFinite / max-bound checks. Non-integer floats or absurdly large values flow into currenciesToPotionMix and the atomic DB ops. Combined with C-3's replay gap, worth hardening.

Fix: Validate Number.isFinite, integer where expected, and a sane max; reject otherwise.

M-3. console.log(DATABASE_URL) on DB error

**FIXED ON LATEST COMMIT**
File: src/lib/db.ts:326

getUserByEmail's catch logs the full DATABASE_URL (credentials) to stdout. Anyone with log access gets DB creds.

Fix: Remove. Audit logs for other secret prints (the refer flow also console.logs decoded refer codes / Slack IDs in +page.server.ts:17).

M-4. Weak XOR cipher for referral codes
**INTENDED BEHAVIOUR, SUB AND SLACK IDs ARE SUPPOSED TO BE PUBLIC IN HC, REFER SYSTEM WILL BE REWORKED SOON**
Files: refer/+page.server.ts:11, callback/+server.ts:11, +page.server.ts:3

Referral codes wrap <userId> <slackId> in repeating-key XOR (key spec'd as only 8 chars, per .env.example:19). XOR with a short repeating key over known-format plaintext (slack IDs start with U) is trivially breakable, and the code travels in the URL. Slack IDs are LOW sensitivity per your policy, so impact is limited — but the format validation on decode (callback/+server.ts:119) is the only thing preventing forged referral records.

Fix: Use an authenticated token (HMAC or reuse JWT) instead of XOR if any integrity guarantee is desired.

---
🟢 LOW / Informational
                    and the raw client.query calls in db.ts all use $1 placeholders. ✅

---
What's done right (to preserve)

- User-action endpoints (ship, order, trade, project create/update/delete) correctly derive identity from a verified user_token and never trust client-supplied email. ✅
- updateProject/deleteProject scope by owner = email (no IDOR). ✅
- Shop/trade pricing computed server-side from DB; atomic transactions with SELECT ... FOR UPDATE prevent race-condition double-spend. ✅
- getAllProjects/getProjectsByOwner explicitly select non-PII columns; getProjectById (full PII) is documented "use with caution" and only used server-internally in ship/sendToAirtable without returning PII to the client. ✅
- dashboard/+page.server.ts strips the Hackatime token before returning user. ✅

---
Priority remediation order

1. C-1 — add auth guard to review2/[uuid] (one-line fix, actively exploitable).
2. C-2 — add admin/+layout.server.ts.
3. H-1 — remove hardcoded PII key fallback, fail closed.
4. C-3 — idempotency + subtraction validation on sendToAirtable (currency minting).
5. H-2 — verify admin id_token signature.
6. M-1, M-3 — encrypt Hackatime tokens; remove DATABASE_URL/secret logging.
