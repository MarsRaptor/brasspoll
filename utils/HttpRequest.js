// @ts-check
const { rejects } = require('assert');
const { request } = require('https');

/**
 * Utility function for creating http requests
 * @param {string | import('http').RequestOptions | URL} options 
 * @param {string } [data] optional post data
 * @param {boolean} [is_void]
 * 
 * @returns {Promise<string|Error|void>} response | error 
 */
async function _request(options, data, is_void) {

    return new Promise((resolve, reject) => {
        if (is_void === true) {
            const req = request(options)
                .on("error", error => {
                    console.error(error);
                    resolve(error);
                });
            if (data !== undefined) {
                req.write(data)
            }
            req.end(_ => {
                resolve();
            })
        } else {
            const req = request(options, res => {
                let _data = '';
                res.on('data', chunk => { _data += chunk; });
                res.on("end", _ => {
                    resolve(_data)
                })
            })
                .on("error", error => {
                    console.error(error);
                    resolve(error);
                });
            if (data !== undefined) {
                req.write(data)
            }
            req.end();
        }
    })

}

exports.request = _request;