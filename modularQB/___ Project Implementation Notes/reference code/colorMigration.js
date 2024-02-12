const
    delay = require('delay'),
    {qbAPI} = require('./buildQbApi'),
    {aws} = require('./models/fetchAws'),
    fastXmlParser = require('fast-xml-parser');



(async function () {

    const
        versionUpdates = {delete: true, keep: 1},
        userToken = "b3izqx_bh7p_0_b9cynztcizxkwxbu6ctx2dzcwzx4",
        appToken = "bhp63w5g7gkghsyiphwdzjutmw",
        realm = "color.quickbase.com",
        authorization = ["QB-USER-TOKEN", userToken].join(' '),
        attachmentFile = "bia5twxhy",
        fid = {
            recordId: 3,
            bedName: 7,
            awsUrl: 26,
            imageFid: 57,
            uploadRequired: 58
        };
    const uploadFile = async function (row, file) {
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
        let uploadUrl = ['https:/', realm, 'db', attachmentFile].join('/'), //https://team707.quickbase.com/db/bpsaiwzeh?act=API_UploadFile
            xmlRequest = {
                qdbapi: {
                    rid: row[fid.recordId].value,
                    field: {
                        '@': {
                            'fid': fid.imageFid,
                            'filename': file.name
                        },
                        '#text': file.content
                    },
                    apptoken: appToken,
                    usertoken: userToken
                }
            },

            init = {
                method: "post",
                body: formatRequest(xmlRequest),
                headers: {
                    "Content-Type": "application/xml",
                    "QUICKBASE-ACTION": "API_UploadFile"
                }
            };
        // debugger;
        // debugger;

        let result = await qbAPI.send(uploadUrl, init);
        // debugger;
        // debugger;
        const response_body = fastXmlParser.parse(result.data, xml_2_json_options);

        result.qbResponse = parse_qb_response(response_body);

        return result;


    };

    const deleteVersion = async function (row, version) {
        let deleteUrl = ["https://api.quickbase.com/v1/files", attachmentFile, row[fid.recordId].value, fid.attachment, version].join('/')
        init = {
            method: "delete",
            body: {},
            headers: {
                "QB-Realm-Hostname": realm,
                "Authorization": authorization
            }
        };
        delete init.body;
        // debugger;
        let result = await qbAPI.send(deleteUrl, init);
        if (result.status.ok) {
            // debugger;
        } else {
            debugger;
        }
        return result;

    }
    const getFile = async function (row, version) {
        const getFileInformation = (result) => {
            const formatBytes = (bytes, decimals = 2) => {
                if (bytes === 0) return '0 Bytes';

                const k = 1024;
                const dm = decimals < 0 ? 0 : decimals;
                const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

                const i = Math.floor(Math.log(bytes) / Math.log(k));

                return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
            }
            debugger;
            /** TODO
             * FIX for UTF 8 encoded files
             *   content_disposition = decodeURIComponent(content_disposition).replace(/\*=/gi, '=').replace(/utf-8/gi,'').replace(/''/g,"").replace(/"/g, '').replace(/'/g, '');
             */
            let nameString = result.status.contentDisposition.split('=').pop().replace(/"/g, ''),
                length = formatBytes(result.status.contentLength, 0),
                content = result.data;
            // base64 =  result.data.toString('base64');
            return {name: nameString, length: length, content: content}

        }
        let downloadUrl = ["https://api.quickbase.com/v1/files", attachmentFile, row[fid.recordId].value, fid.attachment, version].join('/')
        init = {
            method: "get",
            body: {},
            headers: {
                "QB-Realm-Hostname": realm,
                "Authorization": authorization
            }
        };
        delete init.body;
        // debugger;
        let result = await qbAPI.send(downloadUrl, init);
        if (result.status.ok) {
            result.file = getFileInformation(result)
            // debugger;
        } else {
            debugger;
        }
        return result;
    }
    const countVersions = async function (row) {
        let result,
            deleteResult,
            versionsToDelete,
            attachmentField = row[fid.attachment].value,
            versionInfo = {},
            versions = [],
            fileDetails = {};

        attachmentField.versions.forEach(function (version) {
            versions.push(version.versionNumber);
            versionInfo[version.versionNumber] = version;

        });
        versions.sort();

        if (versionUpdates.delete) {
            let keepCount = typeof versionUpdates.keep === 'number' ? versionUpdates.keep : 1,
                deleteCount = Math.max(0, versions.length - keepCount);
            versionsToDelete = [].concat(versions.slice(0, deleteCount));
            versions = versions.splice(deleteCount);
        }
        if (versions.length > 1) {
            console.log(['Record Id:', row[fid.recordId].value, 'has', versions.length, 'versions.'].join(' '))
            debugger;
        }
        while (versionsToDelete.length > 0) {
            debugger;
            let version = versionsToDelete.pop();
            deleteResult = await (deleteVersion(row, version))
            if (deleteResult.status.ok) {
                console.log(['Deleted:', JSON.stringify(versionInfo[version])].join(' '))
            }
        }
        while (versions.length > 0) {
            let version = versions.pop();
            result = await getFile(row, version);
            debugger;
        }
        // debugger;
    }

    const updateImage = async function (row) {
        const buildName = (file, name) => {

            const normalizeName = (str) => {
                if (typeof str !== 'string') {
                    str = ' ' + str;
                }
                let normal = str //.toLowerCase()
                    //  .replace(/([^a-z0-9])/g, ' ')
                    //  .replace(/\./g, ' ')
                    .replace(/(^\s*)|(\s*$)/gi, '')
                    .replace(/\s+/g, ' ')
                    .replace(/</g, '&lt;')
                    .replace(/&/g, '&amp;')
                    .replace(/>/g, '&gt;')
                    .replace(/'/g, '&apos;')
                    .replace(/"/g, '&quot;')

                //  .replace(/ /g, '_');
                //debugger;
                return normal;
            };

            let fileType = file.name.split('.').pop(),
                fileName = normalizeName(name) + '.' + fileType.toLowerCase();
            //debugger;
            return fileName;
        }
        try {
            let uploadResult = {status: {ok: true}},
                imageUrl = ['https:/', realm, 'db', attachmentFile].join('/'),
                rid = row[fid.recordId].value,
                awsUrl = row[fid.awsUrl].value,
                awsFile = await aws.fetch(awsUrl);

            // debugger;
            // aws.fetch only returns a file - check if null?
            awsFile.name = buildName(awsFile, row[fid.bedName].value);

            console.log(['Adding Bed:', awsFile.name, 'rid:', rid].join(' ') + '.')
            // debugger;
            let result = await uploadFile(row, awsFile);
            // debugger;
            if (result.qbResponse.code !== 0) {
                uploadResult.text = ['Upload error rid:', rid, 'error:' + JSON.stringify(result.qbResponse)].join(' ')
                console.log( uploadResult.text)
                uploadResult.status.ok = false
                debugger;
            }
            return uploadResult;
        } catch (err) {
            debugger;
        }
    }

    const checkRows = async function (url, init) {
        let result = await qbAPI.send(url, init),
            rowCount = 0;
        console.log('Query Init: ' + JSON.stringify(init ))

        if (result.status.ok && result.status.code == 200) {
            rows = result.data.data;
            while (rowCount < rows.length) {
                // let result = await countVersions(rows[rowCount++])
                let result = await updateImage(rows[rowCount++])
            }
        }
        return result;
    }


    let meta,
        totalRows = 0,
        maxRows = 350,
        rowsPerBlock = 25,
        queryUrl = "https://api.quickbase.com/v1/records/query",
        init = {
            method: "post",
            body: {
                from: attachmentFile,
                select: [
                    fid.recordId,
                    fid.attachment,
                    fid.awsUrl,
                    fid.imageFid,
                    fid.bedName
                ],
                //"where": "{" + fid.attachment + ".filename is not equal to.' '}",
                "where": "{" + fid.uploadRequired + ".EX.'1'}",
                sortBy: [{fieldId: fid.recordId, order: "ASC"}],
                options: {
                    skip: 0,
                    top: rowsPerBlock
                }
            },
            headers: {
                "QB-Realm-Hostname": realm,
                "Authorization": authorization,
                "Content-type": "application/json"
            }
        };
    // debugger;
    while (totalRows < maxRows) {
        let result = await checkRows(queryUrl, init);
        if (result.status.ok) {
            init.body = JSON.parse(init.body)
            meta = result.data.metadata;
            if (meta.numRecords == 0) {
                maxRows = totalRows;
            } else {
                totalRows += meta.numRecords;
            }
         //   init.body.options.skip = totalRows;
        }
        if (result.status.requestsRemaining == 1) {
            debugger;
            let waitForIt = parseInt(result.status.requestResetMillSeconds) + 10
            await delay(waitForIt);
        }
    }
    console.log(['Total rows checked:', totalRows].join(' '))
})()