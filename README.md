# Alchemize Website
https://alchemize.hackclub.com

This is a website for the YSWS "Alchemize", it contains everyhing from review dashboard to fulfillment panel and others.

## Tech stack used:
- SvelteKit
- Tailwind CSS
- Airtable
- Vercel
- Hackclub Auth

## How it works:
- The website is built using SvelteKit, which is a framework for building web applications using Svelte.
- It uses Airtable as a database (Hackclub needs it 😭)
- The review platform would be a queue based system
- The dashboard would be a place for users to submit their projects and view their projects, as well as to edit their projects and check status and feedback from reviewers
- The website would be integrated with Hackclub Auth for user authentication and authorization
- The website would also be integrated with "Alchistant" a slack bot for notifications and updates on projects

## How to deploy
Just clone and run `npm install` and then `npm run dev` to start the development server. 

### Database migrations
Migrations are managed with drizzle-kit and live in `drizzle/`. They use `DATABASE_URL` (from `.env.local` / `.env`).

- After changing the schema in `src/lib/db.ts`, run `npm run db:generate` and commit the new files in `drizzle/`.
- To apply pending migrations, run `npm run db:migrate`. Run it **before** deploying code that needs them.

`db:migrate` runs `script/drizzleBaseline.mjs` first. On a database created before migrations moved to drizzle-kit
(production), that records `drizzle/0000_baseline.sql` as already applied, after checking the schema really matches.
It does nothing on a fresh database or one already tracked.

drizzle-kit is a dev dependency, so the production Docker image can't run migrations. Run them from a machine with
the repo checked out, with `DATABASE_URL` pointing at the target database. Don't use `drizzle-kit push` on a shared
database: it drops anything `src/lib/db.ts` doesn't declare.

### Enviornment variables
- PUBLIC_HACKCLUB_AUTH= Duplicate of Hackclub auth for client side
- HACKCLUB_AUTH=Hackclub auth client id
- HACKCLUB_SECRET=hackclub secret for server side authentication
- PUBLIC_HACKCLUB_REDIRECT=Duplicate of hackclub redirect for client side
- HACKCLUB_REDIRECT=Hackclub auth redirect url

- PUBLIC_HACKATIME_AUTH=Duplicate of Hackatime auth for client side
- HACKATIME_AUTH=Hackatime auth client id
- HACKATIME_SECRET=Hackatime secret for server side authentication
- PUBLIC_HACKATIME_REDIRECT=Duplicate of Hackatime redirect for client side
- HACKATIME_REDIRECT=Hackatime auth redirect url

- AIRTABLE_CLIENT=Airtable base ID
- AIRTABLE=Airtable API key

- START_DATE=hackatime start date (yyyy-mm-dd)
