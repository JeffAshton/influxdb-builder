'use strict';

const _ = require( 'lodash' );
const rp = require( 'request-promise' );
const log = require( './log.js' );

function expandSeries( series ) {

	return _.map( series.values, valueArray => {

		const item = {};

		_.forEach( valueArray, ( value, index ) => {
			item[ series.columns ] = value;
		} );

		return item;
	} );
}

class InfluxClient {

	constructor( url, username, password ) {

		let auth = ( username && password )
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
				return client.get( {
					qs: { q: statement } 
				} )
				.then( body => {
					return body;
				} );
		};
		
		this._post = function( statement ) {
			log.debug( { query: statement }, 'Executing POST query' );
			return client
				.post( {
					qs: { q: statement } 
				} )
				.then( body => {
					return body;
				} );
		};
	}

	showRetentionPolicies( databaseName ) {
		
		const statement = `SHOW RETENTION POLICIES ON "${ databaseName }"`;
		return this._get( statement );
	}

	showContinuousQueries( databaseName ) {
		
		const statement = 'SHOW CONTINUOUS QUERIES';
		return this._get( statement )
			.then( body => {
				const statement = body.results[ 0 ];

				return series = _.find( statement.series, series => series.name === databaseName );
				if( !series ) {
					return [];
				}

				return expandSeries( series );
			} );
	}
	
	createDatabaseAsync( databaseName ) {

		const statement = `CREATE DATABASE "${ databaseName }"`;
		return this._post( statement );
	}

	formatCreateRetentionPolicy( databaseName, rententionPolicy ) {

		let statement = `CREATE RETENTION POLICY "${ rententionPolicy.name }"` 
			+ ` ON "${ databaseName }"`
			+ ` DURATION ${ rententionPolicy.duration }`
			+ ` REPLICATION ${ rententionPolicy.replication }`;

		const shardDuration = rententionPolicy[ 'shard_duration' ];
		if( shardDuration ) {
			statement += ` SHARD DURATION ${ shardDuration }`
		}

		if( rententionPolicy.default === true ) {
			statement += ' DEFAULT';
		}

		return statement;
	}
	
	createRetentionPolicyAsync( databaseName, rententionPolicy ) {

		const statement = this.formatCreateRetentionPolicy( databaseName, rententionPolicy );
		return this._post( statement );
	}

	formatCreateContinuousQuery( databaseName, continuousQuery ) {

		let statement = `CREATE CONTINUOUS QUERY "${ continuousQuery.name }"` 
			+ ` ON "${ databaseName }"`;

		const resample = continuousQuery.resample;
		if( resample && ( resample.every || resample.for ) ) {
			statement += ' RESAMPLE ';
			if( resample.every ) {
				statement += ` EVERY ${ resample.every }`
			}
			if( resample.for ) {
				statement += ` FOR ${ resample.for }`
			}
		}

		const query = continuousQuery.query.replace( /\s+/g, ' ' );
		statement += ` BEGIN ${ query } END`;

		return statement;
	}
	
	createContinuousQueryAsync( databaseName, continuousQuery ) {

		const statement = this.formatCreateContinuousQuery( databaseName, continuousQuery );
		return this._post( statement );
	}
}

module.exports = InfluxClient;
