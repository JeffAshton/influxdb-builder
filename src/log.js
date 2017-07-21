'use strict';

const bunyan = require( 'bunyan' );

function classLogger( obj ) {
	return obj.toLog();
}

const log = bunyan.createLogger( {
	name: 'influxdb-builder',
	level: process.env.LOG_LEVEL || 'INFO', // eslint-disable-line no-process-env
	serializers: {
		plan: classLogger
	}
} );

module.exports = log;
