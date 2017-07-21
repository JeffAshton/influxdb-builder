'use strict';

const Promise = require( 'bluebird' );

const InfluxClient = require( './InfluxClient.js' );
const influxDbChangeApplier = require( './influxDbChangeApplier.js' );
const influxDbChangePlanner = require( './influxDbChangePlanner.js' );
const influxDbReader = require( './influxDbReader.js' );

const log = require( './log.js' );
const ymlDefinitionReader = require( './ymlDefinitionReader.js' );

const influx = new InfluxClient( 'http://localhost:8086' );
const databaseName = 'buses';
const apply = true;

function handlePlan( plan ) {

	if( !plan.hasChanges ) {

		log.info( 'Database is up to date' );
		return Promise.resolve( 0 );
	}

	if( !apply ) {
		log.info( { plan }, 'Generated plan' );
		return Promise.resolve( plan.countChanges() );
	}

	log.info( { plan }, 'Applying plan' );
	return influxDbChangeApplier( influx, databaseName, plan )
		.then( () => {
			return Promise.resolve( 0 );
		} );
}

Promise
	.all( [
		ymlDefinitionReader( 'example', { database: databaseName } ),
		influxDbReader( influx, databaseName )
	] )
	.spread( ( definition, database ) => {

		const plan = influxDbChangePlanner( databaseName, database, definition );
		return handlePlan( plan );
	} )
	.then( exitCode => {
		process.exit( exitCode ); // eslint-disable-line no-process-exit
	} )
	.catch( err => {
		log.error( err );
		process.exit( -10 ); // eslint-disable-line no-process-exit
	} );
