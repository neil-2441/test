const XMLHttpRequest = require('xhr2'),
    fastXmlParser = require('fast-xml-parser');

debugger;
const buildFileUpload = () => {
    return (async function () {
        const send_request = async function (url, rid, fid, file) {
            const get_qb_response = (action) => {
                return {
                    code: '0',
                    text: 'No Error',
                    action: typeof action !== 'undefined' ? action : ''
                }
            };
            const parse_qb_response = (response_body, qb_response) => {
                let qdbapi = typeof response_body.qdbapi !== 'undefined' ? response_body.qdbapi : response_body,
                    qb_codes = qb_response || get_qb_response();
                const responses = [
                    /** method was GET **/
                    {source: 'quickbase-errcode', target: 'code'},
                    {source: 'quickbase-errtext', target: 'text'},
                    /** method was POST **/
                    {source: 'file_fields', target: 'file'},
                    {source: 'errcode', target: 'code'},
                    {source: 'errtext', target: 'text'},
                    {source: 'action', target: 'action'},
                    {source: 'num_recs_added', target: 'added'},
                    {source: 'num_recs_input', target: 'input'},
                    {source: 'num_recs_updated', target: 'updated'},
                    {source: 'num_records_deleted', target: 'deleted'},
                    {source: 'records', target: 'records'},
                ];
                responses.forEach(function (rsp) {
                    if (typeof qdbapi[rsp.source] !== 'undefined') {
                        qb_codes[rsp.target] = qdbapi[rsp.source];
                    }

                });
                return qb_codes;
            };

            const send = (options) => {
                return new Promise(function (resolve, reject) {
                        const set_error = (xhr) => {
                            return ({
                                success: false,
                                xhr_status: xhr.status,
                                text: xhr.statusText // status text is an object
                            });
                        };
                        let xhr = new XMLHttpRequest();
                        xhr.open(options.method, options.url);
                        xhr.onload = function () {
                            if (xhr.status >= 200 && xhr.status < 300) {
                                resolve(
                                    {
                                        success: true,
                                        xhr_status: xhr.status,
                                        text: xhr.responseText
                                    }
                                )
                            } else {
                                reject(set_error(xhr));
                            }
                        };
                        xhr.onerror = function () {
                            let err = set_error(xhr);
                            //debugger;;
                            console.log(JSON.stringify(err))
                            reject(err);
                        };
                        if (options.method.toLowerCase() === "post") {
                            xhr.timeout = 4000; // Set timeout to 4 seconds (4000 milliseconds)

                            xhr.setRequestHeader("Content-Type", "application/xml");
                            //xhr.setRequestHeader("Content-Length", options.data.length);
                            xhr.setRequestHeader("QUICKBASE-ACTION", options.action);
                        }
                        //debugger;
                        xhr.send(options.data);
                    }
                )
            };

            const formatRequest = (obj) => {
                const toXML = fastXmlParser.j2xParser;
//default options need not to set
                const defaultOptions = {
                    attributeNamePrefix: "@_",
                    attrNodeName: "@", //default is false
                    textNodeName: "#text",
                    ignoreAttributes: true,
                    encodeHTMLchar: false,
                    cdataTagName: "__cdata", //default is false
                    cdataPositionChar: "\\c",
                    format: false,
                    indentBy: "  ",
                    supressEmptyNode: false
                };
                let xmlFromObj = new toXML(defaultOptions);

                return xmlFromObj.parse(obj);

            }
            const xml_2_json_options = {
                //	attributeNamePrefix : "@_",
                attributeNamePrefix: "",
                attrNodeName: "attr", //default is 'false'
                //textNodeName: "#text",
                ignoreAttributes: false,
                ignoreNameSpace: false,
                allowBooleanAttributes: false,
                parseNodeValue: true,
                parseAttributeValue: true,
                trimValues: true,
                cdataTagName: "__cdata", //default is 'false'
                cdataPositionChar: "\\c"
                //	attrValueProcessor: a => he.decode(a, {isAttributeValue: true}),//default is a=>a
                //	tagValueProcessor : a => he.decode(a) //default is a=>a

            };
            let xmlRequest = {
                    qdbapi: {
                        rid: rid,
                        field: {
                            '@': {
                                'fid': fid,
                                'filename': file.name
                            },
                            '#text': file.content
                        },
                        apptoken: 'gb65ktbtg3qgd4cttxzdqvrr6g',
                        usertoken: 'b3izqx_mqhe_bxhivmjm6s42mbx4q5tdydra8q'
                    }
                },
                apiOptions = {
                    url: url,
                    "method": "post",
                    "action": "API_UploadFile",
                    "data": formatRequest(xmlRequest)
                };
            let result = await send(apiOptions);
            const response_body = fastXmlParser.parse(result.text, xml_2_json_options);

            result.qbResonse = parse_qb_response(response_body);
            debugger;
            return result

        };
        debugger;

        return {
            uploadFile: send_request,
        }
    })();
}

module.exports.buildFileUpload = buildFileUpload;

