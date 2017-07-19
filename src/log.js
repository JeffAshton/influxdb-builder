'use strict';

const bunyan = require( 'bunyan' );

const log = bunyan.createLogger( {
	name: 'influxdb-builder',
	level: process.env.LOG_LEVEL || 'INFO'
} );

module.exports = log;
