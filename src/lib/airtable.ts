import { AIRTABLE_PAT, AIRTABLE_BASE } from "$env/static/private";

const TOKEN = AIRTABLE_PAT;
const BASE_ID = AIRTABLE_BASE;
const TABLE_ID = "YSWS Project Submission";
export interface Submission {
	codeUrl: string;
	playableUrl?: string;



	firstName: string;
	lastName: string;
	email: string;

	screenshot?: string[]; // Public URLs

	description: string;
	githubUsername: string;

	address1: string;
	address2?: string;
	city: string;
	state: string;
	country: string;
	zip: string;

	birthday: string; // YYYY-MM-DD

	overrideHoursSpent?: number;
	overrideHoursJustification?: string;
}

export async function submitProjectToAirtable(data: Submission) {
	const res = await fetch(
		`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_ID)}`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${TOKEN}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				fields: {
					"Code URL": data.codeUrl,
					"Playable URL": data.playableUrl,


					"First Name": data.firstName,
					"Last Name": data.lastName,
					"Email": data.email,

					"Screenshot": data.screenshot?.map((url) => ({ url })),

					"Description": data.description,
					"GitHub Username": data.githubUsername,

					"Address (Line 1)": data.address1,
					"Address (Line 2)": data.address2,
					"City": data.city,
					"State / Province": data.state,
					"Country": data.country,
					"ZIP / Postal Code": data.zip,

					"Birthday": data.birthday,

					"Optional - Override Hours Spent":
						data.overrideHoursSpent,

					"Optional - Override Hours Spent Justification":
						data.overrideHoursJustification
				}
			})
		}
	);

	if (!res.ok) {
		return {
            ok: false,
            status: res.status,
            statusText: res.statusText,
            json: await res.json()
        }
	}

	return {
        ok: true,
        status: res.status,
        statusText: res.statusText,
        json: await res.json()
    }
}