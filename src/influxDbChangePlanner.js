'use strict';

const _ = require( 'lodash' );
const parseDuration = require( 'parse-duration' );

const continuousQueryFormatter = require( './continuousQueryFormatter.js' );

function compareContinuousQueries( databaseName, source, target ) {

	const diff = [];

	_.forEach( source, ( sourceQuery, name ) => {

		if( !target[ name ] ) {

			diff.push( {
				action: 'drop',
				source: sourceQuery
			} );
		}
	} );

	_.forEach( target, ( targetQuery, name ) => {

		const sourceQuery = source[ name ];
		if( sourceQuery ) {

			const targetCreateStatement = continuousQueryFormatter( databaseName, targetQuery );
			const sourceCreateStatement = sourceQuery.query;

			if( targetCreateStatement !== sourceCreateStatement ) {

				diff.push( {
					action: 'alter',
					source: sourceQuery,
					target: {
						name: targetQuery.name,
						query: targetCreateStatement
					}
				} );
			}

		} else {

			diff.push( {
				action: 'create',
				target: targetQuery
			} );
		}
	} );

	return diff;
}

function compareRetentionPolicies( source, target ) {

	const diff = [];

	_.forEach( source, ( sourcePolicy, name ) => {

		if( !target[ name ] ) {

			diff.push( {
				action: 'drop',
				source: sourcePolicy
			} );
		}
	} );

	_.forEach( target, ( targetPolicy, name ) => {

		const sourcePolicy = source[ name ];
		if( sourcePolicy ) {

			const match = _.every( _.keys( targetPolicy ), key => {

				switch( key ) {

					case 'duration':
					case 'shard_duration':
						const targetDuration = parseDuration( targetPolicy[ key ] );
						const sourceDuration = parseDuration( sourcePolicy[ key ] );
						return targetDuration === sourceDuration;

					default:
						return targetPolicy[ key ] === sourcePolicy[ key ];
				}
			} );

			if( !match ) {

				diff.push( {
					action: 'alter',
					source: sourcePolicy,
					target: targetPolicy
				} );
			}

		} else {

			diff.push( {
				action: 'create',
				target: targetPolicy
			} );
		}
	} );

	return diff;
}

module.exports = function( databaseName, source, target ) {

	const continuousQueries = compareContinuousQueries( databaseName, source.continuousQueries, target.continuousQueries );
	const retentionPolicies = compareRetentionPolicies( source.retentionPolicies, target.retentionPolicies );

	return { continuousQueries, retentionPolicies };
};
