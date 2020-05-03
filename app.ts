require('dotenv').config();
import express from 'express';
import http from 'http'
import socket_io from 'socket.io'
import { compileFile as compileTemplate } from 'pug'
import { SteamPlugin } from './plugins/steam';
import { plugin_manager, search_result_t } from './plugin/Plugin';
import { IgdbPlugin } from './plugins/igdb';
import { MongoClient, Db, Collection } from 'mongodb'
import StrawpollAPI from './strawpoll/StrawpollAPI';
import { ErrorHelper } from './ErrorHelper';

plugin_manager.addPlugin(new SteamPlugin());
plugin_manager.addPlugin(new IgdbPlugin());

const app: express.Application = express();
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(express.json());
app.use(express.static('public'));

app.use('/lib/socket.io/', express.static('./node_modules/socket.io-client/dist/'))

app.set('views', './views') // specify the views directory
app.set('view engine', 'pug') // register the template engine
const server = http.createServer(app);
const io = socket_io(server)
const search_results_template = compileTemplate('./views/search_results.pug');

// Initialize connection once
MongoClient.connect(process.env.MONGODB_URI || 'mongodb://localhost/brasspoll', { useUnifiedTopology: true }).then(client => {

  const db: Db = client.db();
  const polls: Collection<{
    poll_id: number;
    createdAt: Date;
    options: {
      label: string;
      img?: string;
      icon?: string;
      plugin?: string;
      [key: string]: any;
    }[];
  }> = db.collection("polls");

  // Start the application after the database connection is ready
  app.get('/', (_, response) => {
    response.render('create');
  })

  app.get('/important', (_, response) => {
    response.render('important');
  })

  app.get("/details", (request, response) => {
    plugin_manager.pluginById(request.query.plugin)?.detailsUnique(request.query).then(details => {
      response.send(plugin_manager.pluginById(request.query.plugin)!.details_template({ option: details }))
    }).catch(reason => {
      console.error(reason);
      ErrorHelper(response, "RESOURCE_NOT_FOUND");
    })
  })

  app.get("/details/:poll_id", (request, response) => {
    let id: number =
      (typeof request.params.poll_id === "number") ? request.params.poll_id :
        (typeof request.params.poll_id === "string") ? parseInt(request.params.poll_id) :
          NaN;
    let plugin = plugin_manager.pluginById(request.query.plugin);

    if (id !== NaN && plugin !== undefined) {
      polls.findOne({ poll_id: id })
        .then(poll => {
          if (!!poll) {
            let details = plugin!.detailsUniqueFromDB(request.query, poll.options as any);
            if (!!details) {
              response.send(plugin!.details_template({ option: details }))
            } else {
              ErrorHelper(response, "RESOURCE_NOT_FOUND");
            }
          } else {
            plugin!.detailsUnique(request.query).then(details => {
              response.send(plugin_manager.pluginById(request.query.plugin)!.details_template({ option: details }))
            }).catch(reason => {
              console.error(reason);
              ErrorHelper(response, "RESOURCE_NOT_FOUND");
            })
          };
        })
        .catch(reason => {
          console.error(reason);
          ErrorHelper(response, "DB_QUERY_FAILED");
        })

    } else {
      ErrorHelper(response, "DB_QUERY_FAILED");
    }
  })

  app.get('/:poll_id/renew', (request, response) => {
    let id: number =
      (typeof request.params.poll_id === "number") ? request.params.poll_id :
        (typeof request.params.poll_id === "string") ? parseInt(request.params.poll_id) :
          NaN;

    if (id !== NaN) {
      polls.findOne({ poll_id: id })
        .then(poll => {
          if (!!poll) {
            response.render('create', poll);
          } else {
            StrawpollAPI.get(id).then(strawpoll => {
              response.render('create', {
                poll_id: id,
                options: strawpoll.options.map(opt => { return { label: opt } })
              });
            }).catch(reason => {
              console.error(reason);
              ErrorHelper(response, "STRAWPOLL_FAILED");
            })
          };
        })
        .catch(reason => {
          console.error(reason);
          ErrorHelper(response, "STRAWPOLL_FAILED");
        })

    } else {
      ErrorHelper(response, "BAD_REQUEST");
    }
  })

  app.get('/:poll_id', (request, response) => {
    let id: number =
      (typeof request.params.poll_id === "number") ? request.params.poll_id :
        (typeof request.params.poll_id === "string") ? parseInt(request.params.poll_id) :
          NaN;

    if (id !== NaN) {
      polls.findOne({ poll_id: id })
        .then(poll => {
          if (!!poll) {
            response.render('detail', poll);
          } else {
            StrawpollAPI.get(id).then(strawpoll => {
              response.render('detail', {
                poll_id: id,
                options: strawpoll.options.map(opt => { return { label: opt } })
              });
            }).catch(reason => {
              console.error(reason);
              ErrorHelper(response, "STRAWPOLL_FAILED");
            })
          };
        })
        .catch(reason => {
          console.error(reason);
          ErrorHelper(response, "PLUGIN_QUERY_FAILED");
        })

    } else {
      ErrorHelper(response, "BAD_REQUEST");
    }

  })

  app.post('/new', async (request, response) => {

    let body: { title: string, multi: boolean, captcha: boolean, dupcheck: "1" | "2" | "3", options: search_result_t<{}>[] } = request.body;
    let to_store: { label: string, img?: string, icon?: string, plugin?: string; }[] = [];

    for (let pluginIndex = 0; pluginIndex < plugin_manager.plugins.length; pluginIndex++) {
      const plugin = plugin_manager.plugins[pluginIndex];
      try {
        let populated_options = await plugin.detailsMultiple(plugin.validate(body.options.filter((opt) => opt.plugin === plugin.id)));
        to_store.push(...populated_options);
      } catch (reason) {
        console.error(reason);
        ErrorHelper(response, "PLUGIN_QUERY_FAILED");
      }

    }
    to_store.push(...body.options.filter(opt => opt.plugin === undefined).map(opt => { return { label: opt.label } }));

    if (to_store.length > 0) {
      StrawpollAPI.new({
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
                    response.status(201).send(
                      {
                        success: true,
                        poll_url: `/${strawpoll.id}`
                      }
                    );
                  })
                  .catch(reason => {
                    console.error(reason);
                    ErrorHelper(response, "DB_QUERY_FAILED");
                  })
              } else {
                ErrorHelper(response, "BAD_REQUEST");
              }
            })
            .catch(reason => {
              console.error(reason);
              ErrorHelper(response, "DB_QUERY_FAILED");
            })
        } else {
          ErrorHelper(response, "STRAWPOLL_FAILED");
        }

      }).catch(reason => {
        console.error(reason);
          ErrorHelper(response, "DB_QUERY_FAILED");
      })

    } else {
      ErrorHelper(response, "BAD_REQUEST");
    }
  })

  io.on('connection', function (socket: socket_io.Socket) {

    // console.log('a user connected');

    socket.on('__search__', (search: string) => {

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

      plugin_manager.plugins.forEach(plugin => {
        plugin.search(search).then(results => {
          io.emit('__search_results__', {
            search: search,
            content: search_results_template({ results: results })
          });
        })
      })

    });

    socket.on('__update_configuration__', (update: { plugin: string, name: string, checked: boolean, value: string | number }) => {
      //console.log('__update_configuration__', update);

      if (!!update.plugin) {
        let plugin = plugin_manager.pluginById(update.plugin);
        if (!!plugin) {
          plugin.configuration.setValue(update.name, update.value);
          plugin.configuration.setChecked(update.name, update.checked);
          io.emit('__update_configuration_complete__', update);
        }
      }
    })


  });

  const port = process.env.PORT || 3000
  server.listen(port, function () {
    console.log(`Brasspoll app listening on port ${port}!`);
  });
}).catch(reason => console.error(reason))


