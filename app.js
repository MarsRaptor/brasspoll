"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = __importDefault(require("socket.io"));
const pug_1 = require("pug");
const steam_1 = require("./plugins/steam");
const Plugin_1 = require("./plugin/Plugin");
const igdb_1 = require("./plugins/igdb");
const mongodb_1 = require("mongodb");
const StrawpollAPI_1 = __importDefault(require("./strawpoll/StrawpollAPI"));
const ErrorHelper_1 = require("./ErrorHelper");
Plugin_1.plugin_manager.addPlugin(new steam_1.SteamPlugin());
Plugin_1.plugin_manager.addPlugin(new igdb_1.IgdbPlugin());
const app = express_1.default();
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(express_1.default.json());
app.use(express_1.default.static('public'));
app.use('/lib/socket.io/', express_1.default.static('./node_modules/socket.io-client/dist/'));
app.set('views', './views'); // specify the views directory
app.set('view engine', 'pug'); // register the template engine
const server = http_1.default.createServer(app);
const io = socket_io_1.default(server);
const search_results_template = pug_1.compileFile('./views/search_results.pug');
// Initialize connection once
mongodb_1.MongoClient.connect(process.env.MONGODB_URI || 'mongodb://localhost/brasspoll', { useUnifiedTopology: true }).then(client => {
    const db = client.db();
    const polls = db.collection("polls");
    // Start the application after the database connection is ready
    app.get('/', (_, response) => {
        response.render('create');
    });
    app.get('/important', (_, response) => {
        response.render('important');
    });
    app.get("/details", (request, response) => {
        var _a;
        (_a = Plugin_1.plugin_manager.pluginById(request.query.plugin)) === null || _a === void 0 ? void 0 : _a.detailsUnique(request.query).then(details => {
            response.send(Plugin_1.plugin_manager.pluginById(request.query.plugin).details_template({ option: details }));
        }).catch(reason => {
            console.error(reason);
            ErrorHelper_1.ErrorHelper(response, "RESOURCE_NOT_FOUND");
        });
    });
    app.get("/details/:poll_id", (request, response) => {
        let id = (typeof request.params.poll_id === "number") ? request.params.poll_id :
            (typeof request.params.poll_id === "string") ? parseInt(request.params.poll_id) :
                NaN;
        let plugin = Plugin_1.plugin_manager.pluginById(request.query.plugin);
        if (id !== NaN && plugin !== undefined) {
            polls.findOne({ poll_id: id })
                .then(poll => {
                if (!!poll) {
                    let details = plugin.detailsUniqueFromDB(request.query, poll.options);
                    if (!!details) {
                        response.send(plugin.details_template({ option: details }));
                    }
                    else {
                        ErrorHelper_1.ErrorHelper(response, "RESOURCE_NOT_FOUND");
                    }
                }
                else {
                    plugin.detailsUnique(request.query).then(details => {
                        response.send(Plugin_1.plugin_manager.pluginById(request.query.plugin).details_template({ option: details }));
                    }).catch(reason => {
                        console.error(reason);
                        ErrorHelper_1.ErrorHelper(response, "RESOURCE_NOT_FOUND");
                    });
                }
                ;
            })
                .catch(reason => {
                console.error(reason);
                ErrorHelper_1.ErrorHelper(response, "DB_QUERY_FAILED");
            });
        }
        else {
            ErrorHelper_1.ErrorHelper(response, "DB_QUERY_FAILED");
        }
    });
    app.get('/:poll_id/renew', (request, response) => {
        let id = (typeof request.params.poll_id === "number") ? request.params.poll_id :
            (typeof request.params.poll_id === "string") ? parseInt(request.params.poll_id) :
                NaN;
        if (id !== NaN) {
            polls.findOne({ poll_id: id })
                .then(poll => {
                if (!!poll) {
                    response.render('create', poll);
                }
                else {
                    StrawpollAPI_1.default.get(id).then(strawpoll => {
                        response.render('create', {
                            poll_id: id,
                            options: strawpoll.options.map(opt => { return { label: opt }; })
                        });
                    }).catch(reason => {
                        console.error(reason);
                        ErrorHelper_1.ErrorHelper(response, "STRAWPOLL_FAILED");
                    });
                }
                ;
            })
                .catch(reason => {
                console.error(reason);
                ErrorHelper_1.ErrorHelper(response, "STRAWPOLL_FAILED");
            });
        }
        else {
            ErrorHelper_1.ErrorHelper(response, "BAD_REQUEST");
        }
    });
    app.get('/:poll_id', (request, response) => {
        let id = (typeof request.params.poll_id === "number") ? request.params.poll_id :
            (typeof request.params.poll_id === "string") ? parseInt(request.params.poll_id) :
                NaN;
        if (id !== NaN) {
            polls.findOne({ poll_id: id })
                .then(poll => {
                if (!!poll) {
                    response.render('detail', poll);
                }
                else {
                    StrawpollAPI_1.default.get(id).then(strawpoll => {
                        response.render('detail', {
                            poll_id: id,
                            options: strawpoll.options.map(opt => { return { label: opt }; })
                        });
                    }).catch(reason => {
                        console.error(reason);
                        ErrorHelper_1.ErrorHelper(response, "STRAWPOLL_FAILED");
                    });
                }
                ;
            })
                .catch(reason => {
                console.error(reason);
                ErrorHelper_1.ErrorHelper(response, "PLUGIN_QUERY_FAILED");
            });
        }
        else {
            ErrorHelper_1.ErrorHelper(response, "BAD_REQUEST");
        }
    });
    app.post('/new', async (request, response) => {
        let body = request.body;
        let to_store = [];
        for (let pluginIndex = 0; pluginIndex < Plugin_1.plugin_manager.plugins.length; pluginIndex++) {
            const plugin = Plugin_1.plugin_manager.plugins[pluginIndex];
            try {
                let populated_options = await plugin.detailsMultiple(plugin.validate(body.options.filter((opt) => opt.plugin === plugin.id)));
                to_store.push(...populated_options);
            }
            catch (reason) {
                console.error(reason);
                ErrorHelper_1.ErrorHelper(response, "PLUGIN_QUERY_FAILED");
            }
        }
        to_store.push(...body.options.filter(opt => opt.plugin === undefined).map(opt => { return { label: opt.label }; }));
        if (to_store.length > 0) {
            StrawpollAPI_1.default.new({
                title: body.title,
                multi: body.multi,
                options: to_store.map(opt => opt.label),
                dupcheck: (body.dupcheck === "3") ? "disabled" : (body.dupcheck === "2") ? "permissive" : "normal",
                captcha: body.captcha
            }).then(strawpoll => {
                if (typeof strawpoll.id === "number") {
                    polls.findOne({ poll_id: strawpoll.id })
                        .then(poll => {
                        if (!!!poll) {
                            polls.insertOne({ poll_id: strawpoll.id, createdAt: new Date(), options: to_store })
                                .then(_ => {
                                response.status(201).send({
                                    success: true,
                                    poll_url: `/${strawpoll.id}`
                                });
                            })
                                .catch(reason => {
                                console.error(reason);
                                ErrorHelper_1.ErrorHelper(response, "DB_QUERY_FAILED");
                            });
                        }
                        else {
                            ErrorHelper_1.ErrorHelper(response, "BAD_REQUEST");
                        }
                    })
                        .catch(reason => {
                        console.error(reason);
                        ErrorHelper_1.ErrorHelper(response, "DB_QUERY_FAILED");
                    });
                }
                else {
                    ErrorHelper_1.ErrorHelper(response, "STRAWPOLL_FAILED");
                }
            }).catch(reason => {
                console.error(reason);
                ErrorHelper_1.ErrorHelper(response, "DB_QUERY_FAILED");
            });
        }
        else {
            ErrorHelper_1.ErrorHelper(response, "BAD_REQUEST");
        }
    });
    io.on('connection', function (socket) {
        // console.log('a user connected');
        socket.on('__search__', (search) => {
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
            Plugin_1.plugin_manager.plugins.forEach(plugin => {
                plugin.search(search).then(results => {
                    io.emit('__search_results__', {
                        search: search,
                        content: search_results_template({ results: results })
                    });
                });
            });
        });
        socket.on('__update_configuration__', (update) => {
            //console.log('__update_configuration__', update);
            if (!!update.plugin) {
                let plugin = Plugin_1.plugin_manager.pluginById(update.plugin);
                if (!!plugin) {
                    plugin.configuration.setValue(update.name, update.value);
                    plugin.configuration.setChecked(update.name, update.checked);
                    io.emit('__update_configuration_complete__', update);
                }
            }
        });
    });
    const port = process.env.PORT || 3000;
    server.listen(port, function () {
        console.log(`Brasspoll app listening on port ${port}!`);
    });
}).catch(reason => console.error(reason));
