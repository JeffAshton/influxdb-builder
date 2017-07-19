'use strict';

const _ = require( 'lodash' );
const parseDuration = require( 'parse-duration' );

const continuousQueryFormatter = require( './continuousQueryFormatter.js' );

const InfluxDbChangePlan = require( './InfluxDbChangePlan.js' ).InfluxDbChangePlan;
const ResourcePlan = require( './InfluxDbChangePlan.js' ).ResourcePlan;

function createResourcePlan( action, opts ) {

	const invalidOpts = _.omit( opts, [ 'source', 'target', 'definition' ] );
	if( invalidOpts.length > 0 ) {
		throw new Error( `Invalid options: ${ JSON.stringify( invalidOpts ) }` );
	}

	return new ResourcePlan( action, opts.source, opts.target, opts.definition );
}

function compareContinuousQueries( databaseName, source, target ) {

	const diff = [];

	_.forEach( source, ( sourceQuery, name ) => {

		if( !target[ name ] ) {
			diff.push( createResourcePlan( 'drop', { source: sourceQuery } ) );
		}
	} );

	_.forEach( target, ( targetQuery, name ) => {

		const targetCreateStatement = continuousQueryFormatter( databaseName, targetQuery );

		const planTarget = {
			name: targetQuery.name,
			query: targetCreateStatement,
		};

		const sourceQuery = source[ name ];
		if( sourceQuery ) {

			const sourceCreateStatement = sourceQuery.query;
			if( targetCreateStatement !== sourceCreateStatement ) {

				diff.push( createResourcePlan( 'alter', {
					source: sourceQuery,
					target: planTarget,
					definition: targetQuery
				} ) );
			}

		} else {
			diff.push( createResourcePlan( 'create', {
				target: planTarget,
				definition: targetQuery
			} ) );
		}
	} );

	return diff;
}

function compareRetentionPolicies( source, target ) {

	const diff = [];

	_.forEach( source, ( sourcePolicy, name ) => {

		if( !target[ name ] ) {
			diff.push( createResourcePlan( 'drop', { source: sourcePolicy } ) );
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

				diff.push( createResourcePlan( 'alter', {
					source: sourcePolicy,
					target: targetPolicy,
					definition: targetPolicy
				} ) );
			}

		} else {

			diff.push( createResourcePlan( 'create', {
				target: targetPolicy,
				definition: targetPolicy
			} ) );
		}
	} );

	return diff;
}

module.exports = function( databaseName, source, target ) {

	const databases = [];
	if( !source ) {

		const defaultRetentionPolicy = _.find(
			_.values( target.retentionPolicies ),
			policy => policy.default
		);

		const definition = {
			name: databaseName,
			retentionPolicy: defaultRetentionPolicy
		};

		databases.push( createResourcePlan( 'create', {
			target: definition,
			definition: definition
		} ) );
	}

	const continuousQueries = compareContinuousQueries(
		databaseName,
		source && source.continuousQueries || [],
		target.continuousQueries
	);

	const retentionPolicies = compareRetentionPolicies(
		source && source.retentionPolicies || [],
		target.retentionPolicies
	);

	return new InfluxDbChangePlan(
		databases,
		continuousQueries,
		retentionPolicies
	);
};
