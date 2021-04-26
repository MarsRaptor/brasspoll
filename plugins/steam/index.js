// @ts-check
/// <reference path="../../@types/plugin_types.d.ts" />
const { request } = require('../../utils/HttpRequest.js');
const { compileFile } = require('pug');
const { safeParseJSON } = require('../../utils/JsonSafeParse.js');
const parse5 = require("parse5");

/**
 * @class
 * @implements {BrasspollPlugin<{steam_appid: number,img?: string;icon?:string},{cover:string;link:string;storyline:string,summary:string,screenshots:{thumbnail:string,fullsize:string}[]}>}
 */
class SteamPlugin {
    static icon = "https://store.steampowered.com/favicon.ico";

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

        const parsed_result = parse5.parseFragment(search_result_html);
        for (let link_index = 0; link_index < parsed_result.childNodes.length; link_index++) {
            /** @type {parse5.Element} */
            const link = (parsed_result.childNodes[link_index]);
            if (link.tagName == "a") {

                let steam_appid = "";
                let label = "";
                let img_src = "";

                for (let link_attr_index = 0; link_attr_index < link.attrs.length; link_attr_index++) {
                    const link_attr = link.attrs[link_attr_index];
                    if (link_attr.name == "data-ds-appid") {
                        steam_appid = link_attr.value;
                        break;
                    }
                }

                for (let link_child_index = 0; link_child_index < link.childNodes.length; link_child_index++) {

                    const link_child = (/** @type {parse5.Element} */(link.childNodes[link_child_index]));
                    if (link_child.nodeName == "div") {

                        for (let link_child_attr_index = 0; link_child_attr_index < link_child.attrs.length; link_child_attr_index++) {
                            const link_child_attr = link_child.attrs[link_child_attr_index];
                            if (link_child_attr.name == "class") {

                                if (link_child_attr.value.includes("match_name")) {

                                    for (let name_index = 0; name_index < link_child.childNodes.length; name_index++) {
                                        const name_node = (/** @type {parse5.TextNode} */(link_child.childNodes[name_index]));
                                        if (name_node.nodeName == "#text") {
                                            label = name_node.value;
                                            break;
                                        }

                                    }

                                } else if (link_child_attr.value.includes("match_img")) {
                                    for (let link_grandchild_index = 0; link_grandchild_index < link_child.childNodes.length; link_grandchild_index++) {
                                        const link_grandchild = (/** @type {parse5.Element} */(link_child.childNodes[link_grandchild_index]));
                                        if (link_grandchild.nodeName == "img") {
                                            for (let img_attr_index = 0; img_attr_index < link_grandchild.attrs.length; img_attr_index++) {
                                                const img_attr = link_grandchild.attrs[img_attr_index];
                                                if (img_attr.name = "src") {
                                                    img_src = img_attr.value;
                                                    const n = img_src.indexOf('?');
                                                    img_src = img_src.substring(0, n != -1 ? n : img_src.length);
                                                    break;
                                                }
                                            }
                                            break;
                                        }

                                    }
                                }

                            }

                        }

                    }
                }

                search_results.push(
                    {
                        base_option: {
                            icon: SteamPlugin.icon,
                            steam_appid: Number.parseInt(steam_appid),
                            label: label,
                            img: img_src,
                            plugin: this.id
                        }
                    }
                );

            }

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
     * @param {boolean} optimize
     * @returns {Promise<full_option<{steam_appid: number,img?:string;icon?:string},{cover:string;link:string;storyline:string,summary:string,screenshots:{thumbnail:string,fullsize:string}[]}>>}
     */
    async fetchDetailsSingle(retreival_data, optimize) {

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

        let storyline = details.about_the_game;

        if (optimize) {
            const parsed_storyline = parse5.parseFragment(storyline);

            /**
             * @param {parse5.Node} node
             */
            async function clean_nodes(node) {

                if (node.nodeName == "img") {

                    for (let node_attr_index = 0; node_attr_index < node.attrs.length; node_attr_index++) {
                        const node_attr = node.attrs[node_attr_index];
                        if (node_attr.name == "src") {
                            let img_src = node_attr.value;
                            const n = img_src.indexOf('?');
                            img_src = img_src.substring(0, n != -1 ? n : img_src.length);
                            node_attr.value = img_src;

                            if (node_attr.value.endsWith(".gif")) {
                                await request(`https://res.cloudinary.com/demo/image/fetch/f_webm/${node_attr.value}`);
                                node_attr.value = `https://res.cloudinary.com/demo/image/fetch/f_webm/${node_attr.value}`;
                                node.nodeName = "video";
                                node.tagName = "video";
                                node.attrs.push({ name: "loop", value: "true" });
                                node.attrs.push({ name: "controls", value: "true" });

                            } else {
                                node.attrs.push({name:"is",value:"lazy-img"});
                                node.attrs.push({name:"data-src",value:node_attr.value});
                                node_attr.value = "";
                            }
                        }
                    }

                }

                // @ts-ignore
                if (node.childNodes) {
                    // @ts-ignore
                    for (let child_index = 0; child_index < node.childNodes.length; child_index++) {
                        // @ts-ignore
                        await clean_nodes(node.childNodes[child_index]);
                    }

                }

            }
            await clean_nodes(parsed_storyline);
            storyline = parse5.serialize(parsed_storyline);
        }



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
            storyline: storyline,
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
     * @param {boolean} optimize
     * @returns {Promise<full_option<{steam_appid: number,img?:string;icon?:string},{cover:string;link:string;storyline:string,summary:string,screenshots:{thumbnail:string,fullsize:string}[]}>[]>}
     */
    fetchDetails(retreival_data, optimize) {
        if (retreival_data === undefined || retreival_data === null || retreival_data.length <= 0) {
            return new Promise((resolve, _) => { resolve([]) });
        }
        return Promise.all(retreival_data.map(d => this.fetchDetailsSingle(d, optimize)));
    }
}

exports.SteamPlugin = SteamPlugin;