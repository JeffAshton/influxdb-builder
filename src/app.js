'use strict';

const Promise = require( 'bluebird' );

const InfluxClient = require( './InfluxClient.js' );
const influxDbChangePlanner = require( './influxDbChangePlanner.js' );
const influxDbReader = require( './influxDbReader.js' );

const log = require( './log.js' );
const ymlDefinitionReader = require( './ymlDefinitionReader.js' );

const influx = new InfluxClient( 'http://localhost:8086' );
const databaseName = 'buses';

Promise
	.all( [
		ymlDefinitionReader( 'example', { database: databaseName } ),
		influxDbReader( influx, databaseName )
	] )
	.spread( ( definition, database ) => {

		const plan = influxDbChangePlanner( databaseName, database, definition );
		log.info( { plan }, 'Generated plan' );

		process.exit( 0 ); // eslint-disable-line no-process-exit
	} )
	.catch( err => {
		log.error( err );
		process.exit( 100 ); // eslint-disable-line no-process-exit
	} );
