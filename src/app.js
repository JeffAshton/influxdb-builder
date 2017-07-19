'use strict';

const Promise = require( 'bluebird' );

const influxDbChangeApplier = require( './influxDbChangeApplier.js' );
const influxDbChangePlanner = require( './influxDbChangePlanner.js' );
const influxDbReader = require( './influxDbReader.js' );

const log = require( './log.js' );
const ymlDefinitionReader = require( './ymlDefinitionReader.js' );

function buildPlan( influx, databaseName, definitionPath ) {

	return Promise
		.all( [
			ymlDefinitionReader( definitionPath, { database: databaseName } ),
			influxDbReader( influx, databaseName )
		] )
		.spread( ( definition, database ) => {

			const plan = influxDbChangePlanner( databaseName, database, definition );
			return plan;
		} );
}

function handlePlan( influx, databaseName, plan, apply ) {

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

module.exports = function( args ) {

	const influx = args.influx;
	const databaseName = args.databaseName;
	const definitionPath = args.definitionPath;
	const apply = args.apply;

	return buildPlan( influx, databaseName, definitionPath )
		.then( plan => {
			return handlePlan( influx, databaseName, plan, apply );
		} )
		.catch( err => {
			log.error( err );
			return -10;
		} );
};
