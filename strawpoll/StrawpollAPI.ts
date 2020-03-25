
import { request } from 'https';
export type dupcheck = "normal" | "permissive" | "disabled";
export type get_response = {
    id: number,
    title: string,
    multi: boolean,
    options: string[],
    votes: number[],
    dupcheck?: dupcheck,
    captcha?: boolean
}

export type new_request = {
    title: string,
    multi: boolean,
    options: string[],
    dupcheck?: dupcheck,
    captcha?: boolean
}

export type new_response = {
    id: number,
    title: string,
    multi: boolean,
    options: string[],
    dupcheck?: dupcheck,
    captcha?: boolean
}


export default class StrawpollAPI {
    static get(id: number): Promise<get_response> {

        return new Promise<get_response>((resolve, reject) => {
            const options = {
                hostname: `cors-anywhere.herokuapp.com`,
                method: 'GET',
                path: `/https://www.strawpoll.me/api/v2/polls/${id}`,
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
                    if (data !== '') {
                        let json = JSON.parse(data);
                        if (!!json) {
                            resolve(json)
                        } else {
                            let err = Error("Error in response from strawpoll API");
                            console.error(err);
                            reject(err);
                        }
                    }
                })

            }).on("error", (err) => {
                reject(err);
            }).end();
        })
    }

    static new(poll_request: new_request): Promise<new_response> {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: `cors-anywhere.herokuapp.com`,
                method: 'POST',
                path: `/https://www.strawpoll.me/api/v2/polls`,
                headers: {
                    Origin: 'http://localhost:3000',
                    Accept: "application/json",
                }
            };
            let req = request(options, (response) => {
                let data = '';

                // A chunk of data has been recieved.
                response.on('data', (chunk) => {
                    data += chunk;
                });
                response.on('end', () => {
                    if (data !== '') {
                        let json = JSON.parse(data);
                        if (!!json) {
                            resolve(json)
                        } else {
                            let err = Error("Error in response from strawpoll API");
                            console.error(err);
                            reject(err);
                        }
                    }
                })

            });
            req.on("error", (err) => {
                reject(err);
            });
            req.write(JSON.stringify(poll_request));
            req.end();
        });
    }
}