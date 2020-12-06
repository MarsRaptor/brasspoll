/**
 * @template T
 * @param {string} raw_str 
 * @returns {string | T}
 */
function safeParseJSON(raw_str){
    try {
        const json = JSON.parse(raw_str);
        return json;
    } catch (error) {
        return "Error parsing response"
    }
}
exports.safeParseJSON = safeParseJSON;