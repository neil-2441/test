if (typeof exports !== 'undefined') {
    var {ut} = require('./utilityFunctions'),
        fetch = require('node-fetch');
}
debugger;

function quickBaseModel(appConfig, views) {
    return (async function () {
        const headerDefaults = {
                'QB-Realm-Hostname': appConfig.realm,
                'Authorization': null,
                'Content-type': 'application/json',
                'Content-length': 0
            },
            qbDefaults = {
                domain: ['https:/', 'api.quickbase.com', 'v1']
            },
            qbProperties = {
                appId: null,
                tablesByAlias: {},
                tablesById: {},
                config: {}
            },
            appViews = {};


        const fetchText = (str) => {
            if (!ut.isNull(str) && ut.isFunction(str.replace)) {
                return str.replace(/(^\s*)|(\s*$)/g, '').replace(/\s{2,}/g, ' ');
            } else {
                console.log('*** ' + str + 'is not a string')
            }
            return str;
        };
        const storeText = (str) => {
            if (!ut.isNull(str) && ut.isFunction(str.replace)) {
                return str.replace(/(^\s*)|(\s*$)/g, '').replace(/\s{2,}/g, ' ');
            } else {
                console.log('*** ' + str + 'is not a string')
            }
            return str;
        };
        const fetchDate = (date) => {
            return ut.toDateTime(date);
        };
        const storeDate = (date) => {
            return ut.formatDate(date)
        };
        const storeTimestamp = (timestamp) => {
            return ut.formatDateTime(timestamp)
        };
        const fetchCheckbox = (value) => {
            const isTrue = /true|yes/i,
                isFalse = /false|no/i;

            if (typeof value === 'string' && (isTrue.test(value) || isFalse.test(value))) {
                return (!isFalse.test(value));
            }
            return !(value == '0' || value == '0');
        };
        const storeCheckbox = (value) => {
            return !value ? '0' : '1';
        };
        const fieldTypes = {
            date: {
                fnFetch: fetchDate,
                fnStore: storeDate
            },
            timestamp: {
                fnFetch: fetchDate,
                fnStore: storeTimestamp
            },
            checkbox: {
                fnFetch: fetchCheckbox,
                fnStore: storeCheckbox
            },
            text: {
                fnFetch: fetchText,
                fnStore: storeText
            }
        };

        const fnDefault = (val) => {
            return val
        };
        const getFnFetch = (fieldType) => {
            let type = fieldTypes[fieldType],
                fn = ut.isDefined(type) && ut.isFunction(type.fnFetch) ? type.fnFetch : fnDefault;
            return fn;
        }
        const getFnStore = (fieldType) => {
            let type = fieldTypes[fieldType],
                fn = ut.isDefined(type) && ut.isFunction(type.fnStore) ? type.fnStore : fnDefault;
            return fn;
        }

        const addQueryParam = (key, val) => {
            return [key, val].join('=');
        }
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
                if (ut.isDefined(init.body)) {
                    init.body = JSON.stringify(init.body);
                    init.headers['Content-length'] = init.body.length;
                } else {
                    delete init.headers['Content-length'];
                }
                let result = await fetch(url, init),
                    status = setResponseCodes(result),
                    isJSON = /^application\/json/,
                    isBlob = /^application\/octet-stream/,
                    data = null;

                console.log(status, moduleName, 'info');
                // debugger;

                if (status.ok) {
                    if (isJSON.test(status.contentType)) {
                        // debugger;
                        data = await result.json();
                        return {status: status, data: {...data}};
                    } else if (isBlob.test(status.contentType)) {
                        // debugger;
                        data = await result.arrayBuffer();
                        return {status: status, data: data};
                    } else {
                        // debugger;
                        data = await result.buffer();
                        return {status: status, data: [].concat(data)};

                    }
                } else {
                    // debugger;
                    console.log(status, moduleName, 'err');
                    return {status: status};
                }
            } catch (err) {
                // debugger;
                console.log(moduleName, err, 'error')
                throw err;
            }
        };

        const getApp = async () => {
            // debugger;
            let path = ['apps', qbProperties.appId],
                appUrl = qbDefaults.domain.concat(path).join('/'),
                init = {
                    method: 'GET',
                    headers: Object.assign(headerDefaults)
                };
            let result = await send(appUrl, init);
            if (result.status.ok) {
                Object.keys(result.data).forEach(function (key) {
                    qbProperties.config[key] = result.data[key];
                })
            }
            // debugger;
            return result;

        }
        const getAppTable = (alias) => {
            // debugger;
            let isAlias = /^_dbid_/i,
                _alias = alias.toLowerCase();
            if (isAlias.test(_alias) && ut.isDefined(qbProperties.tablesByAlias[_alias])) {
                return qbProperties.tablesByAlias[_alias];
            }
            return null

        }
        const getAppTables = async () => {
            // debugger;
            let path = ['tables'],
                query = '?' + [addQueryParam('appId', appConfig.appId)].join('&'),
                appUrl = qbDefaults.domain.concat(path).join('/') + query,
                init = {
                    method: 'GET',
                    headers: Object.assign(headerDefaults)
                };
            let result = await send(appUrl, init);
            if (result.status.ok) {
                let tables = result.data;
                Object.keys(tables).forEach(function (key) {
                    let table = tables[key];
                    table.alias = table.alias.toLowerCase();
                    table.id = table.id.toLowerCase();

                    let alias = table.alias,
                        dbid = table.id;
                    qbProperties.tablesByAlias[alias] = table;
                    qbProperties.tablesById[dbid] = table;
                })
            }
            // debugger;
            return result;

        }

        // set defaults
        const setAppDefaults = (appConfig) => {
            let isBrowser = (typeof window !== 'undefined' && typeof window.location !== "undefined");
            if (isBrowser) {
                let localAppId = decodeURI(window.location.pathname).replace("/db/", "");
                headerDefaults["QB-Realm-Hostname"] = !ut.isEmpty(appConfig.realm) ? appConfig.realm : decodeURI(window.location.realm);
                qbProperties.appId = !ut.isEmpty(appConfig.appId) ? appConfig.appId : localAppId;
            } else {
                headerDefaults["QB-Realm-Hostname"] = appConfig.realm;
                qbProperties.appId = appConfig.appId;
            }
            headerDefaults.Authorization = ['QB-USER-TOKEN', appConfig.userToken].join(' ');
            // return {status:{ok: true}}
        }

        const getTableFields = async (qbTable) => {
            // debugger;
            let path = ['fields'],
                query = '?' + [addQueryParam('tableId', qbTable.id)].join('&'),
                domainUrl = qbDefaults.domain.concat(path).join('/') + query,
                init = {
                    method: 'GET',
                    headers: Object.assign(headerDefaults)
                };
            let result = await send(domainUrl, init);
            if (result.status.ok) {
                qbTable.fields = result.data;
                qbTable.fieldsByFid = {};

                Object.keys(qbTable.fields).forEach(function (key) {
                    let field = qbTable.fields[key];
                    qbTable.fieldsByFid[field.id] = field;
                })
            }
            // debugger;
            return result;

        }

        const queryTable = async (options) => {
            let path = ['records', 'query'],
                domainUrl = qbDefaults.domain.concat(path).join('/'),
                init = {
                    method: 'POST',
                    headers: Object.assign(headerDefaults),
                    body: options
                };
            // debugger;
            let result = await send(domainUrl, init);
            if (result.status.ok) {
                return {status: {...result.status}, ...result.data}
            }
            // debugger;
            return result;


        }

        const downloadFile = async (options) => {
            //https://api.quickbase.com/v1/files/bpsaiwzeh/27/6/0
            let path = ['files'],
                urlOptions = [],
                domainUrl,
                init = {
                    method: 'GET',
                    headers: Object.assign(headerDefaults)
                };
            urlOptions.push(options.table);
            urlOptions.push(options.recordId);
            urlOptions.push(options.fieldId);
            urlOptions.push(options.version);
            domainUrl = qbDefaults.domain.concat(path).concat(urlOptions).join('/');

            // debugger;
            let result = await send(domainUrl, init);
            // debugger;
            if (result.status.ok) {
                let
                    location = /filename=/i.exec(result.status.contentDisposition),
                    locationIdx = location.index + 9, // 9 == length of 'filename=',
                    file = {
                        content: result.data,
                        length: Number(result.status.contentLength),
                        name: result.status.contentDisposition.substr(locationIdx).replace(/"/g, '')
                    };


                return {status: {...result.status}, file: file}
            }
            // debugger;
            return result;
        }


        const updateTable = async (options) => {
            let path = ['records'],
                domainUrl = qbDefaults.domain.concat(path).join('/'),
                init = {
                    method: 'POST',
                    headers: Object.assign(headerDefaults),
                    body: options
                };
            // debugger;
            let result = await send(domainUrl, init);
            if (result.status.ok) {
                return {status: {...result.status}, ...result.data}
            }
            // debugger;
            return result;
        }

        const deleteRecords = async (options) => {
            let path = ['records'],
                domainUrl = qbDefaults.domain.concat(path).join('/'),
                init = {
                    method: 'DELETE',
                    headers: Object.assign(headerDefaults),
                    body: options
                };
            // debugger;
            let result = await send(domainUrl, init);
            if (result.status.ok) {
                return {status: {...result.status}, ...result.data}
            }
            // debugger;
            return result;

        }
        const buildView = async (view) => {
            const setFieldProperties = (appField, qbField) => {
                const isLookup = (appField, qbField) => {
                    let modes = new Set(['lookup', 'summary']),
                        fieldMode = ut.isDefined(qbField.mode) ? qbField.mode : null;
                    if (ut.isNull(fieldMode)) {
                        return;
                    } else {
                        if (modes.has(fieldMode.toLowerCase())) {
                            appField.isReadOnly = true;
                            appField.isLookup = true;
                        }
                    }
                }
                const isPredecessor = (appField, qbField) => {
                    if (ut.compareStrings(qbField.fieldType, 'predecessor') === 0) {
                        appField.isPrecessor = true;
                    }
                }
                const isMultitext = (appField, qbField) => {
                    if (ut.compareStrings(qbField.fieldType, 'multitext') === 0) {
                        appField.isMultitext = true;
                    }
                }

                const isDblink = (appField, qbField) => {
                    if (ut.compareStrings(qbField.fieldType, 'dblink') === 0) {
                        appField.isReadOnly = true;
                        appField.isDblink = true;
                    }
                }
                const isFormula = (appField, qbField) => {
                    let dblink = (ut.compareStrings(qbField.fieldType, 'dblink') === 0),
                        virtual = (ut.compareStrings(qbField.mode, 'virtual') === 0);

                    if (!dblink & virtual) {
                        appField.isFormula = true;
                    }
                }
                const isFile = (appField, qbField) => {
                    if (ut.compareStrings(qbField.fieldType, 'file') === 0) {
                        appField.isFile = true;
                    }
                }
                const isUser = (appField, qbField) => {
                    if (ut.compareStrings(qbField.fieldType, 'user') === 0) {
                        appField.isUser = true;
                    }
                }
                const isCheckBox = (appField, qbField) => {
                    if (ut.compareStrings(qbField.fieldType, 'checkbox') === 0) {
                        appField.isCheckBox = true;
                    }
                }

                const isReference = (appField, qbField) => {
                    if (ut.isDefined(qbField.properties.masterTableTag)) {
                        appField.isReference = true;
                    }
                }

                const isUnique = (appField, qbField) => {
                    if (ut.isDefined(qbField.unique) && qbField.unique) {
                        appField.isUnique = true;
                    }
                }

                const isReadonly = (appField, qbField) => {
                    let systemFields = new Set([1, 2, 4, 5]),
                        modes = new Set(['virtual', 'formula']),
                        recordId = 3;

                    if (ut.isDefined(appField.isReadOnly) && appField.isReadOnly) {
                        /** user definition overrides **/
                    } else {
                        if (modes.has(qbField.mode)) {
                            appField.isReadOnly = true;
                        }
                        if (systemFields.has(qbField.id)) {
                            appField.isReadOnly = true;
                            appField.isSystem = true;
                        }
                        if ((qbField.id == recordId) && (!qbField.properties.primaryKey)) {
                            /** record id is readOnly if it's not the key field for the table **/
                            appField.isReadOnly = true;
                        }
                    }
                }
                const isKey = (appField, qbField) => {
                    if (qbField.properties.primaryKey) {
                        appField.isKey = true;
                    }
                }
                const hasDefault = (appField, qbField) => {
                    let defaultValue = ut.isDefined(qbField.properties.defaultValue) ? qbField.properties.defaultValue : '',
                        hasDefault = defaultValue !== "";
                    appField.hasDefault = hasDefault;
                    if (hasDefault) {
                        appField.defaultValue = defaultValue;
                    }
                }
                const hasChoices = (appField, qbField) => {
                    if (ut.isDefined(qbField.properties.choices)) {
                        appField.hasChoices = true;
                        appField.choices = qbField.properties.choices;
                    }
                }
                const setLabel = (appField, qbField) => {
                    if (ut.isDefined(qbField.label) && !ut.isEmpty(qbField.label)) {
                        appField.hasLabel = true;
                        appField.label = qbField.label;
                    }
                }
                const setFieldType = (appField, qbField) => {
                    if (ut.isDefined(appField.fieldType) && !ut.isEmpty(appField.fieldType)) {
                        /** user definition overrides **/
                    } else {
                        appField.fieldType = qbField.fieldType;
                    }
                }
                const setFieldName = (appField, qbField) => {
                    if (ut.isDefined(appField.name) && !ut.isEmpty(appField.name)) {
                        /** user definition overrides **/
                    } else {
                        appField.name = ut.normalizeString(qbField.label);
                    }
                }
                //// debugger;
                setFieldName(appField, qbField);
                setFieldType(appField, qbField);
                setLabel(appField, qbField);
                hasChoices(appField, qbField);
                hasDefault(appField, qbField);
                isLookup(appField, qbField);
                isMultitext(appField, qbField);
                isDblink(appField, qbField);
                isFormula(appField, qbField);
                isReference(appField, qbField);
                isUnique(appField, qbField);
                isPredecessor(appField, qbField);
                isFile(appField, qbField);
                isUser(appField, qbField);
                isCheckBox(appField, qbField);
                isReadonly(appField, qbField);
                isKey(appField, qbField);

                appField.isVerified = true;
            };

            return (async function () {
                const
                    alias = view.alias.toLowerCase(),
                    table = qbProperties.tablesByAlias[alias],
                    dictionary = {all: [], byFid: {}, byName: {}},
                    clist = {all: [], writeable: []};

                view.fields.forEach(function (field) {
                    dictionary.all.push(field);
                    dictionary.byFid[field.id] = field;
                    dictionary.byName[field.name] = field;
                });

                if (appConfig.verifyFields) {
                    let qbFieldsResult = await getTableFields(table);

                    if (qbFieldsResult.status.ok) {
                        dictionary.all.forEach(function (field) {
                            let tableField = table.fieldsByFid[field.id];
                            if (ut.isDefined(tableField)) {
                                setFieldProperties(field, tableField)
                                if (!field.isReadOnly) {
                                    clist.writeable.push(field.id)
                                }
                                clist.all.push(field.id);
                            }
                            // debugger;
                        })
                    }
                } else {
                    dictionary.all.forEach(function (field) {
                        if (!field.isReadOnly) {
                            clist.writeable.push(field.id)
                        }
                        clist.all.push(field.id);
                    })
                }
                const writableClist = () => clist.writeable;
                const fullClist = () => clist.all;
                const fieldIdByName = (name) => {
                    // debugger;
                    let attr = dictionary.byName[name];
                    return ut.isDefined(attr) && ut.isDefined(attr.id) ? attr.id : null;
                }
                const fieldAttrByName = (name) => {
                    let attr = dictionary.byName[name];
                    return ut.isDefined(attr) ? attr : null;
                }
                const fieldAttrByID = (name) => {
                    let attr = dictionary.byFid[name];
                    return ut.isDefined(attr) ? attr : null;
                }

                function Row() {
                    return (function () {
                        let row = {};
                        Object.defineProperty(row, '_$QbErrors', {
                                enumerable: false,
                                configurable: false,
                                writable: false,
                                value: []
                            }
                        );
                        Object.defineProperty(row, 'hasQbErrors', {
                                enumerable: false,
                                configurable: false,
                                writable: false,
                                value: function () {
                                    return (row._$QbErrors.length > 0)
                                }
                            }
                        );
                        Object.defineProperty(row, 'getQbErrors', {
                                enumerable: false,
                                configurable: false,
                                writable: false,
                                value: function () {
                                    return row._$QbErrors
                                }
                            }
                        );
                        Object.defineProperty(row, 'setQbErrors', {
                                enumerable: false,
                                configurable: false,
                                writable: false,
                                value: function (val) {
                                    /** concat requires _$QbErrors to be writeable **/
                                    if (Array.isArray(val)) {
                                        val.forEach(function (ele) {
                                            row._$QbErrors.push(ele)
                                        })
                                    } else {
                                        row._$QbErrors.push(val)
                                    }
                                }
                            }
                        );

                        Object.defineProperty(row, '_$updateId', {
                                enumerable: false,
                                configurable: false,
                                writable: true
                            }
                        );
                        Object.defineProperty(row, 'getUpdateId', {
                                enumerable: false,
                                configurable: false,
                                writable: false,
                                value: function () {
                                    return row._$updateId
                                }
                            }
                        );
                        Object.defineProperty(row, 'setUpdateId', {
                                enumerable: false,
                                configurable: false,
                                writable: false,
                                value: function (val) {
                                    row._$updateId = val;
                                }
                            }
                        );
                        Object.keys(dictionary.byName).forEach(function (fieldName) {
                            let field = dictionary.byName[fieldName];
                            Object.defineProperty(row, fieldName, {
                                    enumerable: true,
                                    configurable: false,
                                    writable: true,
                                    value: field.hasDefault ? field.defaultValue : ''
                                }
                            );

                        })
                        return row;
                    })();

                }


                const fetchFile = async (userOptions) => {
                    let apiOptions = {
                            table: table.id
                        },
                        missingParams = [];

                    if (ut.isEmpty(userOptions.version)) {
                        userOptions.version = 0;
                    }
                    if (ut.isEmpty(userOptions.recordId)) {
                        missingParams.push('Record Id');
                    }
                    if (ut.isEmpty(userOptions.fieldId)) {
                        missingParams.push('Field Id');
                    }
                    if (missingParams.length === 0) {
                        apiOptions.recordId = userOptions.recordId;
                        apiOptions.fieldId = userOptions.fieldId;
                        apiOptions.version = userOptions.version;
                        return await downloadFile(apiOptions)
                    } else {
                        return {
                            ok: false,
                            code: 401,
                            description: 'Bad request - Missing: ' + missingParams.join(',') + '.'
                        }
                    }
                }

                const fetch = async (userOptions) => {
                    const formatSortBy = (sortFields) => {
                        let fields = Array.isArray(sortFields) ? sortFields : [],
                            sortOption = [];
                        if (ut.isDefined(sortFields)) {
                            fields.forEach(function (f) {
                                // debugger
                                let opt = {
                                    fieldId: fieldIdByName(f.field),
                                    /** order is case sensitive **/
                                    order: ut.isDefined(f.order) ? f.order.toUpperCase() : 'ASC'
                                }
                                sortOption.push(opt)
                            })
                        }
                        return sortOption;
                    }
                    let defaultOptions = {
                            from: table.id,
                            select: fullClist(),
                        },
                        apiOptions = Object.assign({}, defaultOptions, userOptions),
                        optionsLength = ut.isDefined(apiOptions.options) ? Object.keys(apiOptions.options) : 0;

                    if (ut.isDefined(userOptions.sortBy)) {
                        apiOptions.sortBy = formatSortBy(userOptions.sortBy);
                    }

                    // debugger;

                    if (ut.isDefined(apiOptions.sortBy) && apiOptions.sortBy.length === 0) {
                        delete apiOptions.sortBy;
                    }

                    if (ut.isDefined(apiOptions.groupBy) && apiOptions.groupBy.length === 0) {
                        delete apiOptions.groupBy;
                    }
                    if (optionsLength === 0) {
                        delete apiOptions.options;
                    }

                    // debugger;
                    let result = await queryTable(apiOptions)
                    if (result.status.ok) {
                        let records = result.data,
                            fields = result.fields,
                            metadata = result.metadata;
                        result.rows = [];

                        records.forEach(function (record) {
                            let row = new Row();
                            result.rows.push(row);
                            Object.keys(record).forEach(function (key) {
                                let field = record[key],
                                    fieldAttr = dictionary.byFid[key],
                                    fnFetch = getFnFetch(fieldAttr.fieldType)
                                // debugger;
                                row[fieldAttr.name] = fnFetch(field.value);
                            })
                        })

                        // debugger;
                    }


                    return result;


                }
                /**
                 *
                 * @param userOptions - userOptions can contain:
                 *      1) a where clause OR
                 *      2) an array of rows (uses record id not key field)
                 * @returns {Promise<void>}
                 */
                const destroy = async (userOptions) => {
                    let defaultOptions = {
                            from: table.id,
                            where: null,
                        },
                        keyFieldAttr = dictionary.byFid[table.keyFieldId],
                        recordIdAttr = dictionary.byFid[3],
                        kidName = keyFieldAttr.name,
                        ridName = recordIdAttr.name,
                        requests = [];

                    if (ut.isDefined(userOptions.where)) {
                        defaultOptions.where = userOptions.where
                        requests.push(defaultOptions)
                    } else {
                        if (ut.isDefined(userOptions.rows)) {
                            if (!Array.isArray(userOptions.rows)) {
                                userOptions.rows = [].concat(userOptions.rows);
                            }
                            for (const row of userOptions.rows) {
                                let keyField = ut.isDefined(row[kidName]) && !ut.isEmpty(row[kidName]) ? keyFieldAttr : recordIdAttr,
                                    recordKey = ut.isDefined(keyField) && !ut.isEmpty(row[keyField.name]) ? row[keyField.name] : null;
                                // debugger;
                                if (!ut.isNull(recordKey)) {
                                    let request = ut.clone(defaultOptions);
                                    request.where = '{' + keyField.id + '.EX."' + row[keyField.name] + '"}';
                                    requests.push(deleteRecords(request))
                                }
                            }
                        }
                    }
                    let result = {status: {ok: true}, deletedFieldIds: [], errors: []};

                    if (requests.length > 0) {
                        let results = await Promise.all(requests);
                        results.forEach(function (eachResult, idx) {
                            if (eachResult.status.ok) {
                                if (eachResult.numberDeleted > 0) {
                                    result.deletedFieldIds.push(userOptions.rows[idx][ridName])
                                } else {
                                    result.errors.push(userOptions.rows[idx][ridName])
                                }
                            }
                        })
                        // debugger;
                    }
                    return result;

                }
                const store = async (userRows = [], userOptions = {}) => {
                    try {
                        /** only available userOptions is mergeField **/
                        const formatRow = (row) => {
                            try {
                                let formattedRow = {};
                                Object.keys(row).forEach(function (key) {
                                    let val = row[key],
                                        fieldAttr = dictionary.byName[key],
                                        fnStore = getFnStore(fieldAttr.fieldType);
                                    if (writeable.has(fieldAttr.id)) {
                                        let rowValue = fnStore(val);
                                        if (ut.isEmpty(rowValue)) {
                                            rowValue = ''
                                        }
                                        ;
                                        formattedRow[fieldAttr.id] = {value: rowValue};
                                    }
                                })
                                return formattedRow;
                            } catch (err) {
                                console.log('qbModel.store.formatRow err:' + err)
                            }
                        }
                        const parseRow = (row, update) => {
                            Object.keys(update).forEach(function (key) {
                                let val = update[key].value,
                                    fieldAttr = dictionary.byFid[key],
                                    fnFetch = getFnFetch(fieldAttr.fieldType);

                                row[fieldAttr.name] = fnFetch(val);
                            })
                        }
                        const setRowErrors = (rows, metadata) => {
                            const lineErrors = ut.isDefined(metadata) && ut.isDefined(metadata.lineErrors)
                                ? metadata.lineErrors : {};
                            // debugger;
                            Object.keys(lineErrors).forEach(function (key) {
                                let rowIdx = parseInt(key) - 1,
                                    row = rows[rowIdx];
                                if (ut.isDefined(row)) {
                                    row.setQbErrors(lineErrors[key]);
                                }
                            })
                        }
                        // debugger;
                        let writeable = new Set(writableClist()),
                            body = {
                                to: table.id,
                                fieldsToReturn: fullClist(),
                                data: []
                            },
                            rows = Array.isArray(userRows) ? userRows : [userRows];
                        if (ut.isDefined(userOptions.mergeField)) {
                            body.mergeFieldId = fieldIdByName(userOptions.mergeField);
                        }
                        rows.forEach(function (row) {
                            body.data.push(formatRow(row))
                        })
                        // debugger;
                        let result = await updateTable(body);

                        if (result.status.ok) {
                            setRowErrors(rows, result.metadata);

                            let dataIdx = 0;
                            rows.forEach(function (row) {
                                if (!row.hasQbErrors()) {
                                    let record = result.data[dataIdx];
                                    parseRow(row, record)
                                    dataIdx += 1;
                                }
                            })

                            result.rows = rows;
                        }
                        // debugger;
                        return result;
                    } catch (err){
                        console.log('qbmodel.row.store: ' + err)
                        debugger;
                    }
                }
                return {
                    fieldIdByName: fieldIdByName,
                    fieldAttrByName: fieldAttrByName,
                    fieldAttrByID: fieldAttrByID,
                    writableClist: writableClist,
                    fieldsToReturn: fullClist,
                    store: store,
                    fetch: fetch,
                    delete: destroy,
                    fetchFile: fetchFile,
                    Row: Row
                }
            })()


        }


        setAppDefaults(appConfig);
        // debugger;
        let [appResult, tableResult] = await Promise.all([getApp(), getAppTables()]);

        // debugger;
        let app = {
            defaults: {dateFormat: qbProperties.config.dateFormat},
            getAppTable: getAppTable
        }
        // debugger;
        if (appResult.status.ok && tableResult.status.ok) {
            let viewBuilds = [],
                appViews = [],
                viewKeys = [];
            views.forEach(function (view) {
                viewKeys.push(view.name);
                viewBuilds.push(buildView(view))
            })

            appViews = await Promise.all(viewBuilds);

            viewKeys.forEach(function (key, idx) {
                app[key] = appViews[idx];
            })
            // debugger;
        } else {
            throw('Initialization error')
        }

        // debugger;
        return app;


    }())
}

if (typeof exports !== 'undefined') {
    module.exports.qbModel = quickBaseModel;

} else {
    var qbModel = quickBaseModel;
}