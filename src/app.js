'use strict';

const _ = require( 'lodash' );
const fs = require( 'fs' );
const jsyaml = require( 'js-yaml' );
const Promise = require( 'bluebird' );

const InfluxClient = require( './InfluxClient.js' );
const log = require( './log.js' );

const yml = fs.readFileSync( './example/resources.yml', 'utf8' );
const definition = jsyaml.safeLoad( yml );

const flattenedDefinition = {};

flattenedDefinition.retentionPolicies = _.map( definition.retention_policies, ( value, key ) => {
	value.name = key;
	return value;
} );

flattenedDefinition.continuousQueries = _.map( definition.continuous_queries, ( value, key ) => {
	value.name = key;
	return value;
} );

const influx = new InfluxClient( 'http://localhost:8086' );

const databaseName = 'buses';
influx
	.createDatabaseAsync( databaseName )
	.then( () => {
		log.info( { name: databaseName }, 'Created database' );
	} )
	.then( () => {
		return Promise.map(
			flattenedDefinition.retentionPolicies,
			retentionPolicy => {

				return influx.createRetentionPolicyAsync( databaseName, retentionPolicy )
					.then( () => {
						log.info( { database: databaseName, retentionPolicy }, 'Created retention policy' );
					} );
			},
			{ concurrency: 1 }
		);
	} )
	.then( () => {
		return Promise.map(
			flattenedDefinition.continuousQueries,
			continusousQuery => {

				return influx.createContinuousQueryAsync( databaseName, continusousQuery )
					.then( () => {
						log.info( { database: databaseName, continusousQuery }, 'Created continuous query' );
					} );
			},
			{ concurrency: 1 }
		);
	} )
	.then( () => {
		process.exit( 0 ); // eslint-disable-line no-process-exit
	} )
	.catch( err => {
		log.error( err );
		process.exit( 100 ); // eslint-disable-line no-process-exit
	} );
