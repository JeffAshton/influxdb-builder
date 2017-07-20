'use strict';

const bunyan = require( 'bunyan' );

const log = bunyan.createLogger( {
	name: 'influxdb-builder',
	level: process.env.LOG_LEVEL || 'INFO' // eslint-disable-line no-process-env
} );

module.exports = log;
