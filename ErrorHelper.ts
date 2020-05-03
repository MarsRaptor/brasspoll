import express from 'express';

export const ErrorStatuses = {
   DB_QUERY_FAILED : 500,
   PLUGIN_QUERY_FAILED : 500,
   STRAWPOLL_FAILED : 500,
   BAD_REQUEST : 400,
   RESOURCE_NOT_FOUND : 404
};

export function ErrorHelper(response: express.Response<any>, errorCode: keyof typeof ErrorStatuses) {
    response.status(ErrorStatuses[errorCode]).send({
        success: false,
        errorCode: errorCode
    });
}