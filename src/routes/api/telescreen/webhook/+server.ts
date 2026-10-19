import type { RequestHandler } from "./$types"
import { claimTelescreenWebhookDelivery, markTelescreenWebhookDeliveryProcessed } from "$lib/db"
import { handleOutcomeWebhook, telescreenConfig } from "$lib/server/telescreen"
import { isUuid, verifyWebhookSignature } from "$lib/server/telescreenClient"

// Telescreen (Robert) outcome webhook. Public on purpose (Robert has no session); trust comes only from the HMAC
// signature over the raw body, checked before anything is parsed. Answers carry no detail: any 2xx means
// "delivered", anything else makes Robert retry (8 attempts over ~45 hours).
const MAX_BODY_BYTES = 64 * 1024

const empty = (status: number) => new Response(null, { status })

export const POST: RequestHandler = async ({ request }) => {
	const config = telescreenConfig()
	if (!config?.webhookSecret || !config.eventSlug) {
		console.error("Telescreen webhook received but ROBERT_API_KEY, ROBERT_WEBHOOK_SECRET or ROBERT_EVENT_SLUG is not set")
		return empty(503)
	}
	if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
		return empty(413)
	}
	const rawBody = await request.text()
	if (rawBody.length > MAX_BODY_BYTES) {
		return empty(413)
	}
	const valid = verifyWebhookSignature(
		config.webhookSecret,
		request.headers.get("x-robert-timestamp"),
		request.headers.get("x-robert-signature"),
		rawBody
	)
	if (!valid) {
		return empty(401)
	}

	let payload: any
	try {
		payload = JSON.parse(rawBody)
	} catch {
		return empty(400)
	}
	const deliveryId = payload?.deliveryId
	const event = payload?.event
	if (!isUuid(deliveryId) || typeof event !== "string") {
		return empty(400)
	}
	// Signed with our secret but for another event: nothing of ours, and retrying won't change that
	if (payload.eventId !== config.eventSlug) {
		console.warn(`Telescreen webhook for event "${String(payload.eventId).slice(0, 64)}" ignored (expected "${config.eventSlug}")`)
		return empty(204)
	}

	const claim = await claimTelescreenWebhookDelivery(deliveryId, event, isUuid(payload.projectId) ? payload.projectId : null)
	if (claim === "processed") {
		return empty(204)
	}
	try {
		if (event === "outcome.set") {
			const result = await handleOutcomeWebhook(payload)
			console.info(`Telescreen webhook ${deliveryId}: outcome.set ${result}`)
		} else if (event === "ping") {
			console.info(`Telescreen webhook ${deliveryId}: ping received`)
		}
		await markTelescreenWebhookDeliveryProcessed(deliveryId)
	} catch (error) {
		// Left unprocessed so Robert's retry (same deliveryId) handles it again
		console.error(`Telescreen webhook ${deliveryId} failed, Telescreen will retry:`, error)
		return empty(500)
	}
	return empty(204)
}
