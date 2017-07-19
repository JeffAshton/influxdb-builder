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

function readInfluxDatabase( influx, databaseName ) {

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

	return Promise
		.props( {
			continuousQueries: continuousQueriesP,
			retentionPolicies: retentionPoliciesP
		} )
		.then( database => {

			const sorted = sortKeys( database, { deep: true } );
			return sorted;
		} );
}

module.exports = function( influx, databaseName ) {

	return influx
		.showDatabases()
		.then( databases => {

			const exists = _.find( databases, { name: databaseName } );
			if( !exists ) {
				return Promise.resolve( null );
			}

			return readInfluxDatabase( influx, databaseName );
		} );
};
