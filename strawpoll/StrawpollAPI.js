// @ts-check
const { request } = require('../utils/HttpRequest.js');

/**
 * Fetch strawpoll.me poll for id
 * @param {any} id (preferably a number) 
 * @returns {Promise<{id: number,title:string,multi: boolean,options: string[],votes: number[],dupcheck?:dupcheck,captcha?:boolean} | "No poll given" | "Error in response from strawpoll API">} strawpoll or error string
 */
async function fetchPoll(id) {
    const poll_id = (typeof id === "number") ? id : (typeof id === "string") ? parseInt(id) : NaN;
    if (isNaN(poll_id)) {
        return "No poll given";
    }
    const response = await request(`https://www.strawpoll.me/api/v2/polls/${poll_id}`);
    if (typeof response === "string") {
        try {
            const poll = JSON.parse(response);
            return poll;
        } catch (error) {
            return "Error in response from strawpoll API";
        }
    } else {
        return "Error in response from strawpoll API";
    }
}

/**
 * Create and return new strawpoll.me poll
 * @param {{title:string,multi:boolean,options:string[],dupcheck?:"normal" | "permissive" | "disabled",captcha?:boolean}} poll_request 
 * @returns {Promise<{id:number,title:string,multi:boolean,options:string[],dupcheck?:"normal" | "permissive" | "disabled",captcha?:boolean} | "Error in response from strawpoll API">} strawpoll or error string
 */
async function create(poll_request) {
    const response = await request(
        {
            host: `www.strawpoll.me`,
            method: 'POST',
            path: `/api/v2/polls`,
            headers: {
                Origin: 'brasspoll.herokuapp.com',
                Accept: "application/json",
            }
        },
        JSON.stringify(poll_request)
    );
    if (typeof response === "string") {
        try {
            const poll = JSON.parse(response);
            return poll;
        } catch (error) {
            return "Error in response from strawpoll API";
        }
    } else {
        return "Error in response from strawpoll API";
    }
}

exports.fetchPoll = fetchPoll;
exports.create = create;