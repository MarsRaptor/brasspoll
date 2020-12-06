// @ts-check
const { Router } = require("express");
const BrasspollAPI = require('../../repo/BrasspollAPI.js');
const route_html_brasspolls = Router();

route_html_brasspolls.get('/', (_, response) => {
    response.render('create');
})
route_html_brasspolls.get('/:poll_id/renew', async (request, response) => {
    const poll = await BrasspollAPI.fetchPoll(request.params.poll_id);
    if (typeof poll === "string") {
        response.status(404).render("error", {
            error: {
                title: "Poll not found",
                description: "Could not find poll for specified id"
            }
        });
        return;
    }
    response.render('create', poll);
    return;
})

route_html_brasspolls.get('/:poll_id', async (request, response) => {
    const poll = await BrasspollAPI.fetchPoll(request.params.poll_id);
    if (typeof poll === "string") {
        response.status(404).render("error", {
            error: {
                title: "Poll not found",
                description: "Could not find poll for specified id"
            }
        });
        return;
    }
    response.render('detail', poll);
    return;
})
exports.route_html_brasspolls = route_html_brasspolls;