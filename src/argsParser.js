'use strict';

const EOL = require( 'os' ).EOL;
const yanop = require( 'yanop' );
const InfluxClient = require( './InfluxClient.js' );

const spec = {
	influxUrl: {
		description: 'The url to the influx database',
		required: true,
		type: yanop.scalar
	},
	username: {
		default: null,
		description: 'The influx administrator username',
		required: false,
		type: yanop.scalar
	},
	password: {
		default: null,
		description: 'The influx administrator password',
		required: false,
		type: yanop.scalar
	},
	database: {
		description: 'The name of the database to build',
		required: true,
		type: yanop.scalar
	},
	definition: {
		description: 'The path to the database definition (yml file or directory of yml files)',
		required: true,
		type: yanop.scalar
	},
	apply: {
		default: false,
		description: 'If specified the database will be updated, otherwise, a plan is only generated',
		required: false,
		type: yanop.flag
	}
};

module.exports = function( argv ) {

	if( argv.length <= 2 || argv[ 2 ] === '--help' ) {

		const help = yanop.help( spec );
		console.info( `Usage: influxdb-builder <options>${ EOL }${ EOL }${ help }` );
		return null;
	}

	const args = yanop.simple( spec, argv );

	const username = args.username || process.env.INFLUXDB_BUILDER_USERNAME;
	const password = args.username || process.env.INFLUXDB_BUILDER_PASSWORD;

	return {
		influx: new InfluxClient( args.influxUrl, username, password ),
		databaseName: args.database,
		definitionPath: args.definition,
		apply: args.apply
	};
};
