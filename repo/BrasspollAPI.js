// @ts-check
const { Pool } = require('pg');
const { plugin_manager } = require('../plugin/plugin_manager.js');
const StrawpollAPI2 = require('../strawpoll/StrawpollAPI.js');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    //ssl: { rejectUnauthorized: false }
})

/**
 * Fetch details for one or more base options
 * @param {*} query 
 */
async function fetchDetails(query) {
    if (Array.isArray(query)) {

        /** @type {Map<string,any[]>}**/
        const pluginXqueriesMap = new Map();
        for (const q of query) {
            if (!pluginXqueriesMap.has(q.plugin)) {
                pluginXqueriesMap.set(q.plugin, [])
            }
            pluginXqueriesMap.get(q.plugin).push(q);
        }

        ///** @type {full_option<shallow_t, deep_t>[]} */
        const details_aggregate = [];
        for (const [plugin_name, query_array] of pluginXqueriesMap) {
            const plugin = plugin_manager.pluginById(plugin_name);
            if (plugin === undefined) {
                return "Plugin is not recognized";
            }
            const sanitized = plugin.sanitize(query_array);
            if (sanitized.length < 1) {
                return "Invalid query format for plugin";
            }
            const details = await plugin.fetchDetails(sanitized,false);
            if (details.length < 1) {
                return "Unknown fetch error for plugin";
            }
            details_aggregate.push(...details);
        }
        return details_aggregate;

    } else {
        const plugin_name = query.plugin;
        if (typeof plugin_name !== "string") {
            return "No plugin given";
        }

        const plugin = plugin_manager.pluginById(plugin_name);
        if (plugin === undefined) {
            return "Plugin is not recognized";
        }

        const sanitized = plugin.sanitize([query]);
        if (sanitized.length < 1) {
            return "Invalid query format for plugin";
        }

        try {
            const details = await plugin.fetchDetails(sanitized,false);
            if (details.length < 1) {
                return "Unknown fetch error for plugin";
            }
            return details;
        } catch (error) {
            return "Unknown fetch error for plugin";

        }

    }
}

/**
 * Fetch details for one or more base options contained in an existing poll
 * @param {*} id (should be a number)
 * @param {*} query 
 */
async function fetchDetailsForPoll(id, query) {
    const poll_id = (typeof id === "number") ? id : (typeof id === "string") ? parseInt(id) : NaN;
    if (isNaN(poll_id)) {
        return "No poll given";
    }

    if (Array.isArray(query)) {

        /** @type {Map<string,any[]>}**/
        const pluginXqueriesMap = new Map();
        for (const q of query) {
            if (!pluginXqueriesMap.has(q.plugin)) {
                pluginXqueriesMap.set(q.plugin, [])
            }
            pluginXqueriesMap.get(q.plugin).push(q);
        }

        /** @type {full_option<shallow_t, deep_t>[]} */
        const details_aggregate = [];
        for (const [plugin_name, query_array] of pluginXqueriesMap) {
            const plugin = plugin_manager.pluginById(plugin_name);
            if (plugin === undefined) {
                return "Plugin is not recognized";
            }
            const sanitized = plugin.sanitize(query_array);
            if (sanitized.length < 1) {
                return "Invalid query format for plugin";
            }

            const dbQuery = plugin.optionQuery(poll_id, sanitized[0]);
            if (!!!dbQuery) {
                return "Error constructing query";
            }

            /** @type {{rows:Array<{options:Array<full_option<shallow_t, deep_t>>[]}>}} */
            const dbResult = await pool.query(dbQuery);
            if (dbResult.rows.length > 0) {
                details_aggregate.push(...dbResult.rows[0].options[0]);// FIXME result is ugly, must be an error in the tested query
            } else {
                const details = await fetchDetails(query_array);
                if (typeof details === "string") {
                    return details;
                }
                details_aggregate.push(...details);
            }
        }
        return details_aggregate;

    } else {
        const plugin_name = query.plugin;
        if (typeof plugin_name !== "string") {
            return "No plugin given";
        }

        const plugin = plugin_manager.pluginById(plugin_name);
        if (plugin === undefined) {
            return "Plugin is not recognized";
        }

        const sanitized = plugin.sanitize([query]);
        if (sanitized.length < 1) {
            return "Invalid query format for plugin";
        }

        const dbQuery = plugin.optionQuery(poll_id, sanitized[0]);
        if (!!!dbQuery) {
            return "Error constructing query";
        }

        /** @type {{rows:Array<{options:Array<full_option<shallow_t, deep_t>>}>}} */
        const dbResult = await pool.query(dbQuery);
        if (dbResult.rows.length > 0) {
            return dbResult.rows[0].options; // FIXME result is ugly, must be an error in the tested query
        } else {
            return await fetchDetails(query);
        }
    }
}

/**
 * Fetch poll for given id
 * @param {*} id (should be a number)
 */
async function fetchPoll(id) {
    const poll_id = (typeof id === "number") ? id : (typeof id === "string") ? parseInt(id) : NaN;
    if (isNaN(poll_id)) {
        return "No poll given";
    }

    /** @type {{rows:{poll_id:number,options:full_option<shallow_t, deep_t>[]}[]}} */
    const dbResult = await pool.query(`select poll_id,options from brasspoll_polls where poll_id = ${id};`);
    if (dbResult.rows.length > 0) {
        return dbResult.rows[0];
    }

    try {
        const strawpollResult = await StrawpollAPI2.fetchPoll(id);
        if (typeof strawpollResult === "string") {
            return "Strawpoll error";
        }
        /** @type {{poll_id:number,options:full_option<shallow_t, deep_t>[]}} */
        const strawpoll = {
            poll_id: id,
            options: strawpollResult.options.map(opt => { return { base_option: { label: opt } } })
        }
        return strawpoll

    } catch (error) {
        return "Strawpoll error";
    }

}

/**
 * Create poll with given parameters
 * @param {*} poll_raw 
 */
async function createPoll(poll_raw) {
    const title = poll_raw.title;
    const multi = poll_raw.multi === true;
    const captcha = poll_raw.captcha === true;
    const dupcheck = (poll_raw.dupcheck === "3") ? "disabled" : (poll_raw.dupcheck === "2") ? "permissive" : "normal";

    if (!Array.isArray(poll_raw.options) || poll_raw.options.length < 2) {
        return "Not enough options";
    }
    const options = poll_raw.options.filter(opt => opt.plugin === undefined && opt.label !== undefined).map(opt => { return { base_option: { label: opt.label } } });
    for (const plugin of plugin_manager.plugins) {
        const options_for_plugin = poll_raw.options.filter(opt => opt.plugin === plugin.id);
        const sanitized_options_for_plugin = plugin.sanitize(options_for_plugin);
        const details = await plugin.fetchDetails(sanitized_options_for_plugin,true);
        if (!!details) {
            options.push(...details);
        }
    }
    if (options.length != poll_raw.options.length) {
        return "Some options could not be mapped";
    }

    const strawpoll = await StrawpollAPI2.create({
        title: title,
        multi: multi,
        options: options.map(opt => opt.base_option.label),
        dupcheck: dupcheck,
        captcha: captcha
    });
    if (typeof strawpoll === "string") {
        return "Error creating strawpoll";
    }

    const dbResult = await pool.query(`INSERT INTO brasspoll_polls(poll_id, options) VALUES($1, $2);`, [strawpoll.id, JSON.stringify(options)]);
    if (dbResult.rowCount < 1) {
        "Error creating brasspoll";
    }

    return strawpoll.id;

}

/**
 * Render details to HTML using the associated plugin detail template 
 * @param {*} details 
 * @returns {"No plugin given"|"Plugin is not recognized"|string} rendered HTML string | error string
 */
function renderDetails(details) {
    const plugin_name = details.base_option.plugin;
    if (typeof plugin_name !== "string") {
        return "No plugin given";
    }

    const plugin = plugin_manager.pluginById(plugin_name);
    if (plugin === undefined) {
        return "Plugin is not recognized";
    }

    return plugin.details_template({ option: details });
}

exports.fetchDetails = fetchDetails;
exports.fetchDetailsForPoll = fetchDetailsForPoll;
exports.fetchPoll = fetchPoll;
exports.createPoll = createPoll;
exports.renderDetails = renderDetails;