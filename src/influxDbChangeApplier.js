'use strict';

const _ = require( 'lodash' );
const log = require( './log.js' );

module.exports = function( influx, databaseName, plan ) {

	return influx
		.createDatabaseAsync( databaseName )
		.then( () => {
			log.info( { name: databaseName }, 'Created database' );
		} )
		.then( () => {

			return Promise.map(
				plan.retentionPolicies,
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

			const continuousQueries = _.values( plan.continuousQueries );

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
		} );

};
