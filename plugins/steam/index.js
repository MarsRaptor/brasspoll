"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var https_1 = require("https");
var PluginConfiguration_1 = require("../../plugin/PluginConfiguration");
var pug_1 = require("pug");
var SteamPlugin = /** @class */ (function () {
    function SteamPlugin() {
        this.id = "steam";
        ;
        this.label = "Steam store";
        this.details_template = pug_1.compileFile(__dirname + "/template.pug");
        this.configuration = new PluginConfiguration_1.Configuration();
        this.configuration.create("Enable: ", {
            type: "checkbox",
            checked: true,
            name: "enabled",
            value: "enabled"
        });
    }
    SteamPlugin.prototype.appendConfigurationToTemplate = function () {
        var file_obj_lines = [];
        file_obj_lines.push(["details", 0]);
        file_obj_lines.push(["summary= \"" + this.label + "\"", 1]);
        var lines = this.configuration.toTemplate(this.id).split("\n");
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var line = lines_1[_i];
            file_obj_lines.push([line.replace('\r', ''), 1]);
        }
        return file_obj_lines;
    };
    SteamPlugin.prototype.search = function (search) {
        var _this = this;
        if (!this.configuration.isChecked("enabled")) {
            return new Promise(function (resolve, _) { resolve([]); });
        }
        return new Promise(function (resolve, reject) {
            var options = {
                hostname: "cors-anywhere.herokuapp.com",
                method: 'GET',
                path: "/https://store.steampowered.com/search/suggest?term=" + encodeURI(search) + "&f=games&cc=FR&realm=1",
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
                // The whole response has been received. Print out the result.
                response.on('end', function () {
                    var results = [];
                    var regex = /data-ds-appid="(\d*)"[^\<]*<div class="match_name">([^"]*)<\/div>[^\<]*<div class="match_img"><img src="([^"]*)"><\/div>/gm;
                    var m;
                    while ((m = regex.exec(data)) !== null) {
                        // This is necessary to avoid infinite loops with zero-width matches
                        if (m.index === regex.lastIndex) {
                            regex.lastIndex++;
                        }
                        var s = m[3];
                        var n = s.indexOf('?');
                        s = s.substring(0, n != -1 ? n : s.length);
                        results.push({
                            icon: SteamPlugin.icon,
                            steam_appid: Number.parseInt(m[1]),
                            plugin: _this.id,
                            label: m[2],
                            img: s,
                        });
                    }
                    resolve(results);
                });
            }).on("error", function (err) {
                reject(err);
            }).end();
        });
    };
    SteamPlugin.prototype.detailsUnique = function (retreival_data) {
        var _this = this;
        if (retreival_data.steam_appid === undefined || retreival_data.steam_appid === null) {
            return new Promise(function (_, reject) { reject(new Error("Invalid appId " + retreival_data.steam_appid)); });
        }
        return new Promise(function (resolve, reject) {
            var options = {
                hostname: "cors-anywhere.herokuapp.com",
                method: 'GET',
                path: "/https://store.steampowered.com/api/appdetails?appids=" + retreival_data.steam_appid,
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
                // The whole response has been received. Print out the result.
                response.on('end', function () {
                    var json = JSON.parse(data);
                    if (json) {
                        var result = json["" + retreival_data.steam_appid];
                        if (result.success) {
                            resolve({
                                icon: SteamPlugin.icon,
                                plugin: _this.id,
                                steam_appid: retreival_data.steam_appid,
                                label: result.data.name,
                                img: retreival_data.img,
                                cover: result.data.header_image,
                                link: "https://store.steampowered.com/app/" + retreival_data.steam_appid + "/",
                                storyline: result.data.about_the_game,
                                summary: result.data.short_description,
                                screenshots: result.data.screenshots.map(function (s) {
                                    return {
                                        thumbnail: s.path_thumbnail,
                                        fullsize: s.path_full
                                    };
                                })
                            });
                        }
                        else {
                            reject(new Error("An error occured fetching results for id \"" + retreival_data.steam_appid + "\""));
                        }
                    }
                    else {
                        reject(new Error("App with id \"" + retreival_data.steam_appid + "\" does not exist"));
                    }
                });
            }).on("error", function (err) {
                reject(err);
            }).end();
        });
    };
    SteamPlugin.prototype.detailsMultiple = function (retreival_data) {
        var _this = this;
        if (retreival_data === undefined || retreival_data === null || retreival_data.length <= 0) {
            return new Promise(function (resolve, _) { resolve([]); });
        }
        return Promise.all(retreival_data.map(function (d) { return _this.detailsUnique(d); }));
    };
    SteamPlugin.prototype.validate = function (retreival_data) {
        var ids_fixed = retreival_data.map(function (d) {
            return Object.assign(d, {
                steam_appid: (typeof d.steam_appid === "number") ? d.steam_appid : (typeof d.steam_appid === "string") ? parseInt(d.steam_appid) : NaN
            });
        });
        return ids_fixed.filter(function (d) { return d.steam_appid !== NaN; });
    };
    SteamPlugin.prototype.detailsUniqueFromDB = function (retrieval_data, dbData) {
        var steam_appid = (typeof retrieval_data.steam_appid === "number") ? retrieval_data.steam_appid :
            (typeof retrieval_data.steam_appid === "string") ? parseInt(retrieval_data.steam_appid) :
                NaN;
        if (steam_appid === NaN) {
            return;
        }
        return this.validate(dbData).find(function (details) { return details.steam_appid === steam_appid; });
    };
    SteamPlugin.icon = "https://store.steampowered.com/favicon.ico";
    return SteamPlugin;
}());
exports.SteamPlugin = SteamPlugin;
