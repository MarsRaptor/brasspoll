// @ts-check
/// <reference path="../../@types/plugin_types.d.ts" />
const { request } = require('../../utils/HttpRequest.js');
const { compileFile } = require('pug');
const { safeParseJSON } = require('../../utils/JsonSafeParse.js');

/**
 * @class
 * @implements {BrasspollPlugin<{productSlug: string,img?: string;icon?:string},{cover:string;link:string;storyline:string,summary:string,screenshots:{thumbnail:string,fullsize:string}[]}>}
 */
class EpicStorePlugin {
    static icon = "https://static-assets-prod.epicgames.com/epic-store/static/favicon.ico";
    static search_graphql_query = "query searchStoreQuery($allowCountries: String, $category: String, $count: Int, $country: String!, $keywords: String, $locale: String, $namespace: String, $itemNs: String, $sortBy: String, $sortDir: String, $start: Int, $tag: String, $releaseDate: String, $priceRange: String, $freeGame: Boolean, $onSale: Boolean, $effectiveDate: String){ Catalog{ searchStore(allowCountries: $allowCountries, category: $category, count: $count, country: $country, keywords: $keywords, locale: $locale, namespace: $namespace, itemNs: $itemNs, sortBy: $sortBy, sortDir: $sortDir, releaseDate: $releaseDate, start: $start, tag: $tag, priceRange: $priceRange, freeGame: $freeGame, onSale: $onSale, effectiveDate: $effectiveDate){ elements { title keyImages { type url } productSlug } } } }";

    /** @type {string} */id;
    /** @type {string} */label;
    /** @type {(locals?: deep_t) => string} */details_template;

    constructor() {
        this.id = "epic_store";;
        this.label = "Epic store";
        this.details_template = compileFile(`${__dirname}/template.pug`);
    }
    /**
     * Search Steam Store for given prompt
     * @param {string} search 
     */
    async search(search) {

        const search_result = await request({
            hostname: `www.epicgames.com`,
            method: 'POST',
            path: `/graphql`,
            headers: {
                'content-type': 'application/json;charset=UTF-8'
            }
        },
            JSON.stringify({
                query: EpicStorePlugin.search_graphql_query,
                variables: {
                    "category": "games/edition/base|bundles/games|editors",
                    "count": 5,
                    "country": "US",
                    "keywords": search,
                    "locale": "en-US",
                    "sortBy": "releaseDate",
                    "sortDir": "DESC",
                    "allowCountries": "US",
                    "start": 0,
                    "tag": "",
                    "releaseDate": `[,${new Date().toISOString()}]`
                }
            })
        );
        if (typeof search_result !== "string") {
            throw "Error parsing response";
        }

        /** @type {string | {data:{Catalog:{searchStore:{elements:{title:string,keyImages:{type:string,url:string}[],productSlug:string}[]}}}}} */
        const epic_results = safeParseJSON(search_result);
        if (typeof epic_results === "string") {
            throw epic_results;
        } else if (!!!epic_results.data || !!!epic_results.data.Catalog || !!!epic_results.data.Catalog.searchStore || !!!epic_results.data.Catalog.searchStore.elements) {
            return [];
        }

        return epic_results.data.Catalog.searchStore.elements.map(e => {
            return {
                base_option: {
                    icon: EpicStorePlugin.icon,
                    label: e.title,
                    img: "",
                    plugin: this.id,
                    productSlug: e.productSlug.split("/")[0]
                }
            }
        });
    }

    /**
     * Sanitize input data for database operations, filter out duds
     * @param {base_option<{ productSlug: string; img?: string; icon?: string; }>[]} retreival_data 
     * @returns {base_option<{ productSlug: string; img?: string; icon?: string; }>[]} sanitized data 
     */
    sanitize(retreival_data) {
        let ids_fixed = retreival_data.map(d => {
            return Object.assign(d, {
                productSlug: (typeof d.productSlug === "string" && d.productSlug.trim() != "") ? d.productSlug.split("/")[0] : ""
            });
        })
        return ids_fixed.filter(d => d.productSlug != "");
    }

    /**
     * Fetch single option details from the Epic Store
     * @param {base_option<{productSlug: string,img?:string;icon?:string}>} retreival_data 
     * @returns {Promise<full_option<{productSlug: string,img?:string;icon?:string},{cover:string;link:string;storyline:string,summary:string,screenshots:{thumbnail:string,fullsize:string}[]}>>}
     */
    async fetchDetailsSingle(retreival_data) {

        const response = await request({
            hostname: `store-content.ak.epicgames.com`,
            method: 'GET',
            path: `/api/en-US/content/products/${retreival_data.productSlug}`,
            headers: {
                Origin: 'brasspoll.herokuapp.com'
            }
        });
        if (typeof response !== "string") {
            throw "Error parsing response"
        }

        /** @type {string | {productName:string,_slug:string,pages:{productName:string,data:{about:{image:{src?:string},description?:string,shortDescription?:string},carousel:{items:{image:{src?:string}}[]},gallery:{galleryImages:{src?:string}[]}}}[]}} */
        const parsed = safeParseJSON(response);
        if (typeof parsed === "string" || parsed.pages.length < 1) {
            throw "Error parsing response";
        }

        const page = parsed.pages.find(p => p.productName == parsed.productName);
        if (!!!page) {
            throw "Error parsing response";
        }

        /** @type {{thumbnail:string,fullsize:string}[]} */
        const screenshots = [];
        for (const img of page.data.carousel.items) {
            if (img.image.src) {
                screenshots.push({
                    thumbnail: img.image.src,
                    fullsize: img.image.src
                })
            }
        }
        for (const img of page.data.gallery.galleryImages) {
            if (img.src) {
                screenshots.push({
                    thumbnail: img.src,
                    fullsize: img.src
                })
            }
        }

        return {
            base_option: {
                label: parsed.productName,
                productSlug: parsed._slug,
                icon: EpicStorePlugin.icon,
                plugin: this.id,
                //img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${retreival_data.steam_appid}/capsule_sm_120.jpg`
            },
            cover: page.data.about.image.src,
            link: `https://www.epicgames.com/store/en-US/product/${parsed._slug}/home`,
            storyline: page.data.about.description,
            summary: page.data.about.shortDescription,
            screenshots: screenshots
        }
    }

    /**
     * Fetch multiple option details from the Epic Store
     * @param {base_option<{productSlug: string,img?:string;icon?:string}>[]} retreival_data 
     * @returns {Promise<full_option<{productSlug: string,img?:string;icon?:string},{cover:string;link:string;storyline:string,summary:string,screenshots:{thumbnail:string,fullsize:string}[]}>[]>}
     */
    async fetchDetails(retreival_data) {
        if (retreival_data === undefined || retreival_data === null || retreival_data.length <= 0) {
            return new Promise((resolve, _) => { resolve([]) });
        }
        return Promise.all(retreival_data.map(d => this.fetchDetailsSingle(d)));
    }

    /**
     * Create postgresql query to retrieve a specific option associated to a strawpoll
     * @param {number} poll_id 
     * @param {base_option<{ productSlug: string; img?: string; icon?: string; }>} retrieval_data 
     */
    optionQuery(poll_id, retrieval_data) {
        const query_object = `{"base_option": {"productSlug":"${retrieval_data.productSlug.split("/")[0]}", "plugin":"${this.id}"}}`;
        return {
            text: `select j.options from (select options from brasspoll_polls WHERE poll_id = $1) as t
            join lateral ( select jsonb_agg(e.x) as options from jsonb_array_elements(t.options) as e(x) where e.x @> $2  ) as j on true`,
            values: [poll_id, query_object]
        };
    }


}

exports.EpicStorePlugin = EpicStorePlugin;