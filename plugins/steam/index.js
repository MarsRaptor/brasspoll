// @ts-check
/// <reference path="../../@types/plugin_types.d.ts" />
const { request } = require('../../utils/HttpRequest.js');
const { compileFile } = require('pug');
const { safeParseJSON } = require('../../utils/JsonSafeParse.js');

/**
 * @class
 * @implements {BrasspollPlugin<{steam_appid: number,img?: string;icon?:string},{cover:string;link:string;storyline:string,summary:string,screenshots:{thumbnail:string,fullsize:string}[]}>}
 */
class SteamPlugin {
    static icon = "https://store.steampowered.com/favicon.ico";
    static search_result_regex = /data-ds-appid="(\d*)"[^\<]*<div class="match_name">([^"]*)<\/div>[^\<]*<div class="match_img"><img src="([^"]*)"><\/div>/gm;

    /** @type {string} */id;
    /** @type {string} */label;
    /** @type {(locals?: deep_t) => string} */details_template;

    constructor() {
        this.id = "steam";;
        this.label = "Steam store";
        this.details_template = compileFile(`${__dirname}/template.pug`);
    }

    /**
     * Search Steam Store for given prompt
     * @param {string} search 
     */
    async search(search) {
        let search_result_html = await request(`https://store.steampowered.com/search/suggest?term=${encodeURI(search)}&f=games&cc=FR&realm=1`);

        if (typeof search_result_html !== "string") {
            console.log(search_result_html, search);
            return [];
        }

        /**@type {full_option<{steam_appid: number,img?: string;icon?:string},{}>[]}} */
        const search_results = [];
        const regex = SteamPlugin.search_result_regex;
        let m;
        while ((m = regex.exec(search_result_html)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            let s = m[3];
            const n = s.indexOf('?');
            s = s.substring(0, n != -1 ? n : s.length);

            search_results.push(
                {
                    base_option: {
                        icon: SteamPlugin.icon,
                        steam_appid: Number.parseInt(m[1]),
                        label: m[2],
                        img: s,
                        plugin: this.id
                    }
                }
            );

        }

        return search_results;
    }

    /**
     * Sanitize input data for database operations, filter out duds
     * @param {base_option<{steam_appid: number,img?:string;icon?:string}>[]} retreival_data 
     * @returns {base_option<{steam_appid: number,img?:string;icon?:string}>[]} sanitized data 
     */
    sanitize(retreival_data) {
        let ids_fixed = retreival_data.map(d => {
            return Object.assign(d, {
                steam_appid: (typeof d.steam_appid === "number") ? d.steam_appid : (typeof d.steam_appid === "string") ? parseInt(d.steam_appid) : NaN
            });
        })
        return ids_fixed.filter(d => d.steam_appid !== NaN)
    }

    /**
     * Create postgresql query to retrieve a specific option associated to a strawpoll
     * @param {number} poll_id 
     * @param {base_option<{steam_appid: number,img?:string;icon?:string}>} retrieval_data 
     */
    optionQuery(poll_id, retrieval_data) {
        const query_object = `{"base_option": {"steam_appid":${retrieval_data.steam_appid}, "plugin":"${this.id}"}}`;
        return {
            text: `select j.options from (select options from brasspoll_polls WHERE poll_id = $1) as t
            join lateral ( select jsonb_agg(e.x) as options from jsonb_array_elements(t.options) as e(x) where e.x @> $2  ) as j on true`,
            values: [poll_id, query_object]
        };
    }

    /**
     * Fetch single option details from the Steam Store
     * @param {base_option<{steam_appid: number,img?:string;icon?:string}>} retreival_data 
     * @returns {Promise<full_option<{steam_appid: number,img?:string;icon?:string},{cover:string;link:string;storyline:string,summary:string,screenshots:{thumbnail:string,fullsize:string}[]}>>}
     */
    async fetchDetailsSingle(retreival_data) {

        const response = await request({
            hostname: `store.steampowered.com`,
            method: 'GET',
            path: `/api/appdetails?appids=${retreival_data.steam_appid}`,
            headers: {
                Origin: 'brasspoll.herokuapp.com'
            }
        });
        if (typeof response !== "string") {
            throw "Error parsing response"
        }

        /** @type {string | {[key:string]:{success:boolean;data:{steam_appid:number;name:string;about_the_game:string;short_description:string;header_image:string;screenshots:{id:number;path_thumbnail:string;path_full:string}[]}}}} */
        const parsed = safeParseJSON(response);
        if (typeof parsed === "string" || !!!parsed[`${retreival_data.steam_appid}`] || parsed[`${retreival_data.steam_appid}`].success !== true) {
            throw "Error parsing response";
        }
        const details = parsed[`${retreival_data.steam_appid}`].data;

        return {
            base_option: {
                label: details.name,
                steam_appid: details.steam_appid,
                icon: SteamPlugin.icon,
                plugin: this.id,
                img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${retreival_data.steam_appid}/capsule_sm_120.jpg`
            },
            cover: details.header_image,
            link: `https://store.steampowered.com/app/${retreival_data.steam_appid}/`,
            storyline: details.about_the_game,
            summary: details.short_description,
            screenshots: details.screenshots.map(s => {
                return {
                    thumbnail: s.path_thumbnail,
                    fullsize: s.path_full
                }
            })
        }
    }

    /**
     * Fetch multiple option details from the Steam Store
     * @param {base_option<{steam_appid: number,img?:string;icon?:string}>[]} retreival_data 
     * @returns {Promise<full_option<{steam_appid: number,img?:string;icon?:string},{cover:string;link:string;storyline:string,summary:string,screenshots:{thumbnail:string,fullsize:string}[]}>[]>}
     */
    fetchDetails(retreival_data) {
        if (retreival_data === undefined || retreival_data === null || retreival_data.length <= 0) {
            return new Promise((resolve, _) => { resolve([]) });
        }
        return Promise.all(retreival_data.map(d => this.fetchDetailsSingle(d)));
    }
}

exports.SteamPlugin = SteamPlugin;