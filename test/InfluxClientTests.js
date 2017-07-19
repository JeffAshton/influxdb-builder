'use strict';

const chai = require( 'chai' );

const chaiAsPromised = require( 'chai-as-promised' );
chai.use( chaiAsPromised );

const assert = chai.assert;
const nock = require( 'nock' );

const InfluxClient = require( '../src/InfluxClient.js' );

const mockInfluxUrl = 'http://influx.test.org';
const nockOptions = { allowUnmocked: false };

const testClient = new InfluxClient( mockInfluxUrl );

describe( 'InfluxClient', function() {

	beforeEach( function() {
		nock.cleanAll();
	} );

	describe( 'showDatabases', function() {

		describe( 'when databases exist', function() {
			it( 'should return databases', function() {

				const req = nock( mockInfluxUrl, nockOptions )
					.get( '/query' )
					.query( { q: 'SHOW DATABASES' } )
					.reply( 200,
						/* eslint-disable quotes, indent */
						{
							"results": [
								{
									"statement_id": 0,
									"series": [
										{
											"name": "databases",
											"columns": [
												"name"
											],
											"values": [
												[
													"_internal"
												],
												[
													"telegraf"
												]
											]
										}
									]
								}
							]
						}
						/* eslint-enable quotes, indent */
					);

				return testClient
					.showDatabases()
					.then( databases => {

						assert.deepEqual( databases, [
							{
								name: '_internal'
							},
							{
								name: 'telegraf',
							}
						] );

						req.done();
					} );
			} );
		} );

	} );

	describe( 'showContinuousQueries', function() {

		describe( 'when database does not exist', function() {
			it( 'should throw', function() {

				const req = nock( mockInfluxUrl, nockOptions )
					.get( '/query' )
					.query( { q: 'SHOW CONTINUOUS QUERIES' } )
					.reply( 200,
						/* eslint-disable quotes, indent */
						{
							"results": [
								{
									"statement_id": 0,
									"series": [
										{
											"name": "_internal",
											"columns": [
												"name",
												"query"
											]
										}
									]
								}
							]
						}
						/* eslint-enable quotes, indent */
					);

				return assert
					.isRejected(
						testClient.showContinuousQueries( 'buses' ),
						/^database not found: buses$/g
					)
					.then( () => {
						req.done();
					} );
			} );
		} );

		describe( 'when database has no continuous queries', function() {
			it( 'should return empty array', function() {

				const req = nock( mockInfluxUrl, nockOptions )
					.get( '/query' )
					.query( { q: 'SHOW CONTINUOUS QUERIES' } )
					.reply( 200,
						/* eslint-disable quotes, indent */
						{
							"results": [
								{
									"statement_id": 0,
									"series": [
										{
											"name": "buses",
											"columns": [
												"name",
												"query"
											]
										}
									]
								}
							]
						}
						/* eslint-enable quotes, indent */
					);

				return testClient
					.showContinuousQueries( 'buses' )
					.then( continuousQueries => {

						assert.deepEqual( continuousQueries, [] );
						req.done();
					} );
			} );
		} );

		describe( 'when database has signle continuous query', function() {
			it( 'should return array with only that query', function() {

				const req = nock( mockInfluxUrl, nockOptions )
					.get( '/query' )
					.query( { q: 'SHOW CONTINUOUS QUERIES' } )
					.reply( 200,
						/* eslint-disable quotes, indent */
						{
							"results": [
								{
									"statement_id": 0,
									"series": [
										{
											"name": "buses",
											"columns": [
												"name",
												"query"
											],
											"values": [
												[
													"average_passengers",
													"CREATE CONTINUOUS QUERY average_passengers ON buses RESAMPLE EVERY 30m FOR 3d BEGIN SELECT mean(passengers) AS passengers INTO buses.\"1year\".average_passengers FROM buses.\"2hr\".bus_data GROUP BY time(1d) END"
												]
											]
										}
									]
								}
							]
						}
						/* eslint-enable quotes, indent */
					);

				return testClient
					.showContinuousQueries( 'buses' )
					.then( continuousQueries => {

						assert.deepEqual( continuousQueries, [
							{
								name: 'average_passengers',
								query: 'CREATE CONTINUOUS QUERY average_passengers ON buses RESAMPLE EVERY 30m FOR 3d BEGIN SELECT mean(passengers) AS passengers INTO buses."1year".average_passengers FROM buses."2hr".bus_data GROUP BY time(1d) END'
							}
						] );

						req.done();
					} );
			} );
		} );

		describe( 'when database has multiple continuous queries', function() {
			it( 'should return an empty array', function() {

				const req = nock( mockInfluxUrl, nockOptions )
					.get( '/query' )
					.query( { q: 'SHOW CONTINUOUS QUERIES' } )
					.reply( 200,
						/* eslint-disable quotes, indent */
						{
							"results": [
								{
									"statement_id": 0,
									"series": [
										{
											"name": "buses",
											"columns": [
												"name",
												"query"
											],
											"values": [
												[
													"average_passengers",
													"CREATE CONTINUOUS QUERY average_passengers ON buses RESAMPLE EVERY 30m FOR 3d BEGIN SELECT mean(passengers) AS passengers INTO buses.\"1year\".average_passengers FROM buses.\"2hr\".bus_data GROUP BY time(1d) END"
												],
												[
													"min_passengers",
													"CREATE CONTINUOUS QUERY min_passengers ON buses BEGIN SELECT min(passengers) AS passengers INTO buses.\"1year\".min_passengers FROM buses.\"2hr\".bus_data GROUP BY time(1d) END"
												]
											]
										}
									]
								}
							]
						}
						/* eslint-enable quotes, indent */
					);

				return testClient
					.showContinuousQueries( 'buses' )
					.then( continuousQueries => {

						assert.deepEqual( continuousQueries, [
							{
								name: 'average_passengers',
								query: 'CREATE CONTINUOUS QUERY average_passengers ON buses RESAMPLE EVERY 30m FOR 3d BEGIN SELECT mean(passengers) AS passengers INTO buses."1year".average_passengers FROM buses."2hr".bus_data GROUP BY time(1d) END'
							},
							{
								name: 'min_passengers',
								query: 'CREATE CONTINUOUS QUERY min_passengers ON buses BEGIN SELECT min(passengers) AS passengers INTO buses."1year".min_passengers FROM buses."2hr".bus_data GROUP BY time(1d) END'
							}
						] );

						req.done();
					} );
			} );
		} );

	} );

	describe( 'showRetentionPolicies', function() {

		describe( 'when database does not exist', function() {
			it( 'should throw', function() {

				const req = nock( mockInfluxUrl, nockOptions )
					.get( '/query' )
					.query( { q: 'SHOW RETENTION POLICIES ON "buses"' } )
					.reply( 200,
						/* eslint-disable quotes, indent */
						{
							"results": [
								{
									"statement_id": 0,
									"error": "database not found: buses"
								}
							]
						}
						/* eslint-enable quotes, indent */
					);

				return assert
					.isRejected(
						testClient.showRetentionPolicies( 'buses' ),
						/^database not found: buses$/g
					)
					.then( () => {
						req.done();
					} );
			} );
		} );

		describe( 'when database has signle retention policy', function() {
			it( 'should return array with only that retention policy', function() {

				const req = nock( mockInfluxUrl, nockOptions )
					.get( '/query' )
					.query( { q: 'SHOW RETENTION POLICIES ON "buses"' } )
					.reply( 200,
						/* eslint-disable quotes, indent */
						{
							"results": [
								{
									"statement_id": 0,
									"series": [
										{
											"columns": [
												"name",
												"duration",
												"shardGroupDuration",
												"replicaN",
												"default"
											],
											"values": [
												[
													"autogen",
													"0s",
													"168h0m0s",
													1,
													true
												]
											]
										}
									]
								}
							]
						}
						/* eslint-enable quotes, indent */
					);

				return testClient
					.showRetentionPolicies( 'buses' )
					.then( retentionPolicies => {

						assert.deepEqual( retentionPolicies, [
							{
								name: 'autogen',
								duration: '0s',
								shardGroupDuration: '168h0m0s',
								replicaN: 1,
								default: true
							}
						] );

						req.done();
					} );
			} );
		} );

		describe( 'when database has multiple retention policies', function() {
			it( 'should return array with all retention policies', function() {

				const req = nock( mockInfluxUrl, nockOptions )
					.get( '/query' )
					.query( { q: 'SHOW RETENTION POLICIES ON "buses"' } )
					.reply( 200,
						/* eslint-disable quotes, indent */
						{
							"results": [
								{
									"statement_id": 0,
									"series": [
										{
											"columns": [
												"name",
												"duration",
												"shardGroupDuration",
												"replicaN",
												"default"
											],
											"values": [
												[
													"autogen",
													"0s",
													"168h0m0s",
													1,
													true
												],
												[
													"1year",
													"8760h0m0s",
													"168h0m0s",
													1,
													false
												]
											]
										}
									]
								}
							]
						}
						/* eslint-enable quotes, indent */
					);

				return testClient
					.showRetentionPolicies( 'buses' )
					.then( retentionPolicies => {

						assert.deepEqual( retentionPolicies, [
							{
								name: 'autogen',
								duration: '0s',
								shardGroupDuration: '168h0m0s',
								replicaN: 1,
								default: true
							},
							{
								name: '1year',
								duration: '8760h0m0s',
								shardGroupDuration: '168h0m0s',
								replicaN: 1,
								default: false
							}
						] );

						req.done();
					} );
			} );
		} );

	} );

} );
