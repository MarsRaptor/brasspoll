"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = require("https");
const PluginConfiguration_1 = require("../../plugin/PluginConfiguration");
const pug_1 = require("pug");
class SteamPlugin {
    constructor() {
        this.id = "steam";
        ;
        this.label = "Steam store";
        this.details_template = pug_1.compileFile(`${__dirname}/template.pug`);
        this.configuration = new PluginConfiguration_1.Configuration();
        this.configuration.create("Enable: ", {
            type: "checkbox",
            checked: true,
            name: "enabled",
            value: "enabled"
        });
    }
    appendConfigurationToTemplate() {
        let file_obj_lines = [];
        file_obj_lines.push(["details", 0]);
        file_obj_lines.push([`summary= "${this.label}"`, 1]);
        let lines = this.configuration.toTemplate(this.id).split("\n");
        for (const line of lines) {
            file_obj_lines.push([line.replace('\r', ''), 1]);
        }
        return file_obj_lines;
    }
    search(search) {
        if (!this.configuration.isChecked("enabled")) {
            return new Promise((resolve, _) => { resolve([]); });
        }
        return new Promise((resolve, reject) => {
            const options = {
                hostname: `store.steampowered.com`,
                method: 'GET',
                path: `/search/suggest?term=${encodeURI(search)}&f=games&cc=FR&realm=1`,
                headers: {
                    Origin: 'brasspoll.herokuapp.com'
                }
            };
            https_1.request(options, (response) => {
                let data = '';
                // A chunk of data has been recieved.
                response.on('data', (chunk) => {
                    data += chunk;
                });
                // The whole response has been received. Print out the result.
                response.on('end', () => {
                    let results = [];
                    const regex = /data-ds-appid="(\d*)"[^\<]*<div class="match_name">([^"]*)<\/div>[^\<]*<div class="match_img"><img src="([^"]*)"><\/div>/gm;
                    let m;
                    while ((m = regex.exec(data)) !== null) {
                        // This is necessary to avoid infinite loops with zero-width matches
                        if (m.index === regex.lastIndex) {
                            regex.lastIndex++;
                        }
                        let s = m[3];
                        let n = s.indexOf('?');
                        s = s.substring(0, n != -1 ? n : s.length);
                        results.push({
                            icon: SteamPlugin.icon,
                            steam_appid: Number.parseInt(m[1]),
                            plugin: this.id,
                            label: m[2],
                            img: s,
                        });
                    }
                    resolve(results);
                });
            }).on("error", (err) => {
                reject(err);
            }).end();
        });
    }
    detailsUnique(retreival_data) {
        if (retreival_data.steam_appid === undefined || retreival_data.steam_appid === null) {
            return new Promise((_, reject) => { reject(new Error(`Invalid appId ${retreival_data.steam_appid}`)); });
        }
        return new Promise((resolve, reject) => {
            const options = {
                hostname: `store.steampowered.com`,
                method: 'GET',
                path: `/api/appdetails?appids=${retreival_data.steam_appid}`,
                headers: {
                    Origin: 'brasspoll.herokuapp.com'
                }
            };
            https_1.request(options, (response) => {
                let data = '';
                // A chunk of data has been recieved.
                response.on('data', (chunk) => {
                    data += chunk;
                });
                // The whole response has been received. Print out the result.
                response.on('end', () => {
                    let json = JSON.parse(data);
                    if (json) {
                        let result = json[`${retreival_data.steam_appid}`];
                        if (result.success) {
                            resolve({
                                icon: SteamPlugin.icon,
                                plugin: this.id,
                                steam_appid: retreival_data.steam_appid,
                                label: result.data.name,
                                img: retreival_data.img,
                                cover: result.data.header_image,
                                link: `https://store.steampowered.com/app/${retreival_data.steam_appid}/`,
                                storyline: result.data.about_the_game,
                                summary: result.data.short_description,
                                screenshots: result.data.screenshots.map(s => {
                                    return {
                                        thumbnail: s.path_thumbnail,
                                        fullsize: s.path_full
                                    };
                                })
                            });
                        }
                        else {
                            reject(new Error(`An error occured fetching results for id "${retreival_data.steam_appid}"`));
                        }
                    }
                    else {
                        reject(new Error(`App with id "${retreival_data.steam_appid}" does not exist`));
                    }
                });
            }).on("error", (err) => {
                reject(err);
            }).end();
        });
    }
    detailsMultiple(retreival_data) {
        if (retreival_data === undefined || retreival_data === null || retreival_data.length <= 0) {
            return new Promise((resolve, _) => { resolve([]); });
        }
        return Promise.all(retreival_data.map(d => this.detailsUnique(d)));
    }
    validate(retreival_data) {
        let ids_fixed = retreival_data.map(d => {
            return Object.assign(d, {
                steam_appid: (typeof d.steam_appid === "number") ? d.steam_appid : (typeof d.steam_appid === "string") ? parseInt(d.steam_appid) : NaN
            });
        });
        return ids_fixed.filter(d => d.steam_appid !== NaN);
    }
    detailsUniqueFromDB(retrieval_data, dbData) {
        let steam_appid = (typeof retrieval_data.steam_appid === "number") ? retrieval_data.steam_appid :
            (typeof retrieval_data.steam_appid === "string") ? parseInt(retrieval_data.steam_appid) :
                NaN;
        if (steam_appid === NaN) {
            return;
        }
        return this.validate(dbData).find(details => details.steam_appid === steam_appid);
    }
}
exports.SteamPlugin = SteamPlugin;
SteamPlugin.icon = "https://store.steampowered.com/favicon.ico";
