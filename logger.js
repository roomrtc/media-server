'use strict';
// import lib.
const debug = require('debug');

// string const.
const APP_NAME = 'RoomRTC';

class Logger {
    constructor(prefix) {
        let MODULE_NAME = (prefix && `: ${prefix}`) || '';
        for (let level of ['info', 'warn', 'error']) {
            let LEVEL = level.toUpperCase();
            this[level] = console[level].bind(console, `${APP_NAME} ${MODULE_NAME} [ ${LEVEL} ]`);
        }
    }
}

module.exports = (prefix) => {
    return new Logger(prefix);
}