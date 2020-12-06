// @ts-check
const { Router } = require("express");
const BrasspollAPI = require('../../repo/BrasspollAPI.js');

const route_html_details = Router();

route_html_details.get("/", async (request, response) => {
    const details = await BrasspollAPI.fetchDetails(request.query);
    if (typeof details === "string") {
        switch (details) {
            case "Invalid query format for plugin":
            case "No plugin given":
            case "Plugin is not recognized":
                response.status(400).render("error", {
                    error: {
                        title: "Details not found",
                        description: "Could not find details for given URL"
                    }
                });
                break;
            case "Unknown fetch error for plugin":
            default:
                response.status(500).render("error", {
                    error: {
                        title: "Error fetching details",
                        description: "An error occured while fetching the requested details"
                    }
                });
                break;
        }
        return;
    }
    if (details.length < 1) {
        response.status(404).render("error", {
            error: {
                title: "Details not found",
                description: "Could not find details for given URL"
            }
        });
        return;
    }
    const render = BrasspollAPI.renderDetails(details[0]);
    switch (render) {
        case "No plugin given":
        case "Plugin is not recognized":
            response.status(400).render("error", {
                error: {
                    title: "Details not found",
                    description: "Could not find details for given URL"
                }
            });
            break;
        default:
            response.send(render)
            break;
    }
    return;

})

route_html_details.get("/:poll_id", async (request, response) => {

    const details = await BrasspollAPI.fetchDetailsForPoll(request.params.poll_id, request.query);
    if (typeof details === "string") {
        switch (details) {
            case "Invalid query format for plugin":
            case "No plugin given":
            case "Plugin is not recognized":
                response.status(400).render("error", {
                    error: {
                        title: "Details not found",
                        description: "Could not find details for given URL"
                    }
                });
                break;
            case "Unknown fetch error for plugin":
            default:
                response.status(500).render("error", {
                    error: {
                        title: "Error fetching details",
                        description: "An error occured while fetching the requested details"
                    }
                });
                break;
        }
        return;
    }
    if (details.length < 1) {
        response.status(404).render("error", {
            error: {
                title: "Details not found",
                description: "Could not find details for given URL"
            }
        });
        return;
    }
    const render = BrasspollAPI.renderDetails(details[0]);
    switch (render) {
        case "No plugin given":
        case "Plugin is not recognized":
            response.status(400).render("error", {
                error: {
                    title: "Details not found",
                    description: "Could not find details for given URL"
                }
            });
            break;
        default:
            response.send(render)
            break;
    }
    return;

})

exports.route_html_details = route_html_details;