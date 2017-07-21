'use strict';

const _ = require( 'lodash' );
const log = require( './log.js' );
const Promise = require( 'bluebird' );

function applyDatabasePlans( influx, plans ) {

	if( !plans ) {
		return Promise.resolve();
	}

	return Promise.map(
		plans,
		plan => {

			switch( plan.action ) {

				case 'create': {

					const database = plan.definition;

					return influx
						.createDatabase( database )
						.then( () => {
							log.info( { database }, 'Created database' );
						} );
				}

				default:
					throw new Error( `Unsupported database plan action: ${ plan.action }` );
			}
		},
		{ concurrency: 1 }
	);
}

function applyRetentionPolicyPlans( influx, databaseName, plans ) {

	if( !plans ) {
		return Promise.resolve();
	}

	// ensure the default retention policy is acted on first
	const sortedPlans = _.sortBy( plans, plan => {

		if( plan.target && plan.target.default ) {
			return 0;
		}

		return 1;
	} );

	return Promise.map(
		sortedPlans,
		plan => {

			switch( plan.action ) {

				case 'drop': {

					const retentionPolicy = plan.source;

					return influx
						.dropRetentionPolicy( databaseName, retentionPolicy.name )
						.then( () => {
							log.info( { retentionPolicy }, 'Dropped retention policy' );
						} );
				}

				case 'alter': {

					const retentionPolicy = plan.definition;

					return influx.alterRetentionPolicy( databaseName, retentionPolicy )
						.then( () => {
							log.info( { retentionPolicy }, 'Altered retention policy' );
						} );
				}

				case 'create': {

					const retentionPolicy = plan.definition;

					return influx
						.createRetentionPolicy( databaseName, retentionPolicy )
						.then( () => {
							log.info( { retentionPolicy }, 'Created retention policy' );
						} );
				}

				default:
					throw new Error( `Unsupported retention policy plan action: ${ plan.action }` );
			}
		},
		{ concurrency: 1 }
	);
}

function applyContinuousQueryPlans( influx, databaseName, plans ) {

	if( !plans ) {
		return Promise.resolve();
	}

	return Promise.map(
		plans,
		plan => {

			switch( plan.action ) {

				case 'drop': {

					const continusousQuery = plan.source;

					return influx
						.dropContinuousQuery( databaseName, continusousQuery.name )
						.then( () => {
							log.info( { continusousQuery }, 'Dropped continuous query' );
						} );
				}

				case 'alter': {

					const continusousQuery = plan.definition;

					return influx
						.dropContinuousQuery( databaseName, continusousQuery.name )
						.then( () => {

							return influx
								.createContinuousQuery( databaseName, continusousQuery )
								.then( () => {
									log.info( { continusousQuery }, 'Altered continuous query' );
								} );
						} );
				}

				case 'create': {

					const continusousQuery = plan.definition;

					return influx
						.createContinuousQuery( databaseName, continusousQuery )
						.then( () => {
							log.info( { continusousQuery }, 'Created continuous query' );
						} );
				}

				default:
					throw new Error( `Unsupported continuous query plan action: ${ plan.action }` );
			}
		},
		{ concurrency: 1 }
	);
}

module.exports = function( influx, databaseName, plan ) {

	return applyDatabasePlans( influx, plan.databases )
		.then( () => applyRetentionPolicyPlans( influx, databaseName, plan.retentionPolicies ) )
		.then( () => applyContinuousQueryPlans( influx, databaseName, plan.continuousQueries ) );
};
