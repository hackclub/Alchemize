CREATE TABLE "admins" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admins_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slackId" varchar(255) NOT NULL,
	"email" varchar(455) NOT NULL,
	"roles" varchar(355) NOT NULL,
	"name" varchar(255) NOT NULL,
	"nda" varchar(255) NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email"),
	CONSTRAINT "admins_slack_id_not_empty" CHECK ("slackId" <> '')
);
--> statement-breakpoint
CREATE TABLE "justifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "justifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) DEFAULT '' NOT NULL,
	"projectId" varchar(255) NOT NULL,
	"email" varchar(455) NOT NULL,
	"demo" varchar(1000) NOT NULL,
	"code" varchar(1000) NOT NULL,
	"screenshot" varchar(1000) NOT NULL,
	"screenshot2" varchar(1000) DEFAULT '' NOT NULL,
	"description" varchar(2000) NOT NULL,
	"address" varchar(2000) NOT NULL,
	"city" varchar(255) NOT NULL,
	"state" varchar(255) NOT NULL,
	"country" varchar(255) NOT NULL,
	"zip" varchar(255) NOT NULL,
	"birthdate" varchar(255) NOT NULL,
	"overrideHoursSpent" varchar(255) NOT NULL,
	"justification" varchar(5000) NOT NULL,
	"firstName" varchar(255) NOT NULL,
	"lastName" varchar(255) NOT NULL,
	"iv" varchar(255) DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ledger_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"email" varchar(455) NOT NULL,
	"slackId" varchar(255) NOT NULL,
	"sign" boolean NOT NULL,
	"amount" real NOT NULL,
	"amountHundredths" integer,
	"currencyType" varchar(255) NOT NULL,
	"reason" varchar(455) NOT NULL,
	"remarks" varchar(1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"orderItem" varchar(255) NOT NULL,
	"itemID" uuid NOT NULL,
	"qty" varchar(255) NOT NULL,
	"ordererEmail" varchar(455) NOT NULL,
	"ordererUid" varchar(255) NOT NULL,
	"status" varchar(255) NOT NULL,
	"fulfiller" varchar(255),
	"moreData" varchar(3000),
	"dateCreated" varchar(255) DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') NOT NULL,
	"priceHundredths" integer
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "projects_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"Name" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"description" varchar(2000) NOT NULL,
	"owner" varchar(455) NOT NULL,
	"log" varchar(500000) NOT NULL,
	"languages" varchar(1000) NOT NULL,
	"journals" varchar(30000) NOT NULL,
	"hackatime" varchar(1000) NOT NULL,
	"update" varchar(255),
	"code" varchar(1000),
	"demo" varchar(1000),
	"Theme" varchar(255) NOT NULL,
	"address" varchar(10000) NOT NULL,
	"birthdate" varchar(1000) NOT NULL,
	"slackId" varchar(255) NOT NULL,
	"status" varchar(255) NOT NULL,
	"firstName" varchar(1000) NOT NULL,
	"lastName" varchar(1000) NOT NULL,
	"screenshot" varchar(1000) DEFAULT '' NOT NULL,
	"screenshot2" varchar(1000) DEFAULT '' NOT NULL,
	"unifiedId" uuid DEFAULT gen_random_uuid() NOT NULL,
	"encryptionIv" varchar(255) DEFAULT '' NOT NULL,
	CONSTRAINT "projects_unifiedId_unique" UNIQUE("unifiedId")
);
--> statement-breakpoint
CREATE TABLE "refers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "refers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"referedEmail" varchar(455) NOT NULL,
	"referer" varchar(355) NOT NULL,
	"yswsEligible" varchar(255) NOT NULL,
	"verified" varchar(255) NOT NULL,
	"referedName" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rsvp" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "rsvp_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"program" varchar(255) NOT NULL,
	"slackId" varchar(255),
	"data" jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_items" (
	"itemID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(1000) NOT NULL,
	"itemPrice" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"priceHundredths" integer DEFAULT 0 NOT NULL,
	"cdnImage" varchar(1000) NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unified_submissions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "unified_submissions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"projectId" integer NOT NULL,
	"status" varchar(32) NOT NULL,
	"approvedMinutes" integer NOT NULL,
	"amountHundredths" integer NOT NULL,
	"reviewerSlackId" varchar(255) NOT NULL,
	"reviewerName" varchar(255) NOT NULL,
	"airtableRecordId" varchar(255),
	"error" varchar(1000),
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"finishedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_internal_data" (
	"userId" varchar(255) PRIMARY KEY NOT NULL,
	"email" varchar(455) NOT NULL,
	"address" varchar NOT NULL,
	"birthdate" varchar(1000) NOT NULL,
	"firstName" varchar(1000) NOT NULL,
	"lastName" varchar(1000) NOT NULL,
	"iv" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userid" varchar(255) NOT NULL,
	"email" varchar(455) NOT NULL,
	"hackatime" varchar(1000),
	"slackId" varchar(255),
	"currency" varchar(2000) DEFAULT '{}' NOT NULL,
	"balanceHundredths" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "unified_submissions" ADD CONSTRAINT "unified_submissions_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admins_slack_id_unique" ON "admins" USING btree ("slackId") WHERE "slackId" <> '';--> statement-breakpoint
CREATE UNIQUE INDEX "unified_submissions_one_in_flight" ON "unified_submissions" USING btree ("projectId") WHERE status = 'started';