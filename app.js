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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var http_1 = __importDefault(require("http"));
var socket_io_1 = __importDefault(require("socket.io"));
var pug_1 = require("pug");
var steam_1 = require("./plugins/steam");
var Plugin_1 = require("./plugin/Plugin");
var igdb_1 = require("./plugins/igdb");
var mongodb_1 = require("mongodb");
var StrawpollAPI_1 = __importDefault(require("./strawpoll/StrawpollAPI"));
require('dotenv').config();
Plugin_1.plugin_manager.addPlugin(new steam_1.SteamPlugin());
Plugin_1.plugin_manager.addPlugin(new igdb_1.IgdbPlugin());
var app = express_1.default();
app.use(express_1.default.json());
app.use(express_1.default.static('public'));
app.use('/lib/socket.io/', express_1.default.static('./node_modules/socket.io-client/dist/'));
app.set('views', './views'); // specify the views directory
app.set('view engine', 'pug'); // register the template engine
var server = http_1.default.createServer(app);
var io = socket_io_1.default(server);
var search_results_template = pug_1.compileFile('./views/search_results.pug');
// Initialize connection once
mongodb_1.MongoClient.connect(process.env.MONGODB_URI || 'mongodb://localhost/brasspoll', { useUnifiedTopology: true }).then(function (client) {
    var db = client.db("brasspoll");
    var polls = db.collection("polls");
    // Start the application after the database connection is ready
    app.get('/', function (_, response) {
        response.render('create');
    });
    app.get("/details", function (request, response) {
        var _a;
        (_a = Plugin_1.plugin_manager.pluginById(request.query.plugin)) === null || _a === void 0 ? void 0 : _a.detailsUnique(request.query).then(function (details) {
            response.send(Plugin_1.plugin_manager.pluginById(request.query.plugin).details_template({ option: details }));
        }).catch(function (_) {
            console.log(_);
            response.sendStatus(404);
        });
    });
    app.get("/details/:poll_id", function (request, response) {
        var id = (typeof request.params.poll_id === "number") ? request.params.poll_id :
            (typeof request.params.poll_id === "string") ? parseInt(request.params.poll_id) :
                NaN;
        var plugin = Plugin_1.plugin_manager.pluginById(request.query.plugin);
        if (id !== NaN && plugin !== undefined) {
            polls.findOne({ poll_id: id })
                .then(function (poll) {
                if (!!poll) {
                    var details = plugin.detailsUniqueFromDB(request.query, poll.options);
                    if (!!details) {
                        response.send(plugin.details_template({ option: details }));
                    }
                    else
                        response.sendStatus(404);
                }
                else {
                    plugin.detailsUnique(request.query).then(function (details) {
                        response.send(Plugin_1.plugin_manager.pluginById(request.query.plugin).details_template({ option: details }));
                    }).catch(function (_) {
                        console.log(_);
                        response.sendStatus(404);
                    });
                }
                ;
            })
                .catch(function (reason) {
                console.error(reason);
                response.status(500).send({ success: false });
            });
        }
        else {
            response.sendStatus(400);
        }
    });
    app.get('/:poll_id/renew', function (request, response) {
        var id = (typeof request.params.poll_id === "number") ? request.params.poll_id :
            (typeof request.params.poll_id === "string") ? parseInt(request.params.poll_id) :
                NaN;
        if (id !== NaN) {
            polls.findOne({ poll_id: id })
                .then(function (poll) {
                if (!!poll) {
                    response.render('create', poll);
                }
                else {
                    StrawpollAPI_1.default.get(id).then(function (strawpoll) {
                        response.render('create', {
                            poll_id: id,
                            options: strawpoll.options.map(function (opt) { return { label: opt }; })
                        });
                    }).catch(function (reason) {
                        console.error(reason);
                        response.sendStatus(404);
                    });
                }
                ;
            })
                .catch(function (reason) {
                console.error(reason);
                response.status(500).send({ success: false });
            });
        }
        else {
            response.sendStatus(400);
        }
    });
    app.get('/:poll_id', function (request, response) {
        var id = (typeof request.params.poll_id === "number") ? request.params.poll_id :
            (typeof request.params.poll_id === "string") ? parseInt(request.params.poll_id) :
                NaN;
        if (id !== NaN) {
            polls.findOne({ poll_id: id })
                .then(function (poll) {
                if (!!poll) {
                    response.render('detail', poll);
                }
                else {
                    StrawpollAPI_1.default.get(id).then(function (strawpoll) {
                        response.render('detail', {
                            poll_id: id,
                            options: strawpoll.options.map(function (opt) { return { label: opt }; })
                        });
                    }).catch(function (reason) {
                        console.error(reason);
                        response.sendStatus(404);
                    });
                }
                ;
            })
                .catch(function (reason) {
                console.error(reason);
                response.status(500).send({ success: false });
            });
        }
        else {
            response.sendStatus(400);
        }
    });
    app.post('/new', function (request, response) { return __awaiter(void 0, void 0, void 0, function () {
        var body, to_store, _loop_1, pluginIndex;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    body = request.body;
                    to_store = [];
                    _loop_1 = function (pluginIndex) {
                        var plugin, populated_options, error_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    plugin = Plugin_1.plugin_manager.plugins[pluginIndex];
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, plugin.detailsMultiple(plugin.validate(body.options.filter(function (opt) { return opt.plugin === plugin.id; })))];
                                case 2:
                                    populated_options = _a.sent();
                                    to_store.push.apply(to_store, populated_options);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_1 = _a.sent();
                                    console.error(error_1);
                                    response.status(500).send({
                                        success: false
                                    });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    };
                    pluginIndex = 0;
                    _a.label = 1;
                case 1:
                    if (!(pluginIndex < Plugin_1.plugin_manager.plugins.length)) return [3 /*break*/, 4];
                    return [5 /*yield**/, _loop_1(pluginIndex)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    pluginIndex++;
                    return [3 /*break*/, 1];
                case 4:
                    to_store.push.apply(to_store, body.options.filter(function (opt) { return opt.plugin === undefined; }).map(function (opt) { return { label: opt.label }; }));
                    if (to_store.length > 0) {
                        StrawpollAPI_1.default.new({
                            title: body.title,
                            multi: body.multi,
                            options: to_store.map(function (opt) { return opt.label; }),
                            dupcheck: (body.dupcheck === "3") ? "disabled" : (body.dupcheck === "2") ? "permissive" : "normal",
                            captcha: body.captcha
                        }).then(function (strawpoll) {
                            polls.findOne({ poll_id: strawpoll.id })
                                .then(function (poll) {
                                if (!!!poll) {
                                    polls.insertOne({ poll_id: strawpoll.id, createdAt: new Date(), options: to_store })
                                        .then(function (_) {
                                        response.status(201).send({
                                            success: true,
                                            poll_url: "/" + strawpoll.id
                                        });
                                    })
                                        .catch(function (reason) {
                                        console.error(reason);
                                        response.status(500).send({
                                            success: false
                                        });
                                    });
                                }
                                else {
                                    response.status(400).send({
                                        success: false
                                    });
                                }
                            })
                                .catch(function (reason) {
                                console.error(reason);
                                response.status(500).send({
                                    success: false
                                });
                            });
                        }).catch(function (reason) {
                            console.error(reason);
                            response.status(500).send({
                                success: false
                            });
                        });
                    }
                    else {
                        response.status(400).send({
                            success: false
                        });
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    io.on('connection', function (socket) {
        console.log('a user connected');
        socket.on('__search__', function (search) {
            if (search === undefined || search === null || search === "") {
                io.emit('__search_results__', {
                    search: search,
                    content: ""
                });
                return;
            }
            io.emit('__search_results__', {
                search: search,
                content: search_results_template({ results: [{ label: search }] })
            });
            Plugin_1.plugin_manager.plugins.forEach(function (plugin) {
                plugin.search(search).then(function (results) {
                    io.emit('__search_results__', {
                        search: search,
                        content: search_results_template({ results: results })
                    });
                });
            });
        });
        socket.on('__update_configuration__', function (update) {
            console.log('__update_configuration__', update);
            if (!!update.plugin) {
                var plugin = Plugin_1.plugin_manager.pluginById(update.plugin);
                if (!!plugin) {
                    plugin.configuration.setValue(update.name, update.value);
                    plugin.configuration.setChecked(update.name, update.checked);
                    io.emit('__update_configuration_complete__', update);
                }
            }
        });
    });
    var port = process.env.PORT || 3000;
    server.listen(port, function () {
        console.log("Example app listening on port " + port + "!");
    });
}).catch(function (reason) { return console.error(reason); });
