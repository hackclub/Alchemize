import type { Actions, PageServerLoad } from './$types';
import { AIRTABLE, AIRTABLE_CLIENT } from '$env/static/private';
import { jwtDecode } from 'jwt-decode';
import { env } from '$env/dynamic/private';
import { getDataFromAccessToken } from '$lib/utils';
export const actions = {
	create: async (event) => {

        const accessToken = event.cookies.get('access_token');
        if (!accessToken) {
            return { error: 'No access token found' };
        }
        const email = (await getDataFromAccessToken(accessToken)).email;
        const formData = await event.request.formData();
        const projectName = formData.get('name') as string;
        const projectDescription = formData.get('description') as string;
        const projectType = formData.get('type') as string;
        const projectUrl = formData.get('demo') as string;
        const projectCode = formData.get('github') as string;
        const oldProject = formData.get('projectUpdate') as string;
        const hackatimeProject = formData.get('hackatime') as string;
        const theme = formData.get('theme') as string;
        const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_CLIENT}/Projects`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${AIRTABLE}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				fields: {
					Name: projectName,
					description: projectDescription,
					type: projectType,
					demo: projectUrl,
					code: projectCode,
                    status:"unshipped",
                    log:"",
                    hackatime: hackatimeProject,
                    languages:"",
                    update:oldProject,
                    journals:"",
                    owner: email,
                    Theme: theme,

				}
			})
		});

        // Error handling
        if (!response.ok) {
            const errorData = await response.json();
            const errorCode = errorData.error?.type || 'UNKNOWN_ERROR';
            const errorText = errorData.error?.message || 'An error occurred while creating the project';
            
            console.error('Project creation failed:', {
                status: response.status,
                errorCode,
                errorText,
                timestamp: new Date().toISOString()
            });

            return {
                success: false,
                error: {
                    title: 'Project creation failed',
                    code: errorCode,
                    message: `${errorText}. Please notify TheUtkarsh8939 on slack`
                }
            };
        }else{
            return{
                success: true,
            }
        }

	},
    update: async (event) => {
        		
   const accessToken = event.cookies.get('access_token');
        if (!accessToken) {
            return { error: 'No access token found' };
        }
        const email = (await getDataFromAccessToken(accessToken)).email;
        const formData = await event.request.formData();
        const projectName = formData.get('name') as string;
        const projectDescription = formData.get('description') as string;
        const projectType = formData.get('type') as string;
        const projectUrl = formData.get('demo') as string;
        const projectCode = formData.get('github') as string;
        const oldProject = formData.get('projectUpdate') as string;
        const hackatimeProject = formData.get('hackatime') as string;
        const theme = formData.get('theme') as string;
        const recordId = formData.get('recordId') as string;
        const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_CLIENT}/Projects/${recordId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${AIRTABLE}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: {
                    Name: projectName,
                    description: projectDescription,
                    type: projectType,
                    demo: projectUrl,
                    code: projectCode,
                    status: "unshipped",
                    log: "",
                    hackatime: hackatimeProject,
                    languages: "",
                    update: oldProject,
                    journals: "",
                    owner: email,
                    Theme: theme,
                    address:"",
                    birthdate:"",
                }
            })
        });

        // Error handling
        if (!response.ok) {
            const errorData = await response.json();
            const errorCode = errorData.error?.type || 'UNKNOWN_ERROR';
            const errorText = errorData.error?.message || 'An error occurred while updating the project';

            console.error('Project update failed:', {
                status: response.status,
                errorCode,
                errorText,
                timestamp: new Date().toISOString()
            });

            return {
                success: false,
                error: {
                    title: 'Project update failed',
                    code: errorCode,
                    message: `${errorText}. Please notify TheUtkarsh8939 on slack`
                }
            };
        } else {
            return {
                success: true
            };
        }

    }
} satisfies Actions;
export const load:PageServerLoad = async ({cookies})=>{
       const accessToken = cookies.get('access_token_new') ?? cookies.get('access_token');
        if (!accessToken) {
            return { error: 'No access token found' };
        }
        const email = (await getDataFromAccessToken(accessToken)).email;
    let hackatimeAccessToken = cookies.get('hackatime_token');
    let hacks = ""
    if (hackatimeAccessToken) {

        let hackatimes = await fetch(`https://hackatime.hackclub.com/api/v1/authenticated/projects?include_archived=false&start=${env.START_DATE}`,{
            headers: {
                Authorization: `Bearer ${hackatimeAccessToken}`,
                "Content-Type": 'application/json'
            }
        })
        hacks = await hackatimes.json()
        
    }

    if (!accessToken) {
        return {
            projects: []
        }
    }
    let projectsResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_CLIENT}/Projects?filterByFormula={owner}="${encodeURIComponent(email)}"`, {
        headers: {
            Authorization: `Bearer ${AIRTABLE}`,
            "Content-Type": 'application/json'
        }
    });
    const projectsData = await projectsResponse.json();
    console.log(hacks)
    return {
        projects: projectsData.records,
        hacks: hacks
    };
}
