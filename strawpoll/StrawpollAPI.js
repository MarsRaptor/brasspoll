"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = require("https");
class StrawpollAPI {
    static get(id) {
        return new Promise((resolve, reject) => {
            https_1.get(`https://www.strawpoll.me/api/v2/polls/${id}`, (response) => {
                let data = '';
                // A chunk of data has been recieved.
                response.on('data', (chunk) => {
                    data += chunk;
                });
                response.on('end', () => {
                    if (data !== '') {
                        try {
                            let json = JSON.parse(data);
                            if (!!json) {
                                resolve(json);
                            }
                            else {
                                let err = Error("Error in response from strawpoll API");
                                console.error(err);
                                reject(err);
                            }
                        }
                        catch (error) {
                            console.log(data);
                            console.error(error);
                            reject(error);
                        }
                    }
                });
            }).on("error", (err) => {
                reject(err);
            }).end();
        });
    }
    static new(poll_request) {
        return new Promise((resolve, reject) => {
            const options = {
                host: `www.strawpoll.me`,
                method: 'POST',
                path: `/api/v2/polls`,
                headers: {
                    Origin: 'brasspoll.herokuapp.com',
                    Accept: "application/json",
                }
            };
            let req = https_1.request(options, (response) => {
                let data = '';
                // A chunk of data has been recieved.
                response.on('data', (chunk) => {
                    data += chunk;
                });
                response.on('end', () => {
                    if (data !== '') {
                        try {
                            let json = JSON.parse(data);
                            if (!!json) {
                                resolve(json);
                            }
                            else {
                                let err = Error("Error in response from strawpoll API");
                                console.error(err);
                                reject(err);
                            }
                        }
                        catch (error) {
                            console.error(error);
                            reject(error);
                        }
                    }
                });
            });
            req.on("error", (err) => {
                reject(err);
            });
            req.write(JSON.stringify(poll_request));
            req.end();
        });
    }
}
exports.default = StrawpollAPI;
