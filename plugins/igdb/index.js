// @ts-check
/// <reference path="../../@types/plugin_types.d.ts" />
const { request } = require('../../utils/HttpRequest.js');
const { compileFile } = require('pug');
const { safeParseJSON } = require('../../utils/JsonSafeParse.js');

/**
 * @class
 * @implements {BrasspollPlugin<{id: number,img?: string;icon?:string},{cover: string;link: string;storyline: string,summary: string,screenshots: {thumbnail: string,fullsize: string}[]}>}
 */
class IgdbPlugin {
    static icon = "https://www.igdb.com/favicon.ico"
    /** @type {string} */id;
    /** @type {string} */label;
    /** @type {(locals?: deep_t) => string} */details_template;
    //==OAUTH2 PROPERTIES 
    /** @type {string} */ client_id = process.env.IDGB_OAUTH_CLIENT_ID;
    /** @type {string} */ client_secret = process.env.IDGB_OAUTH_CLIENT_SECRET;
    /** @type {{access_token: string, expires_at: number}} */tokenHolder;

    constructor() {
        this.id = "igdb";;
        this.label = "Steam store";
        this.details_template = compileFile(`${__dirname}/template.pug`);
        this.client_id = process.env.IDGB_OAUTH_CLIENT_ID;
        this.client_secret = process.env.IDGB_OAUTH_CLIENT_SECRET;
        this.tokenHolder = {
            access_token: "",
            expires_at: 0
        }
    }

    async _refreshAccessToken() {
        if (Date.now() >= this.tokenHolder.expires_at) {
            const response = await request({
                hostname: `id.twitch.tv`,
                method: 'POST',
                path: `/oauth2/token?client_id=${this.client_id}&client_secret=${this.client_secret}&grant_type=client_credentials`
            });
            if (typeof response !== "string") {
                return false;
            }
            /** @type {string | {access_token: string, expires_in: number, token_type: string}} */
            const accessToken = safeParseJSON(response);
            if (typeof accessToken === "string") {
                return false;
            }

            this.tokenHolder = {
                access_token: accessToken.access_token,
                expires_at: Date.now() + ((accessToken.expires_in - 2) * 1000)
            }
        }
        return true
    }

    /**
     * Search IGDB database for given prompt
     * @param {string} search 
     */
    async search(search) {

        const search_response = await request({
            hostname: `www.igdb.com`,
            method: 'GET',
            path: `/search_autocomplete_all?q=${encodeURI(search)}`,
            headers: {
                Origin: 'brasspoll.herokuapp.com'
            }
        });
        if (typeof search_response !== "string") {
            throw "Error parsing response";
        }

        /** @type {string | { game_suggest: { "id": number, "score": number, "name": string, "value": string, "url": string, "cloudinary": string }[] }} */
        const search_suggestions = safeParseJSON(search_response);
        if (typeof search_suggestions === "string") {
            throw search_suggestions;
        } else if (!!!search_suggestions.game_suggest) {
            throw "Error parsing response";
        }

        return search_suggestions.game_suggest.map(suggestion => {
            return {
                base_option: {
                    icon: IgdbPlugin.icon,
                    id: suggestion.id,
                    label: suggestion.name,
                    img: (!!suggestion.cloudinary) ? `https://images.igdb.com/igdb/image/upload/t_thumb/${suggestion.cloudinary}.jpg` : "",
                    plugin: this.id
                }
            }
        });
    }

    /**
     * Sanitize input data for database operations, filter out duds
     * @param {base_option<{id: number,img?:string;icon?:string}>[]} retreival_data 
     * @returns {base_option<{id: number,img?:string;icon?:string}>[]} sanitized data 
     */
    sanitize(retreival_data) {
        let ids_fixed = retreival_data.map(d => {
            return Object.assign(d, {
                steam_appid: (typeof d.id === "number") ? d.id : (typeof d.id === "string") ? parseInt(d.id) : NaN
            });
        })
        return ids_fixed.filter(d => d.steam_appid !== NaN)
    }

    /**
     * Fetch multiple option details from the IGDB database
     * @param {base_option<{id: number,img?:string;icon?:string}>[]} retreival_data 
     * @param {boolean} optimize
     * @returns {Promise<full_option<{id: number,img?:string;icon?:string},{cover: string;link: string;storyline: string,summary: string,screenshots: {thumbnail: string,fullsize: string}[]}>[]>}
     */
    async fetchDetails(retreival_data,optimize) {
        if ((await this._refreshAccessToken()) !== true) throw "Error refreshing IGDB access Token";

        // GET GAMES UNPOPULATED DETAILS
        const games_response = await request(
            {
                hostname: `api.igdb.com`,
                method: 'POST',
                path: `/v4/games`,
                headers: {
                    'Accept': 'application/json',
                    'Client-ID': this.client_id,
                    'Authorization': `Bearer ${this.tokenHolder.access_token}`,
                }
            },
            `fields cover,name,screenshots,storyline,summary,url; where id=(${retreival_data.map(d => d.id)});`
        );
        if (typeof games_response !== "string") {
            throw "Error parsing response"
        }
        /** @type {{ id: number, cover: number, name: string, screenshots: number[], storyline: string, summary: string, url: string }[] | string} */
        const games = safeParseJSON(games_response);
        if (typeof games === "string") {
            throw games;
        }

        // GET COVERS
        const cover_ids = games.map(g => g.cover);
        const cover_response = await request(
            {
                hostname: `api.igdb.com`,
                method: 'POST',
                path: `/v4/covers`,
                headers: {
                    'Accept': 'application/json',
                    'Client-ID': this.client_id,
                    'Authorization': `Bearer ${this.tokenHolder.access_token}`,
                }
            },
            `fields url; where id=(${cover_ids.join(",")});`
        );
        if (typeof cover_response !== "string") {
            throw "Error parsing response";
        }
        /** @type {{ id: number, url: string }[] | string} */
        const covers = safeParseJSON(cover_response);
        if (typeof covers === "string") {
            throw covers;
        }

        // GET SCREENSHOTS
        const screenshot_ids = games.map(g => g.screenshots).reduce((flat, id) => flat.concat(id), []);
        const screenshots_response = await request(
            {
                hostname: `api.igdb.com`,
                method: 'POST',
                path: `/v4/screenshots`,
                headers: {
                    'Accept': 'application/json',
                    'Client-ID': this.client_id,
                    'Authorization': `Bearer ${this.tokenHolder.access_token}`,
                }
            },
            `fields url; where id=(${screenshot_ids.join(",")});`
        );
        if (typeof screenshots_response !== "string") {
            throw "Error parsing response";
        }
        /** @type {{ id: number, url: string }[] | string} */
        const screenshots = safeParseJSON(screenshots_response);
        if (typeof screenshots === "string") {
            throw screenshots;
        }

        // POPULATE DETAILS
        /** @type {full_option<{id: number,img?:string;icon?:string},{cover: string;link: string;storyline: string,summary: string,screenshots: {thumbnail: string,fullsize: string}[]}>[]} */
        const details = [];
        for (const base_option of retreival_data) {
            const game = games.find(g => g.id == base_option.id);
            if (!!!game) continue;
            const game_cover = covers.find(c => game.cover == c.id);
            const game_screenshots = screenshots.filter(ss => game.screenshots.indexOf(ss.id) > 0);

            details.push({
                base_option: {
                    label: game.name,
                    id: game.id,
                    icon: IgdbPlugin.icon,
                    plugin: this.id,
                    img: base_option.img
                },
                cover: (!!game_cover.url) ? game_cover.url.replace("t_thumb", "t_original") : "",
                link: game.url,
                storyline: game.storyline,
                summary: game.summary,
                screenshots: game_screenshots.map(ss => {
                    return {
                        thumbnail: (!!ss.url) ? ss.url : "",
                        fullsize: (!!ss.url) ? ss.url.replace("t_thumb", "t_original") : ""
                    }
                })
            })

        }

        return details;
    }

    /**
     * Create postgresql query to retrieve a specific option associated to a strawpoll
     * @param {number} poll_id 
     * @param {base_option<{id: number,img?:string;icon?:string}>} retrieval_data 
     */
    optionQuery(poll_id, retrieval_data) {
        const query_object = `{"base_option": {"id":${retrieval_data.id}, "plugin":"${this.id}"}}`;
        return {
            text: `select j.options from (select options from brasspoll_polls WHERE poll_id = $1) as t
            join lateral ( select jsonb_agg(e.x) as options from jsonb_array_elements(t.options) as e(x) where e.x @> $2  ) as j on true`,
            values: [poll_id, query_object]
        };
    }

}

exports.IgdbPlugin = IgdbPlugin;