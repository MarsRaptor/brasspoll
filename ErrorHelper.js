"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorStatuses = {
    DB_QUERY_FAILED: 500,
    PLUGIN_QUERY_FAILED: 500,
    STRAWPOLL_FAILED: 500,
    BAD_REQUEST: 400,
    RESOURCE_NOT_FOUND: 404
};
function ErrorHelper(response, errorCode) {
    response.status(exports.ErrorStatuses[errorCode]).send({
        success: false,
        errorCode: errorCode
    });
}
exports.ErrorHelper = ErrorHelper;
