// @ts-check
// ENV variables load
require('dotenv').config();
// Import vendor modules
const express = require('express');
const http = require('http');
const socket_io = require('socket.io');
const { compileFile } = require('pug');
// Import project modules
const { plugin_manager } = require('./plugin/plugin_manager.js');
const { SteamPlugin } = require('./plugins/steam/index.js');
const { IgdbPlugin } = require('./plugins/igdb/index.js');
// Routes imports // TODO aggregate in index.js
const { route_html_details } = require("./routes/html/DetailsHTML.js");
const { route_html_brasspolls } = require("./routes/html/BrasspollHTML.js");
const { route_json_brasspolls } = require("./routes/json/BrasspollJSON.js");
const { EpicStorePlugin } = require('./plugins/epic/index.js');

// Plugin setup
plugin_manager.addPlugin(new SteamPlugin());
plugin_manager.addPlugin(new EpicStorePlugin());
plugin_manager.addPlugin(new IgdbPlugin());

// Express app setup
const app = express();
// Setup view engine
app.set('views', './views'); // specify the views directory
app.set('view engine', 'pug'); // register the template engine
app.use(express.json());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
// Static serve
app.use(express.static('public'));
app.use('/lib/socket.io/', express.static('./node_modules/socket.io/client-dist/'));
// Routes
app.use("/api", route_json_brasspolls);
app.use("/details", route_html_details);
app.use("/", route_html_brasspolls);

// Http server setup
const server = http.createServer(app);
// Socket IO setup
const io = new socket_io.Server(server);

// Search result pug template setup
const search_results_template = compileFile('./views/search_results.pug');

io.on('connection', function (socket) {

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
            content: search_results_template({ results: [{ base_option: { label: search } }] })
        });

        // TODO search should be an object with plugin options
        plugin_manager.plugins.forEach(plugin => {
            plugin.search(search).then(results => {
                io.emit('__search_results__', {
                    search: search,
                    content: search_results_template({ results: results })
                });
            })
        })

    });

});

const port = process.env.PORT || 3000
server.listen(port, function () {
    console.log(`Brasspoll app listening on port ${port}!`);
});



