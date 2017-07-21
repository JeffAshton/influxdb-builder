'use strict';

const _ = require( 'lodash' );
const Promise = require( 'bluebird' );

const InfluxClient = require( './InfluxClient.js' );
const log = require( './log.js' );
const ymlDefinitionReader = require( './ymlDefinitionReader.js' );

const influx = new InfluxClient( 'http://localhost:8086' );
const databaseName = 'buses';

ymlDefinitionReader( 'example' )
	.then( definition => {

		return influx
			.createDatabaseAsync( databaseName )
			.then( () => {
				log.info( { name: databaseName }, 'Created database' );
			} )
			.then( () => {

				const retentionPolicies = _.values( definition.retentionPolicies );

				return Promise.map(
					retentionPolicies,
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

				const continuousQueries = _.values( definition.continuousQueries );

				return Promise.map(
					continuousQueries,
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
	} );
