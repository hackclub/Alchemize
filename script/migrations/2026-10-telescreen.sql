-- Telescreen (Robert) fraud review integration. Purely additive and idempotent: safe to run while the old code is
-- live. Run it BEFORE deploying the code that uses it: T1 accept, T2 push/return and the webhook all read these
-- tables, and the T2 award closes the project's submission in the same transaction that credits the currency.
--
-- telescreen_submissions: one row per Telescreen review of a project. A project is submitted when a T1 reviewer
-- accepts it; the row stays open ("closedAt" IS NULL) until the cycle ends (T2 award, a rejection, or a newer
-- ship that makes the review out of date). At most one open row per project.
--
-- There is deliberately no foreign key to projects: a participant may still delete their project, and the row
-- has to survive as the record of what Telescreen was asked and answered.
BEGIN;

-- Constraint and index names match the drizzle definition in src/lib/db.ts, so `drizzle-kit push` keeps them
CREATE TABLE IF NOT EXISTS telescreen_submissions (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "projectId" integer NOT NULL,
    -- Our id for the submission (Robert's externalId). Random, so it reveals nothing about the project or owner
    "externalId" uuid NOT NULL DEFAULT gen_random_uuid(),
    "robertProjectId" uuid,
    -- unsent until Robert confirms the submission, then mirrors Robert's state; withdrawn = deleted in Robert
    state varchar(32) NOT NULL DEFAULT 'unsent',
    "submittedAt" timestamp,
    "trustScore" integer,
    "reviewNote" varchar(5000),
    "reviewedAt" timestamp,
    "outcomeStatus" varchar(16),
    "outcomeReason" varchar(5000),
    "outcomeAt" timestamp,
    "outcomeBy" varchar(255),
    "outcomeSource" varchar(16),
    -- Super-admin approval without a Telescreen verdict (e.g. during an outage)
    "overrideBy" varchar(255),
    "overrideReason" varchar(2000),
    "overrideAt" timestamp,
    "closedAt" timestamp,
    "closeReason" varchar(64),
    "lastError" varchar(1000),
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now(),
    CONSTRAINT "telescreen_submissions_externalId_unique" UNIQUE ("externalId"),
    CONSTRAINT "telescreen_submissions_robertProjectId_unique" UNIQUE ("robertProjectId"),
    CONSTRAINT telescreen_submissions_state_check
        CHECK (state IN ('unsent', 'awaiting_review', 'awaiting_outcome', 'rejected_fraud', 'decided', 'withdrawn')),
    CONSTRAINT telescreen_submissions_trust_score_check CHECK ("trustScore" BETWEEN 1 AND 10),
    CONSTRAINT telescreen_submissions_outcome_status_check CHECK ("outcomeStatus" IN ('approved', 'rejected')),
    CONSTRAINT telescreen_submissions_outcome_source_check CHECK ("outcomeSource" IN ('alchemize', 'telescreen'))
);

CREATE UNIQUE INDEX IF NOT EXISTS telescreen_submissions_one_open
    ON telescreen_submissions ("projectId") WHERE "closedAt" IS NULL;
CREATE INDEX IF NOT EXISTS telescreen_submissions_project ON telescreen_submissions ("projectId");

-- Webhook deliveries already handled. Robert retries a failed delivery with the same deliveryId.
CREATE TABLE IF NOT EXISTS telescreen_webhook_deliveries (
    "deliveryId" uuid PRIMARY KEY,
    event varchar(32) NOT NULL,
    "robertProjectId" uuid,
    "receivedAt" timestamp NOT NULL DEFAULT now(),
    "processedAt" timestamp
);

COMMIT;
