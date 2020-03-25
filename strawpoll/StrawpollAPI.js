"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var https_1 = require("https");
var StrawpollAPI = /** @class */ (function () {
    function StrawpollAPI() {
    }
    StrawpollAPI.get = function (id) {
        return new Promise(function (resolve, reject) {
            var options = {
                hostname: "cors-anywhere.herokuapp.com",
                method: 'GET',
                path: "/https://www.strawpoll.me/api/v2/polls/" + id,
                headers: {
                    Origin: 'http://localhost:3000'
                }
            };
            https_1.request(options, function (response) {
                var data = '';
                // A chunk of data has been recieved.
                response.on('data', function (chunk) {
                    data += chunk;
                });
                response.on('end', function () {
                    if (data !== '') {
                        var json = JSON.parse(data);
                        if (!!json) {
                            resolve(json);
                        }
                        else {
                            var err = Error("Error in response from strawpoll API");
                            console.error(err);
                            reject(err);
                        }
                    }
                });
            }).on("error", function (err) {
                reject(err);
            }).end();
        });
    };
    StrawpollAPI.new = function (poll_request) {
        return new Promise(function (resolve, reject) {
            var options = {
                hostname: "cors-anywhere.herokuapp.com",
                method: 'POST',
                path: "/https://www.strawpoll.me/api/v2/polls",
                headers: {
                    Origin: 'http://localhost:3000',
                    Accept: "application/json",
                }
            };
            var req = https_1.request(options, function (response) {
                var data = '';
                // A chunk of data has been recieved.
                response.on('data', function (chunk) {
                    data += chunk;
                });
                response.on('end', function () {
                    if (data !== '') {
                        var json = JSON.parse(data);
                        if (!!json) {
                            resolve(json);
                        }
                        else {
                            var err = Error("Error in response from strawpoll API");
                            console.error(err);
                            reject(err);
                        }
                    }
                });
            });
            req.on("error", function (err) {
                reject(err);
            });
            req.write(JSON.stringify(poll_request));
            req.end();
        });
    };
    return StrawpollAPI;
}());
exports.default = StrawpollAPI;
