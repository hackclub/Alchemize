# Alchemize Website
https://alchemize.hackclub.com

This is a website for the YSWS "Alchemize", it would contain a dashboard and review platform when complete

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
