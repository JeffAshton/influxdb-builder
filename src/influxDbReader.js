'use strict';

const _ = require( 'lodash' );
const Promise = require( 'bluebird' );
const sortKeys = require( 'sort-keys' );

/*
	Remap the fields:
		name
		default
		duration
		replicaN
		shardGroupDuration
	to:
		name
		default
		duration
		replication
		shard_duration
*/
function remapRetentionPolicyFields( retentionPolicy ) {

	return _.mapKeys( retentionPolicy, ( value, key ) => {
		switch( key ) {
			case 'replicaN': return 'replication';
			case 'shardGroupDuration': return 'shard_duration';
			default: return key;
		}
	} );
}

module.exports = function( influx, databaseName ) {

	return influx
		.showDatabases()
		.then( databases => {

			const database = _.find( databases, { name: databaseName } );
			if( !database ) {

				return {
					continuousQueries: {},
					retentionPolicies: {}
				};
			}

			const continuousQueriesP = influx
				.showContinuousQueries( databaseName )
				.then( queries => {
					return _.keyBy( queries, 'name' );
				} );

			const retentionPoliciesP = influx
				.showRetentionPolicies( databaseName )
				.then( policies => {

					const remappedPolicies = _.map( policies, remapRetentionPolicyFields );
					return _.keyBy( remappedPolicies, 'name' );
				} );

			return Promise.props( {
				continuousQueries: continuousQueriesP,
				retentionPolicies: retentionPoliciesP
			} );
		} )
		.then( database => {

			const sorted = sortKeys( database, { deep: true } );
			return sorted;
		} );
};
