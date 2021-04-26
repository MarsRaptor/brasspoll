// @ts-check
const { Router } = require("express");
const BrasspollAPI = require('../../repo/BrasspollAPI.js');
const route_json_brasspolls = Router();

route_json_brasspolls.post('/new', async (request, response) => {

    const poll_id = await BrasspollAPI.createPoll(request.body);
    if (typeof poll_id === "string") {
        switch (poll_id) {
            case "Not enough options":
                response.status(400).send({ success: false, errorCode: 400 });
                break;
            case "Error creating strawpoll":
            case "Some options could not be mapped":
            default:
                response.status(500).send({ success: false, errorCode: 500 });
        }
        return;
    }
    response.status(201).send({ success: true, poll_url: `/${poll_id}` });
    return;
})

route_json_brasspolls.get('/:poll_id', async (request, response) => {
    const poll = await BrasspollAPI.fetchPoll(request.params.poll_id);
    if (typeof poll === "string") {
        response.status(404).send({ success: false, errorCode: 404 });
        return;
    }
    response.status(200).send({
        poll_id: poll.poll_id,
        options: poll.options.map(opt => opt.base_option)
    });
    return;
})

exports.route_json_brasspolls = route_json_brasspolls;