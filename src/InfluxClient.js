'use strict';

const rp = require( 'request-promise' );
const log = require( './log.js' );

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

	createDatabaseAsync( databaseName ) {

		const statement = `CREATE DATABASE "${ databaseName }"`;
		
		return this._post( statement );
	}
	
	createRetentionPolicyAsync( databaseName, rententionPolicy ) {

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

		return this._post( statement );
	}
	
	createContinuousQueryAsync( databaseName, continuousQuery ) {

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

		statement += ` BEGIN ${ continuousQuery.query } END`;

		return this._post( statement );
	}
}

module.exports = InfluxClient;
