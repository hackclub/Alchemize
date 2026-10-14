-- Tracks every attempt to submit a project to Unified (the YSWS Project Submission table in Airtable).
-- Purely additive and idempotent: safe to run while the old code is live. Run it BEFORE deploying the code that
-- uses it (the T2 "push to Airtable" button fails until this table exists).
--
-- An attempt is "started" before Airtable is called and becomes "submitted" in the same transaction that credits
-- the award. If the outcome is unknown (timeout, crash, failed commit) it stays "started", and the partial unique
-- index allows at most one such attempt per project, so a retry can't silently create a duplicate Unified record.
BEGIN;

CREATE TABLE IF NOT EXISTS unified_submissions (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "projectId" integer NOT NULL REFERENCES projects(id),
    status varchar(32) NOT NULL CHECK (status IN ('started', 'submitted', 'failed')),
    "approvedMinutes" integer NOT NULL CHECK ("approvedMinutes" >= 0),
    "amountHundredths" integer NOT NULL CHECK ("amountHundredths" >= 0),
    "reviewerSlackId" varchar(255) NOT NULL,
    "reviewerName" varchar(255) NOT NULL,
    "airtableRecordId" varchar(255),
    error varchar(1000),
    "startedAt" timestamp NOT NULL DEFAULT now(),
    "finishedAt" timestamp
);

CREATE UNIQUE INDEX IF NOT EXISTS unified_submissions_one_in_flight
    ON unified_submissions ("projectId") WHERE status = 'started';

COMMIT;
