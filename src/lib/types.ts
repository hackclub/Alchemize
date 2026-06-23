export type Log = {
	status: 0 | 1 | 2 //0 = Pending, 1 = Approved, 2 = Rejected
	timestamp: string
	deltaTime: number //in minutes
	message: message[]
	submmitedToHQ: boolean
}

export type message = {
	userExternal: string
	internalNote: string
	justification: string
	timestamp: string
	reviewerName?: string
}
export interface Project {
	owner?: string
	id: string
	name: string
	hours: number
	submittedBy: string
	type: string
	category: string
	description: string
	log: Log[]
	demo?: string
	code?: string
	readme?: string
	hackatime: string
	update?: boolean
	screenshot?: string
}
export interface AirtableProject {
	id: string
	fields: {
		Name: string
		description: string
		code?: string
		demo?: string
		type: string
		update?: boolean
		hackatime: string
		journals: string
		languages: string
		log: string
		owner: string
		status: string
		slackId: string
		Theme: string
		screenshot: string
	}
}
export interface AirtableProjectWithPII extends AirtableProject {
	fields: AirtableProject["fields"] & {
		firstName: string
		lastName: string
		address: string
		birthdate: string
		unifiedId: string
	}
}
export interface AdminProjectView extends AirtableProject {
	fields: AirtableProject["fields"] & {
		firstName: string
		lastName: string
		address: string
		birthdate: string
	}
}
export interface AdminProjectViewNormal extends Project {
	firstName: string
	lastName: string
	address: string
	birthdate: string
	Theme: string
}
export interface Item {
	itemID: string
	name: string
	description: string
	cdnImage: string
	itemPrice: UserCurrency
}
export interface UserCurrency {
	redstone: number
	glowstone: number
	aqua_regia: number
	potion_mix: number
}
export interface AirtableReferRecord {
	id: string
	createdTime: string
	fields: {
		referedEmail: string
		referer: string
		yswsEligible: string
		verified: string
		referedName: string
	}
}
export interface Refers {
	referer: string
	referedName: string
}
export interface AdminJWT {
	slackId: string
	email: string
	name: string
	roles: string
	isReviewer: boolean
	isT2Reviewer: boolean
	isSuperAdmin: boolean
	isFulfiller: boolean
}
export interface AirtableUser {
	id: string
	createdTime: string
	fields: {
		userId: string
		email: string
		hackatime: string
		currency: string
	}
}
export interface User {
	email: string
	currency: string
}
export interface UserAuthToken {
	id: string
	dbid: string
	email: string
	verification_status: string
	first_name: string
	last_name: string
	slack_id: string
	ysws_eligible: boolean
	version: number
}
export interface Address {
	id: string
	first_name: string
	last_name: string
	line_1: string
	city: string
	state: string
	postal_code: string
	country: string
	phone_number: string
	primary: boolean
}
