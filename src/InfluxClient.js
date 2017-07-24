'use strict';

const _ = require( 'lodash' );
const rp = require( 'request-promise' );

const continuousQueryFormatter = require( './continuousQueryFormatter.js' );
const log = require( './log.js' );

function getFirstResult( response ) {

	if( response.error ) {
		throw new Error( response.error );
	}

	if( !response.results ) {
		throw new Error( 'query returned no results' );
	}

	const result = response.results[ 0 ];
	if( result.error ) {
		throw new Error( result.error );
	}

	return result;
}

function expandSeries( series ) {

	return _.map( series.values, valueArray => {

		const item = {};

		_.forEach( valueArray, ( value, index ) => {
			item[ series.columns[ index ] ] = value;
		} );

		return item;
	} );
}

function formatRetentionPolicyStatement( databaseName, retentionPolicy, action ) {

	let statement = `${ action } RETENTION POLICY "${ retentionPolicy.name }"`
		+ ` ON "${ databaseName }"`
		+ ` DURATION ${ retentionPolicy.duration }`
		+ ` REPLICATION ${ retentionPolicy.replication }`;

	const shardDuration = retentionPolicy.shard_duration;
	if( shardDuration ) {
		statement += ` SHARD DURATION ${ shardDuration }`;
	}

	if( retentionPolicy.default === true ) {
		statement += ' DEFAULT';
	}

	return statement;
}

class InfluxClient {

	constructor( url, username, password ) {

		const auth = ( username && password )
			? {
				user: username,
				pass: password
			}
			: null;

		const client = rp.defaults( {
			baseUrl: url,
			url: '/query',
			auth,
			json: true
		} );

		this._get = function( statement ) {
			log.debug( { query: statement }, 'Executing GET query' );
			return client
				.get( {
					qs: { q: statement }
				} )
				.then( response => {
					return getFirstResult( response );
				} );
		};

		this._post = function( statement ) {
			log.debug( { query: statement }, 'Executing POST query' );
			return client
				.post( {
					qs: { q: statement }
				} )
				.then( response => {
					return getFirstResult( response );
				} );
		};
	}

	showDatabases() {

		const statement = 'SHOW DATABASES';
		return this
			._get( statement )
			.then( result => {

				const series = result.series[ 0 ];
				return expandSeries( series );
			} );
	}

	showRetentionPolicies( databaseName ) {

		const statement = `SHOW RETENTION POLICIES ON "${ databaseName }"`;
		return this
			._get( statement )
			.then( result => {

				const series = result.series[ 0 ];
				return expandSeries( series );
			} );
	}

	showContinuousQueries( databaseName ) {

		const statement = 'SHOW CONTINUOUS QUERIES';
		return this
			._get( statement )
			.then( result => {

				const series = _.find( result.series, s => s.name === databaseName );
				if( !series ) {
					throw new Error( `database not found: ${ databaseName }` );
				}

				return expandSeries( series );
			} );
	}

	createDatabase( database ) {

		const retentionPolicy = database.retentionPolicy;

		const statement = `CREATE DATABASE "${ database.name }"`
			+ ' WITH'
			+ ` DURATION ${ retentionPolicy.duration }`
			+ ` REPLICATION ${ retentionPolicy.replication }`
			+ ` NAME "${ retentionPolicy.name }"`;

		return this._post( statement );
	}

	dropDatabase( databaseName ) {

		const statement = `DROP DATABASE "${ databaseName }"`;
		return this._post( statement );
	}

	createRetentionPolicy( databaseName, retentionPolicy ) {

		const statement = formatRetentionPolicyStatement( databaseName, retentionPolicy, 'CREATE' );
		return this._post( statement );
	}

	alterRetentionPolicy( databaseName, retentionPolicy ) {

		const statement = formatRetentionPolicyStatement( databaseName, retentionPolicy, 'ALTER' );
		return this._post( statement );
	}

	dropRetentionPolicy( databaseName, retentionPolicyName ) {

		const statement = `DROP RETENTION POLICY "${ retentionPolicyName }" ON "${ databaseName }"`;
		return this._post( statement );
	}

	createContinuousQuery( databaseName, continuousQuery ) {

		const statement = continuousQueryFormatter( databaseName, continuousQuery );
		return this._post( statement );
	}

	dropContinuousQuery( databaseName, continuousQueryName ) {

		const statement = `DROP CONTINUOUS QUERY "${ continuousQueryName }" ON "${ databaseName }"`;
		return this._post( statement );
	}
}

module.exports = InfluxClient;
