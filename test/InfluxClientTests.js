'use strict';

const assert = require( 'chai' ).assert;
const nock = require( 'nock' );

const InfluxClient = require( '../src/InfluxClient.js' );

const mockInfluxUrl = 'http://influx.test.org';
const nockOptions = { allowUnmocked: false };

const testClient = new InfluxClient( mockInfluxUrl );

describe( 'InfluxClient', function() {

	describe( 'showContinuousQueries', function() {

		describe( 'when database does not exist', function() {
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

				return testClient
					.showContinuousQueries( 'buses' )
					.then( continuousQueries => {

						assert.deepEqual( continuousQueries, [] );
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

} );
