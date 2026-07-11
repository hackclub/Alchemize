import adapterVercel from '@sveltejs/adapter-vercel';
import adapterNode from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Check the environment variable to choose the target
const isVercelTarget = process.env.DEPLOY_TARGET === 'vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// Dynamically swap the adapter here
		adapter: isVercelTarget ? adapterVercel() : adapterNode(),

	},
	experimental:{
		async: true
	}
};

export default config;