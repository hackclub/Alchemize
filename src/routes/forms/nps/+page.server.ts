import type { Actions } from "./$types"
import { fail } from "@sveltejs/kit"
import { createRSVP } from "$lib/db"

const MAX_ANSWER_LENGTH = 2000
// The form asks for a "Slack ID/Username" (free text), stored in rsvp."slackId" varchar(255)
const MAX_SLACK_LENGTH = 80

// Postgres rejects NUL in text and jsonb, so strip it instead of letting the insert fail
const readText = (formData: FormData, key: string): string => {
	const value = formData.get(key)
	return typeof value === "string" ? value.replace(/\u0000/g, "").trim() : ""
}

export const actions = {
	default: async event => {
		const formData = await event.request.formData()
		const scoreText = readText(formData, "score")
		const score = Number(scoreText)
		const slackId = readText(formData, "slack")
		const hear = readText(formData, "hear")
		const well = readText(formData, "well")
		const better = readText(formData, "better")
		const anythingElse = readText(formData, "else")

		if (scoreText === "" || !Number.isInteger(score) || score < 0 || score > 10) {
			return fail(400, { message: "Score must be a whole number from 0 to 10" })
		}
		if (slackId.length > MAX_SLACK_LENGTH) {
			return fail(400, { message: `Slack ID/username must be at most ${MAX_SLACK_LENGTH} characters` })
		}
		if ([hear, well, better, anythingElse].some(answer => answer.length > MAX_ANSWER_LENGTH)) {
			return fail(400, { message: `Answers must be at most ${MAX_ANSWER_LENGTH} characters` })
		}

		// Awaited: a rejected insert must become an error response, never an unhandled rejection
		try {
			await createRSVP({
				name: "NPS",
				moreData: { score: String(score), hear, well, better, anythingElse, slackId },
				slackId,
			})
		} catch (error) {
			console.error("Failed to save NPS response:", error)
			return fail(500, { message: "Could not save your response, please try again" })
		}
		return { success: true }
	},
} satisfies Actions
