const fetch = require('node-fetch');

const buildQbApi = () => {
    return ( function () {
        const send = async (url, init) => {
            const setResponseCodes = (result) => {
                // debugger;
                return {
                    ok: result.ok,
                    code: result.status,
                    text: result.statusText,
                    //   etag: result.headers.get('etag'), - not supported by QB
                    //  timestamp: result.headers.get('Date'), - not supported by QB
                    qbApiRay: result.headers.get('qb-api-ray'),
                    requestsLimit: result.headers.get('x-ratelimit-limit'),
                    requestsRemaining: result.headers.get('x-ratelimit-remaining'),
                    requestResetMillSeconds: result.headers.get('x-ratelimit-reset'),
                    contentType: result.headers.get('content-type'),
                    contentLength: result.headers.get('content-length'),
                    contentDisposition: result.headers.get('content-disposition')
                }
            };
            // debugger;
            let moduleName = 'sendToQB';
            try {
                // debugger;
                if (typeof init.body !== 'undefined') {
                    if (typeof init.body !== 'string'){
                        init.body = JSON.stringify(init.body);
                    }
                    init.headers['Content-length'] = init.body.length;
                } else {
                    delete init.headers['Content-length'];
                }
                let result = await fetch(url, init),
                    status = setResponseCodes(result),
                    isJSON = /^application\/json/,
                    isXML = /^application\/xml/,
                    isBlob = /^application\/octet-stream/,
                    data = null;

               // console.log(status, moduleName, 'info');
                // debugger;

                if (status.ok) {
                    if (result.status.requestsRemaining == 1) {
                        debugger;
                        let waitForIt = parseInt(result.status.requestResetMillSeconds) + 10
                        await delay(waitForIt);
                    }
                    // debugger;
                    if (isJSON.test(status.contentType)) {
                        // debugger;
                        data = await result.json();
                        return {status: status, data: {...data}};
                    } else if (isBlob.test(status.contentType)) {
                        // debugger;
                        data = await result.arrayBuffer();
                        return {status: status, data: data};
                    } else if (isXML.test(status.contentType)) {
                        // debugger;
                        data = await result.text();
                        return {status: status, data: data};
                    } else {
                        // debugger;
                        data = await result.buffer();
                        return {status: status, data: [].concat(data)};

                    }
                } else {
                    debugger;
                    console.log(status, moduleName, 'err');
                    return {status: status};
                }
            } catch (err) {
                debugger;
                console.log(moduleName, err, 'error')
                throw err;
            }
        }
        return {
            send: send,
        }
    })()
}
let qbApi = buildQbApi();
module.exports.qbAPI = qbApi;
