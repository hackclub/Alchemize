import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async () => {
	const response = await fetch("https://rsvp.hackclub.community/api/stats?slug=alchemize-ysws", {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
	})
	const data = await response.json()
	return new Response(JSON.stringify({ count: data.count }), {
		headers: { "Content-Type": "application/json" },
	})
}
