"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var https_1 = require("https");
var PluginConfiguration_1 = require("../../plugin/PluginConfiguration");
var pug_1 = require("pug");
var IgdbPlugin = /** @class */ (function () {
    function IgdbPlugin() {
        this.id = "igdb";
        ;
        this.label = "Internet Game Database";
        this.details_template = pug_1.compileFile(__dirname + "/template.pug");
        this.configuration = new PluginConfiguration_1.Configuration();
        this.configuration.create("Enable: ", {
            type: "checkbox",
            checked: true,
            name: "enabled",
            value: "enabled"
        });
    }
    IgdbPlugin.prototype.appendConfigurationToTemplate = function () {
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
    IgdbPlugin.prototype.search = function (search) {
        var _this = this;
        if (!this.configuration.isChecked("enabled")) {
            return new Promise(function (resolve, _) { resolve([]); });
        }
        return new Promise(function (resolve, reject) {
            var options = {
                hostname: "igdb.com",
                method: 'GET',
                path: "/search_autocomplete_all?q=" + encodeURI(search),
                headers: {
                    Origin: 'brasspoll.herokuapp.com'
                }
            };
            https_1.request(options, function (response) {
                var data = '';
                // A chunk of data has been recieved.
                response.on('data', function (chunk) {
                    data += chunk;
                });
                response.on('end', function () {
                    var json = JSON.parse(data);
                    if (!!json && !!json.game_suggest && json.game_suggest.length > 0) {
                        resolve(json.game_suggest.map((function (suggestion) {
                            return {
                                icon: IgdbPlugin.icon,
                                id: suggestion.id,
                                plugin: _this.id,
                                label: suggestion.name,
                                img: (!!suggestion.cloudinary) ? "https://images.igdb.com/igdb/image/upload/t_thumb/" + suggestion.cloudinary + ".jpg" : "",
                            };
                        })));
                    }
                    else {
                        resolve([]);
                    }
                });
            }).on("error", function (err) {
                reject(err);
            }).end();
        });
    };
    IgdbPlugin.prototype.getScreenshots = function (screenshotIds) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        if (screenshotIds === undefined || screenshotIds.length <= 0) {
                            resolve([]);
                            return;
                        }
                        var options = {
                            hostname: "api-v3.igdb.com",
                            method: 'POST',
                            path: "/screenshots",
                            headers: {
                                Origin: 'brasspoll.herokuapp.com',
                                Accept: "application/json",
                                "user-key": "898fea50dfb2215756a0173eb91d073f"
                            },
                        };
                        var req = https_1.request(options, function (response) {
                            var data = '';
                            // A chunk of data has been recieved.
                            response.on('data', function (chunk) {
                                data += chunk;
                            });
                            // The whole response has been received. Print out the result.
                            response.on('end', function () {
                                var json = JSON.parse(data);
                                if (json && json.length > 0) {
                                    resolve(json.map(function (screenshot) {
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
                        }).on("error", function (err) {
                            reject(err);
                        });
                        req.write("fields url; where id=(" + screenshotIds.join(",") + ");");
                        req.end();
                    })];
            });
        });
    };
    IgdbPlugin.prototype.getCovers = function (coverIds) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var options = {
                            hostname: "api-v3.igdb.com",
                            method: 'POST',
                            path: "/covers",
                            headers: {
                                Origin: 'brasspoll.herokuapp.com',
                                Accept: "application/json",
                                "user-key": "898fea50dfb2215756a0173eb91d073f"
                            }
                        };
                        if (coverIds === undefined || coverIds.length <= 0) {
                            resolve([]);
                            return;
                        }
                        var req = https_1.request(options, function (response) {
                            var data = '';
                            // A chunk of data has been recieved.
                            response.on('data', function (chunk) {
                                data += chunk;
                            });
                            // The whole response has been received. Print out the result.
                            response.on('end', function () {
                                var json = JSON.parse(data);
                                if (json && json.length > 0) {
                                    resolve(json.map(function (cover) {
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
                        }).on("error", function (err) {
                            reject(err);
                        });
                        req.write("fields url; where id=(" + coverIds.join(",") + ");");
                        req.end();
                    })];
            });
        });
    };
    IgdbPlugin.prototype.populateCovers = function (games) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getCovers(games.map(function (g) { return g.cover; }))
                .then(function (covers) {
                resolve(games.map(function (game) {
                    var _a;
                    return {
                        id: game.id,
                        img: game.img,
                        cover: ((_a = covers.find(function (c) { return c.id === game.cover; })) === null || _a === void 0 ? void 0 : _a.fullsize) || "",
                        name: game.name,
                        screenshots: game.screenshots,
                        storyline: game.storyline,
                        summary: game.summary,
                        url: game.url
                    };
                }));
            })
                .catch(function (err) { return reject(err); });
        });
    };
    IgdbPlugin.prototype.populateScreenShots = function (games) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getScreenshots(games.map(function (g) { return g.screenshots; }).reduce(function (reduced, screenshotId) {
                reduced.push.apply(reduced, screenshotId);
                return reduced;
            }, []))
                .then(function (screenshots) {
                resolve(games.map(function (game) {
                    return {
                        id: game.id,
                        img: game.img,
                        cover: game.cover,
                        name: game.name,
                        screenshots: screenshots.filter(function (s) { return (game.screenshots || []).includes(s.id); }),
                        storyline: game.storyline,
                        summary: game.summary,
                        url: game.url
                    };
                }));
            })
                .catch(function (err) { return reject(err); });
        });
    };
    IgdbPlugin.prototype.detailsUnique = function (retreival_data) {
        var _this = this;
        if (retreival_data.id === undefined || retreival_data.id === null) {
            return new Promise(function (_, reject) { reject(new Error("Invalid appId " + retreival_data.id)); });
        }
        return new Promise(function (resolve, reject) {
            var options = {
                hostname: "api-v3.igdb.com",
                method: 'POST',
                path: "/games",
                headers: {
                    Origin: 'brasspoll.herokuapp.com',
                    Accept: "application/json",
                    "user-key": "898fea50dfb2215756a0173eb91d073f"
                }
            };
            var req = https_1.request(options, function (response) {
                var data = '';
                // A chunk of data has been recieved.
                response.on('data', function (chunk) {
                    data += chunk;
                });
                response.on('end', function () {
                    var json = JSON.parse(data);
                    if (json && json.length > 0) {
                        _this.populateCovers([json[0]])
                            .then(function (coverPopulated) {
                            _this.populateScreenShots(coverPopulated)
                                .then(function (screenshotPopulated) {
                                resolve({
                                    id: retreival_data.id,
                                    plugin: _this.id,
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
                                .catch(function (err) { return reject(err); });
                        })
                            .catch(function (err) { return reject(err); });
                    }
                    else {
                        reject(new Error("Game with id \"" + retreival_data.id + "\" does not exist"));
                    }
                });
            }).on("error", function (err) {
                reject(err);
            });
            req.write("fields cover,name,screenshots,storyline,summary,url; where id=" + retreival_data.id + ";");
            req.end();
        });
    };
    IgdbPlugin.prototype.detailsMultiple = function (retreival_data) {
        var _this = this;
        if (retreival_data === undefined || retreival_data === null || retreival_data.length <= 0) {
            return new Promise(function (resolve, _) { resolve([]); });
        }
        return new Promise(function (resolve, reject) {
            var options = {
                hostname: "api-v3.igdb.com",
                method: 'POST',
                path: "/games",
                headers: {
                    Origin: 'brasspoll.herokuapp.com',
                    Accept: "application/json",
                    "user-key": "898fea50dfb2215756a0173eb91d073f"
                }
            };
            var req = https_1.request(options, function (response) {
                var data = '';
                // A chunk of data has been recieved.
                response.on('data', function (chunk) {
                    data += chunk;
                });
                response.on('end', function () {
                    var json = JSON.parse(data);
                    if (json && json.length > 0) {
                        var populated = retreival_data.map(function (obj) {
                            var correspondingJson = json.find(function (j) { return j.id == obj.id; });
                            return Object.assign(obj, correspondingJson);
                        }).filter(function (value) { return value !== undefined; });
                        _this.populateCovers(populated)
                            .then(function (coverPopulated) {
                            _this.populateScreenShots(coverPopulated)
                                .then(function (screenshotPopulated) {
                                var fullPopulated = screenshotPopulated;
                                resolve(fullPopulated.map(function (final) {
                                    return {
                                        id: final.id,
                                        plugin: _this.id,
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
                                .catch(function (err) { return reject(err); });
                        })
                            .catch(function (err) { return reject(err); });
                    }
                    else {
                        reject(new Error("Game with id \"" + retreival_data.map(function (d) { return d.id; }) + "\" does not exist"));
                    }
                });
            }).on("error", function (err) {
                reject(err);
            });
            req.write("fields cover,name,screenshots,storyline,summary,url; where id=(" + retreival_data.map(function (d) { return d.id; }) + ");");
            req.end();
        });
    };
    IgdbPlugin.prototype.validate = function (retreival_data) {
        var ids_fixed = retreival_data.map(function (d) {
            return Object.assign(d, {
                id: (typeof d.id === "number") ? d.id : (typeof d.id === "string") ? parseInt(d.id) : NaN
            });
        });
        return ids_fixed.filter(function (d) { return d.id !== NaN; });
    };
    IgdbPlugin.prototype.detailsUniqueFromDB = function (retrieval_data, dbData) {
        var id = (typeof retrieval_data.id === "number") ? retrieval_data.id :
            (typeof retrieval_data.id === "string") ? parseInt(retrieval_data.id) :
                NaN;
        if (id === NaN) {
            return;
        }
        return this.validate(dbData).find(function (details) { return details.id === id; });
    };
    IgdbPlugin.icon = "https://www.igdb.com/favicon.ico";
    return IgdbPlugin;
}());
exports.IgdbPlugin = IgdbPlugin;
