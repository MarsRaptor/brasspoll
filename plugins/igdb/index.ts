
import { request } from 'https';
import { Configuration } from '../../plugin/PluginConfiguration';
import { compileFile as compileTemplate } from 'pug'
import { deep_t, Plugin, search_result_t, details_t, retrieval_data_t } from '../../plugin/Plugin';

type igdb_retrieval_data_t = {
    id: number
};

type igdb_details_t = {
    cover: string;
    link: string;
    storyline: string,
    summary: string,
    screenshots: {
        thumbnail: string,
        fullsize: string
    }[]
};

export type igdb_app_details_t = {
    id: number,
    cover: number,
    name: string,
    screenshots: number[],
    storyline: string,
    summary: string,
    url: string
}[];

export class IgdbPlugin implements Plugin<igdb_retrieval_data_t, igdb_details_t>{

    static icon = "https://www.igdb.com/favicon.ico";
    id: string;
    label: string;
    configuration: Configuration;
    details_template: (locals?: deep_t) => string

    constructor() {
        this.id = "igdb";;
        this.label = "Internet Game Database";
        this.details_template = compileTemplate(`${__dirname}/template.pug`);
        this.configuration = new Configuration();
        this.configuration.create("Enable: ", {
            type: "checkbox",
            checked: true,
            name: "enabled",
            value: "enabled"
        })
    }


    appendConfigurationToTemplate(): [string, number][] {
        let file_obj_lines: [string, number][] = []
        file_obj_lines.push(["details", 0]);
        file_obj_lines.push([`summary= "${this.label}"`, 1]);
        let lines = this.configuration.toTemplate(this.id).split("\n");
        for (const line of lines) {
            file_obj_lines.push([line.replace('\r', ''), 1]);
        }
        return file_obj_lines;
    }

    search(search: string): Promise<search_result_t<igdb_retrieval_data_t>[]> {
        if (!this.configuration.isChecked("enabled")) {
            return new Promise((resolve, _) => { resolve([]) });
        }
        return new Promise<search_result_t<igdb_retrieval_data_t>[]>((resolve, reject) => {
            const options = {
                hostname: `cors-anywhere.herokuapp.com`,
                method: 'GET',
                path: `/https://www.igdb.com/search_autocomplete_all?q=${encodeURI(search)}`,
                headers: {
                    Origin: 'http://localhost:3000'
                }
            };

            request(options, (response) => {
                let data = '';

                // A chunk of data has been recieved.
                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {

                    var json: { game_suggest: { "id": number, "score": number, "name": string, "value": string, "url": string, "cloudinary": string }[] } = JSON.parse(data);
                    if (!!json && !!json.game_suggest && json.game_suggest.length > 0) {
                        resolve(json.game_suggest.map((suggestion => {
                            return {
                                icon: IgdbPlugin.icon,
                                id: suggestion.id,
                                plugin: this.id,
                                label: suggestion.name,
                                img: (!!suggestion.cloudinary) ? `https://images.igdb.com/igdb/image/upload/t_thumb/${suggestion.cloudinary}.jpg` : "",
                            }
                        })));
                    } else {
                        resolve([]);
                    }

                })

            }).on("error", (err) => {
                reject(err);
            }).end()

        });

    }

    async getScreenshots(screenshotIds: number[]) {
        return new Promise<{ id: number; thumbnail: string, fullsize: string }[]>((resolve, reject) => {
            if (screenshotIds === undefined || screenshotIds.length <= 0) {
                resolve([]);
                return;
            }
            const options = {
                hostname: `cors-anywhere.herokuapp.com`,
                method: 'POST',
                path: `/https://api-v3.igdb.com/screenshots`,
                headers: {
                    Origin: 'http://localhost:3000',
                    Accept: "application/json",
                    "user-key": "898fea50dfb2215756a0173eb91d073f"
                },
            };

            let req = request(options, (response) => {
                let data = '';

                // A chunk of data has been recieved.
                response.on('data', (chunk) => {
                    data += chunk;
                });

                // The whole response has been received. Print out the result.
                response.on('end', () => {

                    var json: { id: number, url: string }[] = JSON.parse(data);
                    if (json && json.length > 0) {
                        resolve(json.map(screenshot => {
                            return {
                                id: screenshot.id,
                                thumbnail: (!!screenshot.url) ? screenshot.url : "",
                                fullsize: (!!screenshot.url) ? screenshot.url.replace("t_thumb", "t_original") : ""
                            }
                        }));
                    } else {
                        resolve([]);
                    }


                });

            }).on("error", (err) => {
                reject(err);
            });
            req.write(`fields url; where id=(${screenshotIds.join(",")});`);
            req.end()
        });
    }

    async  getCovers(coverIds: number[]) {
        return new Promise<{ id: number, thumbnail: string, fullsize: string }[]>((resolve, reject) => {
            const options = {
                hostname: `cors-anywhere.herokuapp.com`,
                method: 'POST',
                path: `/https://api-v3.igdb.com/covers`,
                headers: {
                    Origin: 'http://localhost:3000',
                    Accept: "application/json",
                    "user-key": "898fea50dfb2215756a0173eb91d073f"
                }
            };

            if (coverIds === undefined || coverIds.length <= 0) {
                resolve([]);
                return;
            }

            let req = request(options, (response) => {
                let data = '';

                // A chunk of data has been recieved.
                response.on('data', (chunk) => {
                    data += chunk;
                });

                // The whole response has been received. Print out the result.
                response.on('end', () => {
                    var json: { id: number, url: string }[] = JSON.parse(data);
                    if (json && json.length > 0) {

                        resolve(json.map(cover => {
                            return {
                                id: cover.id,
                                thumbnail: (!!cover.url) ? cover.url : "",
                                fullsize: (!!cover.url) ? cover.url.replace("t_thumb", "t_original") : ""
                            }
                        }));

                    } else {
                        resolve([]);
                    }

                });

            }).on("error", (err) => {
                reject(err);
            });
            req.write(`fields url; where id=(${coverIds.join(",")});`);
            req.end()
        });
    }

    populateCovers(games: {
        id: number,
        cover: number | string,
        img?: string,
        name: string,
        screenshots: number[] | { thumbnail: string, fullsize: string }[],
        storyline: string,
        summary: string,
        url: string
    }[]): Promise<{
        id: number,
        cover: string,
        img?: string,
        name: string,
        screenshots: number[] | { thumbnail: string, fullsize: string }[],
        storyline: string,
        summary: string,
        url: string
    }[]> {
        return new Promise((resolve, reject) => {
            this.getCovers(games.map(g => g.cover as number))
                .then(covers => {
                    resolve(
                        games.map(game => {
                            return {
                                id: game.id,
                                img: game.img,
                                cover: covers.find(c => c.id === game.cover)?.fullsize || "",
                                name: game.name,
                                screenshots: game.screenshots,
                                storyline: game.storyline,
                                summary: game.summary,
                                url: game.url
                            }
                        })
                    )

                })
                .catch(err => reject(err))
        })
    }

    populateScreenShots(games: {
        id: number,
        cover: number | string,
        img?: string,
        name: string,
        screenshots: number[] | { thumbnail: string, fullsize: string }[],
        storyline: string,
        summary: string,
        url: string
    }[]): Promise<{
        id: number,
        cover: number | string,
        img?: string,
        name: string,
        screenshots: { thumbnail: string, fullsize: string }[],
        storyline: string,
        summary: string,
        url: string
    }[]> {
        return new Promise((resolve, reject) => {
            this.getScreenshots(games.map(g => g.screenshots as number[]).reduce((reduced, screenshotId) => {
                reduced.push(...screenshotId);
                return reduced;
            }, []))
                .then(screenshots => {
                    resolve(
                        games.map(game => {
                            return {
                                id: game.id,
                                img: game.img,
                                cover: game.cover,
                                name: game.name,
                                screenshots: screenshots.filter(s => ((game.screenshots || []) as number[]).includes(s.id)),
                                storyline: game.storyline,
                                summary: game.summary,
                                url: game.url
                            }
                        })
                    )
                })
                .catch(err => reject(err))
        })
    }

    detailsUnique(retreival_data: search_result_t<igdb_retrieval_data_t>): Promise<details_t<igdb_retrieval_data_t, igdb_details_t>> {
        if (retreival_data.id === undefined || retreival_data.id === null) {
            return new Promise((_, reject) => { reject(new Error(`Invalid appId ${retreival_data.id}`)) });
        }

        return new Promise((resolve, reject) => {
            const options = {
                hostname: `cors-anywhere.herokuapp.com`,
                method: 'POST',
                path: `/https://api-v3.igdb.com/games`,
                headers: {
                    Origin: 'http://localhost:3000',
                    Accept: "application/json",
                    "user-key": "898fea50dfb2215756a0173eb91d073f"
                }
            };

            let req = request(options, (response) => {
                let data = '';

                // A chunk of data has been recieved.
                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {
                    let json: igdb_app_details_t = JSON.parse(data);
                    if (json && json.length > 0) {
                        this.populateCovers([json[0]])
                            .then(coverPopulated => {
                                this.populateScreenShots(coverPopulated)
                                    .then(screenshotPopulated => {
                                        resolve(
                                            {
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
                                            }
                                        )
                                    })
                                    .catch(err => reject(err))
                            })
                            .catch(err => reject(err))

                    } else {
                        reject(new Error(`Game with id "${retreival_data.id}" does not exist`));
                    }
                })
            }).on("error", (err) => {
                reject(err);
            })
            req.write(`fields cover,name,screenshots,storyline,summary,url; where id=${retreival_data.id};`);
            req.end()
        })
    }

    detailsMultiple(retreival_data: search_result_t<igdb_retrieval_data_t>[]): Promise<details_t<igdb_retrieval_data_t, igdb_details_t>[]> {
        if (retreival_data === undefined || retreival_data === null || retreival_data.length <= 0) {
            return new Promise((resolve, _) => { resolve([]) });
        }

        return new Promise((resolve, reject) => {
            const options = {
                hostname: `cors-anywhere.herokuapp.com`,
                method: 'POST',
                path: `/https://api-v3.igdb.com/games`,
                headers: {
                    Origin: 'http://localhost:3000',
                    Accept: "application/json",
                    "user-key": "898fea50dfb2215756a0173eb91d073f"
                }
            };

            let req = request(options, (response) => {
                let data = '';

                // A chunk of data has been recieved.
                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {
                    let json: igdb_app_details_t = JSON.parse(data);
                    if (json && json.length > 0) {

                        let populated = retreival_data.map(obj => {
                            let correspondingJson = json.find(j => j.id == obj.id);
                            return Object.assign(obj, correspondingJson)
                        }).filter(value => value !== undefined)

                        this.populateCovers(populated)
                            .then(coverPopulated => {
                                this.populateScreenShots(coverPopulated)
                                    .then(screenshotPopulated => {
                                        let fullPopulated = screenshotPopulated as {
                                            id: number,
                                            img?: string,
                                            cover: string,
                                            name: string,
                                            screenshots: { thumbnail: string, fullsize: string }[],
                                            storyline: string,
                                            summary: string,
                                            url: string
                                        }[]

                                        resolve(
                                            fullPopulated.map(final => {
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
                                                }
                                            })
                                        )
                                    })
                                    .catch(err => reject(err))
                            })
                            .catch(err => reject(err))

                    } else {
                        reject(new Error(`Game with id "${retreival_data.map(d => d.id)}" does not exist`));
                    }
                })
            }).on("error", (err) => {
                reject(err);
            })
            req.write(`fields cover,name,screenshots,storyline,summary,url; where id=(${retreival_data.map(d => d.id)});`);
            req.end()
        })
    }
    validate(retreival_data: search_result_t<igdb_retrieval_data_t>[]): search_result_t<igdb_retrieval_data_t>[] {
        let ids_fixed = retreival_data.map(d => {
            return Object.assign(d, {
                id: (typeof d.id === "number") ? d.id : (typeof d.id === "string") ? parseInt(d.id) : NaN
            });
        })
        return ids_fixed.filter(d => d.id !== NaN)
    }

   
    detailsUniqueFromDB(retrieval_data: retrieval_data_t<igdb_retrieval_data_t>, dbData: search_result_t<igdb_retrieval_data_t>[]): details_t<igdb_retrieval_data_t, igdb_details_t> | undefined {
        let id =
            (typeof retrieval_data.id === "number") ? retrieval_data.id :
                (typeof retrieval_data.id === "string") ? parseInt(retrieval_data.id) :
                    NaN
        if (id===NaN) {
            return;
        }
        return this.validate(dbData).find(details => details.id === id) as details_t<igdb_retrieval_data_t, igdb_details_t> | undefined;
    }
}
