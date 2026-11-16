import js from "@eslint/js"
import prettier from "eslint-config-prettier"
import svelte from "eslint-plugin-svelte"
import globals from "globals"
import ts from "typescript-eslint"
import svelteConfig from "./svelte.config.js"

export default ts.config(
	{
		ignores: ["build/", ".svelte-kit/", ".vercel/", "node_modules/", "drizzle/", "static/", ".claude/"],
	},
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
		},
		rules: {
			// TypeScript already reports undefined names, and no-undef does not understand its global types
			"no-undef": "off",
			eqeqeq: ["error", "always", { null: "ignore" }],
			"no-var": "error",
			"prefer-const": "error",
			"object-shorthand": "error",
			"no-useless-rename": "error",
			"no-else-return": "error",
			"no-console": ["error", { allow: ["warn", "error", "info"] }],
			"@typescript-eslint/consistent-type-imports": "error",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{ argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
			],
		},
	},
	{
		files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
		languageOptions: {
			parserOptions: {
				parser: ts.parser,
				extraFileExtensions: [".svelte"],
				svelteConfig,
			},
		},
	},
	{
		// One-off maintenance scripts and manual tests report progress on stdout
		files: ["script/**", "testing/**"],
		rules: { "no-console": "off" },
	}
)
