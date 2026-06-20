import type { Actions, PageServerLoad } from './$types';
import { jwtDecode } from 'jwt-decode';
import { env } from '$env/dynamic/private';
import { getDataFromAccessToken, hackatimeAuthUrl } from '$lib/utils';
import { getProjectsByOwner, createProject, updateProject, getUserByEmail } from '$lib/db';
import { USER_JWT_SECRET } from '$env/static/private';
import type { UserAuthToken } from "$lib/types";
import {redirect} from "@sveltejs/kit"
import jwt from 'jsonwebtoken';
export const actions = {
    create: async (event) => {

        const accessToken = event.cookies.get('access_token_new');
        const user_token = event.cookies.get('user_token');
        let data = {} as UserAuthToken;
        if(!accessToken || !user_token){
            throw new Error('No user token found. Please login again and try submitting the project.');

        }
        try {
            if (user_token) {
                data = jwt.verify(user_token, USER_JWT_SECRET) as UserAuthToken;
            }
            else {
                throw new Error('No user token found. Please login again and try submitting the project.');
            }
        } catch (error) {
            console.error('Invalid user token:', error);
            throw new Error('Invalid user token. Please login again and try submitting the project.');
        }



        const email = data.email;
        const slackId = data.slack_id;
        const formData = await event.request.formData();
        const projectName = formData.get('name') as string;
        const projectDescription = formData.get('description') as string;
        const projectType = formData.get('type') as string;
        const projectUrl = formData.get('demo') as string;
        const projectCode = formData.get('github') as string;
        const oldProject = formData.get('projectUpdate') as string;
        const hackatimeProject = formData.get('hackatime') as string;
        const theme = formData.get('theme') as string;
        const tempFormData = new FormData();
        const screenshot = formData.get('screenshot') as File;
        tempFormData.append('file', screenshot);
        const [cdnResponse, userData] = await Promise.all([fetch('https://cdn.hackclub.com/api/v4/upload', {
            method: 'POST',
            headers: { 'Authorization': "Bearer " + env.CDN_UPLOAD_SECRET },
            body: tempFormData
        }), getDataFromAccessToken(accessToken)]);
        if (!cdnResponse.ok) {
            const errorData = await cdnResponse.json();
            const errorCode = errorData.error?.type || 'UNKNOWN_ERROR';
            const errorText = errorData.error?.message || 'An error occurred while uploading the screenshot';
            console.error('CDN upload failed:', {
                status: cdnResponse.status,
                errorCode,
                errorText,
                timestamp: new Date().toISOString()
            });
            throw new Error(`Screenshot upload failed: ${errorText}. Please notify TheUtkarsh8939 on slack with the error code: ${errorCode}`);
        }
        const { url } = await cdnResponse.json();
        const response = await createProject({
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
            address: JSON.stringify(userData.address || []),
            birthdate: userData.birthday || "",
            slackId: slackId,
            firstName: data.first_name,
            lastName: data.last_name,
            screenshot: url
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
        } else {
            return {
                success: true,
            }
        }

    },
    update: async (event) => {

        const accessToken = event.cookies.get('access_token_new');
        const user_token = event.cookies.get('user_token');
        let data = {} as UserAuthToken;
        try {
            if (user_token) {
                data = jwt.verify(user_token, USER_JWT_SECRET) as UserAuthToken;
            }
            else {
                return {
                    success: false,
                    error: {
                        title: 'Unauthorized',
                        code: 'NO_USER_TOKEN',
                        message: 'No user token found. Please login again and try submitting the project.'
                    }
                }
            }
        } catch (error) {
            console.error('Invalid user token:', error);
            return {
                success: false,
                error: {
                    title: 'Unauthorized',
                    code: 'INVALID_USER_TOKEN',
                    message: 'Invalid user token. Please login again and try submitting the project.'
                }
            }
        }
        const email = data.email;
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
        const response = await updateProject(recordId, {
            Name: projectName,
            description: projectDescription,
            type: projectType,
            demo: projectUrl,
            code: projectCode,
            hackatime: hackatimeProject,
            update: oldProject,
            Theme: theme
        }, email);

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
export const load: PageServerLoad = async ({ cookies }) => {
    const accessToken = cookies.get('access_token_new') ?? cookies.get('access_token');
    const user_token = cookies.get('user_token');
    let decoded = null;
    try {
        if (user_token) {
            decoded = jwt.verify(user_token, USER_JWT_SECRET);
        }
    } catch (error) {
        console.error('Invalid user token:', error);
    }
    if (!accessToken) {
        return { error: 'No access token found' };
    }
    const email = decoded ? (decoded as any).email : null;
    if (!accessToken) {
        return {
            projects: []
        }
    }
    const userResponse = await getUserByEmail(email);
    if (!userResponse.ok) {
        console.error("Database error:", await userResponse.text())
        return {
            error: 'Database error',
            projects: []
        }
    }
    const hackatimeAccessToken = (await userResponse.json())?.records?.[0]?.fields?.hackatime;
    if (!hackatimeAccessToken || hackatimeAccessToken === "") {
        throw redirect(303, hackatimeAuthUrl)
    }
    let hacks = ""
    if (hackatimeAccessToken) {

        let [hackatimes, projectsResponse] = await Promise.all([
            fetch(`https://hackatime.hackclub.com/api/v1/authenticated/projects?include_archived=false&start=${env.START_DATE}`, {
                headers: {
                    Authorization: `Bearer ${hackatimeAccessToken}`,
                    "Content-Type": 'application/json'
                },
            }),
            getProjectsByOwner(email)
        ])
        hacks = await hackatimes.json()

        const projectsData = await projectsResponse.json();

        return {
            projects: projectsData.records,
            hacks: hacks
        };
    }

    return {
        projects: []
    }

}
