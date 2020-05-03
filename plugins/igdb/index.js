"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = require("https");
const PluginConfiguration_1 = require("../../plugin/PluginConfiguration");
const pug_1 = require("pug");
class IgdbPlugin {
    constructor() {
        this.id = "igdb";
        ;
        this.label = "Internet Game Database";
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
                hostname: `www.igdb.com`,
                method: 'GET',
                path: `/search_autocomplete_all?q=${encodeURI(search)}`,
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
                response.on('end', () => {
                    var json = JSON.parse(data);
                    if (!!json && !!json.game_suggest && json.game_suggest.length > 0) {
                        resolve(json.game_suggest.map((suggestion => {
                            return {
                                icon: IgdbPlugin.icon,
                                id: suggestion.id,
                                plugin: this.id,
                                label: suggestion.name,
                                img: (!!suggestion.cloudinary) ? `https://images.igdb.com/igdb/image/upload/t_thumb/${suggestion.cloudinary}.jpg` : "",
                            };
                        })));
                    }
                    else {
                        resolve([]);
                    }
                });
            }).on("error", (err) => {
                reject(err);
            }).end();
        });
    }
    async getScreenshots(screenshotIds) {
        return new Promise((resolve, reject) => {
            if (screenshotIds === undefined || screenshotIds.length <= 0) {
                resolve([]);
                return;
            }
            const options = {
                hostname: `api-v3.igdb.com`,
                method: 'POST',
                path: `/screenshots`,
                headers: {
                    Origin: 'brasspoll.herokuapp.com',
                    Accept: "application/json",
                    "user-key": process.env.IGDB_OPEN_KEY
                },
            };
            let req = https_1.request(options, (response) => {
                let data = '';
                // A chunk of data has been recieved.
                response.on('data', (chunk) => {
                    data += chunk;
                });
                // The whole response has been received. Print out the result.
                response.on('end', () => {
                    var json = JSON.parse(data);
                    if (json && json.length > 0) {
                        resolve(json.map(screenshot => {
                            return {
                                id: screenshot.id,
                                thumbnail: (!!screenshot.url) ? screenshot.url : "",
                                fullsize: (!!screenshot.url) ? screenshot.url.replace("t_thumb", "t_original") : ""
                            };
                        }));
                    }
                    else {
                        resolve([]);
                    }
                });
            }).on("error", (err) => {
                reject(err);
            });
            req.write(`fields url; where id=(${screenshotIds.join(",")});`);
            req.end();
        });
    }
    async getCovers(coverIds) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: `api-v3.igdb.com`,
                method: 'POST',
                path: `/covers`,
                headers: {
                    Origin: 'brasspoll.herokuapp.com',
                    Accept: "application/json",
                    "user-key": process.env.IGDB_OPEN_KEY
                }
            };
            if (coverIds === undefined || coverIds.length <= 0) {
                resolve([]);
                return;
            }
            let req = https_1.request(options, (response) => {
                let data = '';
                // A chunk of data has been recieved.
                response.on('data', (chunk) => {
                    data += chunk;
                });
                // The whole response has been received. Print out the result.
                response.on('end', () => {
                    var json = JSON.parse(data);
                    if (json && json.length > 0) {
                        resolve(json.map(cover => {
                            return {
                                id: cover.id,
                                thumbnail: (!!cover.url) ? cover.url : "",
                                fullsize: (!!cover.url) ? cover.url.replace("t_thumb", "t_original") : ""
                            };
                        }));
                    }
                    else {
                        resolve([]);
                    }
                });
            }).on("error", (err) => {
                reject(err);
            });
            req.write(`fields url; where id=(${coverIds.join(",")});`);
            req.end();
        });
    }
    populateCovers(games) {
        return new Promise((resolve, reject) => {
            this.getCovers(games.map(g => g.cover))
                .then(covers => {
                resolve(games.map(game => {
                    var _a;
                    return {
                        id: game.id,
                        img: game.img,
                        cover: ((_a = covers.find(c => c.id === game.cover)) === null || _a === void 0 ? void 0 : _a.fullsize) || "",
                        name: game.name,
                        screenshots: game.screenshots,
                        storyline: game.storyline,
                        summary: game.summary,
                        url: game.url
                    };
                }));
            })
                .catch(err => reject(err));
        });
    }
    populateScreenShots(games) {
        return new Promise((resolve, reject) => {
            this.getScreenshots(games.map(g => g.screenshots).reduce((reduced, screenshotId) => {
                reduced.push(...screenshotId);
                return reduced;
            }, []))
                .then(screenshots => {
                resolve(games.map(game => {
                    return {
                        id: game.id,
                        img: game.img,
                        cover: game.cover,
                        name: game.name,
                        screenshots: screenshots.filter(s => (game.screenshots || []).includes(s.id)),
                        storyline: game.storyline,
                        summary: game.summary,
                        url: game.url
                    };
                }));
            })
                .catch(err => reject(err));
        });
    }
    detailsUnique(retreival_data) {
        if (retreival_data.id === undefined || retreival_data.id === null) {
            return new Promise((_, reject) => { reject(new Error(`Invalid appId ${retreival_data.id}`)); });
        }
        return new Promise((resolve, reject) => {
            const options = {
                hostname: `api-v3.igdb.com`,
                method: 'POST',
                path: `/games`,
                headers: {
                    Origin: 'brasspoll.herokuapp.com',
                    Accept: "application/json",
                    "user-key": process.env.IGDB_OPEN_KEY
                }
            };
            let req = https_1.request(options, (response) => {
                let data = '';
                // A chunk of data has been recieved.
                response.on('data', (chunk) => {
                    data += chunk;
                });
                response.on('end', () => {
                    let json = JSON.parse(data);
                    if (json && json.length > 0) {
                        this.populateCovers([json[0]])
                            .then(coverPopulated => {
                            this.populateScreenShots(coverPopulated)
                                .then(screenshotPopulated => {
                                resolve({
                                    id: retreival_data.id,
                                    plugin: this.id,
                                    icon: IgdbPlugin.icon,
                                    img: retreival_data.img,
                                    cover: coverPopulated[0].cover,
                                    label: json[0].name,
                                    link: json[0].url,
                                    screenshots: screenshotPopulated[0].screenshots,
                                    storyline: json[0].storyline,
                                    summary: json[0].summary
                                });
                            })
                                .catch(err => reject(err));
                        })
                            .catch(err => reject(err));
                    }
                    else {
                        reject(new Error(`Game with id "${retreival_data.id}" does not exist`));
                    }
                });
            }).on("error", (err) => {
                reject(err);
            });
            req.write(`fields cover,name,screenshots,storyline,summary,url; where id=${retreival_data.id};`);
            req.end();
        });
    }
    detailsMultiple(retreival_data) {
        if (retreival_data === undefined || retreival_data === null || retreival_data.length <= 0) {
            return new Promise((resolve, _) => { resolve([]); });
        }
        return new Promise((resolve, reject) => {
            const options = {
                hostname: `api-v3.igdb.com`,
                method: 'POST',
                path: `/games`,
                headers: {
                    Origin: 'brasspoll.herokuapp.com',
                    Accept: "application/json",
                    "user-key": process.env.IGDB_OPEN_KEY
                }
            };
            let req = https_1.request(options, (response) => {
                let data = '';
                // A chunk of data has been recieved.
                response.on('data', (chunk) => {
                    data += chunk;
                });
                response.on('end', () => {
                    let json = JSON.parse(data);
                    if (json && json.length > 0) {
                        let populated = retreival_data.map(obj => {
                            let correspondingJson = json.find(j => j.id == obj.id);
                            return Object.assign(obj, correspondingJson);
                        }).filter(value => value !== undefined);
                        this.populateCovers(populated)
                            .then(coverPopulated => {
                            this.populateScreenShots(coverPopulated)
                                .then(screenshotPopulated => {
                                let fullPopulated = screenshotPopulated;
                                resolve(fullPopulated.map(final => {
                                    return {
                                        id: final.id,
                                        plugin: this.id,
                                        icon: IgdbPlugin.icon,
                                        img: final.img,
                                        cover: final.cover,
                                        label: final.name,
                                        link: final.url,
                                        screenshots: final.screenshots,
                                        storyline: final.storyline,
                                        summary: final.summary
                                    };
                                }));
                            })
                                .catch(err => reject(err));
                        })
                            .catch(err => reject(err));
                    }
                    else {
                        reject(new Error(`Game with id "${retreival_data.map(d => d.id)}" does not exist`));
                    }
                });
            }).on("error", (err) => {
                reject(err);
            });
            req.write(`fields cover,name,screenshots,storyline,summary,url; where id=(${retreival_data.map(d => d.id)});`);
            req.end();
        });
    }
    validate(retreival_data) {
        let ids_fixed = retreival_data.map(d => {
            return Object.assign(d, {
                id: (typeof d.id === "number") ? d.id : (typeof d.id === "string") ? parseInt(d.id) : NaN
            });
        });
        return ids_fixed.filter(d => d.id !== NaN);
    }
    detailsUniqueFromDB(retrieval_data, dbData) {
        let id = (typeof retrieval_data.id === "number") ? retrieval_data.id :
            (typeof retrieval_data.id === "string") ? parseInt(retrieval_data.id) :
                NaN;
        if (id === NaN) {
            return;
        }
        return this.validate(dbData).find(details => details.id === id);
    }
}
exports.IgdbPlugin = IgdbPlugin;
IgdbPlugin.icon = "https://www.igdb.com/favicon.ico";
