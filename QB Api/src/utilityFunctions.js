if (typeof exports !== 'undefined') {
    var {DateTime} = require('luxon'),
        logger = require('./logger');
}
/** Prototype updates and utility functions **/
String.prototype._trim = function () {
    let s1 = this.replace(/(^\s*)|(\s*$)/g, '').replace(/\s{2,}/g, ' ');
    return s1;
}
String.prototype._align = function (len, lr, _pad) {
    let align_left = lr !== undefined && (/^left/i.test(lr) || /^l/i.test(lr)) ? true : false,
        s1 = this._trim(),
        pad = (_pad && _pad.toLowerCase) ? _pad : ' ';
    s1 = align_left ? s1 + Array((len - s1.length) + 1).join(pad) : Array((len - s1.length) + 1).join(pad) + s1;
    return s1;
}
const utl = (function () {

    const log = (moduleName, error, level) => {
        let logLevel = /^err/i.test(level) ? 'error' : 'info';
        let errString = isString(error) ? error : JSON.stringify(error);
        if (logLevel === 'error') {
            debugger;
        }
        if (isDefined(logger) && isFunction(logger[logLevel])) {
            logger[logLevel](errString, moduleName);
        } else {
            console.log("Logger not found ****")
        }
        console.log(moduleName + ' : ' + errString + level);
    }
    const base64ArrayBuffer = (arrayBuffer) => {
        var base64 = ''
        var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

        var bytes = new Uint8Array(arrayBuffer)
        var byteLength = bytes.byteLength
        var byteRemainder = byteLength % 3
        var mainLength = byteLength - byteRemainder

        var a, b, c, d
        var chunk

        // Main loop deals with bytes in chunks of 3
        for (var i = 0; i < mainLength; i = i + 3) {
            // Combine the three bytes into a single integer
            chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

            // Use bitmasks to extract 6-bit segments from the triplet
            a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
            b = (chunk & 258048) >> 12 // 258048   = (2^6 - 1) << 12
            c = (chunk & 4032) >> 6 // 4032     = (2^6 - 1) << 6
            d = chunk & 63               // 63       = 2^6 - 1

            // Convert the raw binary segments to the appropriate ASCII encoding
            base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
        }

        // Deal with the remaining bytes and padding
        if (byteRemainder == 1) {
            chunk = bytes[mainLength]

            a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

            // Set the 4 least significant bits to zero
            b = (chunk & 3) << 4 // 3   = 2^2 - 1

            base64 += encodings[a] + encodings[b] + '=='
        } else if (byteRemainder == 2) {
            chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

            a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
            b = (chunk & 1008) >> 4 // 1008  = (2^6 - 1) << 4

            // Set the 2 least significant bits to zero
            c = (chunk & 15) << 2 // 15    = 2^4 - 1

            base64 += encodings[a] + encodings[b] + encodings[c] + '='
        }

        return base64
    }
    /**
     * DateTime: values {empty: "", "2020-10-21T21:02:59Z" (regardless of time zone in app)}
     * The string representation of the date and time, in ISO 8601 format.
     * We will return data in the format YYYY-MM-DDThh:mm:ssZ, where ‘Z' indicates UTC.
     * When you are uploading data, we accept an optional .sss after the seconds, and the time zone indicator is optional: we accept ‘Z’ to indicate UTC, we accept +hh:mm and -hh:mm to indicate deviations from UTC, and
     * if you omit the time zone indicator we will interpret the time in the application’s default time zone.
     * Other acceptable keywords are today and now.
     *
     * Date: values {empty: "", valid: "2020-10-21" (regardless of app format)  }
     * The string representation of the date in YYYY-MM-DD format, aligned with ISO 8601 standards.
     * Other acceptable keywords are today, N day(s) from now and N day(s) ago.
     **/
    const formatDateTime = (date, zone) => {
        if (isDefined(zone)) {
            return date.toISO({zone: zone})
        } else {
            return date.toISO()

        }
    }

    const formatDate = (date, zone) => {
        if (isDefined(zone)) {
            return date.toISODate({zone: zone})
        } else {
            return date.toISODate()

        }
    }
    const toDateTime = (date, zone) => {
       // debugger;
        if (isEmpty(date)){
            return null;
        }
        if (DateTime.isDateTime(date)) {
            return cloneDate(date, zone)
        }
        if (date instanceof Date) {
            return DateTime.fromJSDate(date)
        }
        if (isString(date)) {
            if (isDefined(zone)) {
                return DateTime.fromISO(date, {zone: zone})
            }
            return DateTime.fromISO(date)

        }
        return null

    }
    const cloneDate = (date, zone) => {

        let dateTime = formatDateTime(date, zone);
        if (isDefined(zone)) {
            return DateTime.fromISO(DateTime.fromISO(dateTime, {zone: zone}))

        } else {
            return DateTime.fromISO(DateTime.fromISO(dateTime))
        }
        return null;
    }


    /**
     * Performs a deep merge of objects and returns new object. Does not modify
     * objects (immutable) and merges arrays via concatenation.
     * source: https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
     * @param {...object} objects - Objects to merge
     * @returns {object} New object with merged key/values
     *
     * example let obj3 = mergeObjects(obj1,obj2);
     */
    const mergeObjects = (...objects) => {
        // const isObject = obj => obj && typeof obj === 'object';

        return objects.reduce((prev, obj) => {
            Object.keys(obj).forEach(key => {
                const pVal = prev[key];
                const oVal = obj[key];

                if (Array.isArray(pVal) && Array.isArray(oVal)) {
                    prev[key] = pVal.concat(...oVal);
                } else if (isObject(pVal) && isObject(oVal)) {
                    prev[key] = mergeObjects(pVal, oVal);
                } else {
                    prev[key] = oVal;
                }
            });

            return prev;
        }, {});
    }
    const isObject = obj => obj && typeof obj === 'object';
    const isNumeric = (obj) => {
        // from jquery
        // parseFloat NaNs numeric-cast false positives (null|true|false|"")
        // ...but misinterprets leading-number strings, particularly hex literals ("0x...")
        // subtraction forces infinities to NaN
        // adding 1 corrects loss of precision from parseFloat (#15100)
        return !Array.isArray(obj) && (obj - parseFloat(obj) + 1) >= 0;
    }
    const isNull = (obj) => {
        return (obj === null)
    }

    const isDefined = (obj) => {
        return (typeof obj !== 'undefined')
    }
    const isUndefined = (obj) => {
        return (typeof obj === 'undefined')
    }

    const isString = (obj) => {
        return (typeof obj === 'string')
    }

    const isFunction = (obj) => {
        return (isDefined(obj) && typeof obj === 'function')
    }
    const isTrue = (obj) => {
        return (obj === true || obj === '1' || obj === 1)
    }
    const isFalse = (obj) => {
        return (obj === false || obj === '0' || obj === 0)
    }
    const isEmptyObject = (obj) => {
        // debugger;
        return (isObject(obj) && (Object.keys(obj).length === 0))
    }
    const isEmptyArray = (obj) => {
        // debugger;
        return (Array.isArray(obj) && obj.length === 0)
    }
    const isEmpty = (obj) => {
        return (!isDefined(obj) || isNull(obj) || isBlank(obj) || isEmptyObject(obj) || isEmptyArray(obj))
    }

    const isBlank = (obj) => {
        if (typeof obj !== 'string') {
            return false;
        }
        return (obj.trim().length === 0);
    }
    const compareNumeric = (a, b) => {
        let x = new Number(a),
            y = new Number(b);

        return x - y;
    }
    const compareStrings = (str1, str2) => {
        let len = Math.max(str1.length, str2.length),
            s1 = (str1.toLowerCase().replace(/(^\s*)|(\s*$)/gi, '').replace(/\s+/g, ' '))._align(len, 'l', ' '),
            s2 = (str2.toLowerCase().replace(/(^\s*)|(\s*$)/gi, '').replace(/\s+/g, ' '))._align(len, 'l', ' ');
        return s1 === s2 ? 0 : (s1 <= s2 ? -1 : 1);
    }
    const normalizeString = (str) => {
        if (typeof str !== 'string') {
            return str;
        }
        return str.toLowerCase()
            .replace(/([^a-z0-9])/g, ' ')
            .replace(/(^\s*)|(\s*$)/gi, '')
            .replace(/\s+/g, ' ')
            .replace(/ /g, '_');
    }
    const clone = (obj) => {
        return (JSON.parse(JSON.stringify(obj)));
    }
    const getUrlParameters = () => {
        // usage  let x = urlParams.get('xxxx'),
        return new URLSearchParams(window.location.search);
    }

    return {
        isNumeric: isNumeric,
        isObject: isObject,
        isEmptyObject: isEmptyObject,
        isNull: isNull,
        isString: isString,
        isUndefined: isUndefined,
        isFalse: isFalse,
        isEmpty: isEmpty,
        isEmptyArray: isEmptyArray,
        isDefined: isDefined,
        isFunction: isFunction,
        isTrue: isTrue,
        isBlank: isBlank,
        compareNumeric: compareNumeric,
        compareStrings: compareStrings,
        cloneDate: cloneDate,
        toDateTime:toDateTime,
        formatDate:formatDate,
        formatDateTime:formatDateTime,
        normalizeString: normalizeString,
        clone: clone,
        mergeObjects: mergeObjects,
        getUrlParameters: getUrlParameters,
        base64ArrayBuffer: base64ArrayBuffer,
        log: log
    }

})();

if (typeof exports !== 'undefined') {
    module.exports.ut = utl;
} else {
    var ut = utl;
}