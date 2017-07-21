'use strict';

const _ = require( 'lodash' );
const assert = require( 'chai' ).assert;
const ymlDefinitionValidator = require( '../src/ymlDefinitionValidator.js' );

describe( 'ymlDefinitionValidator', function() {

	describe( 'when empty object', function() {
		it( 'should throw', function() {
			assert.throws(
				() => ymlDefinitionValidator( {} ),
				Error,
				'/ => Too few properties defined (0), minimum 1'
			);
		} );
	} );

	describe( 'when invalid retention policy', function() {

		const validRetentionPolicy = {
			'retention_policies': {
				'test': {
					duration: '2h',
					replication: 1
				}
			}
		};

		it( 'should throw when missing duration', function() {

			const policy = _.cloneDeep( validRetentionPolicy );
			delete policy.retention_policies.test.duration;

			assert.throws(
				() => ymlDefinitionValidator( policy ),
				Error,
				'/retention_policies/test => Missing required property: duration'
			);
		} );

		it( 'should throw when missing replication', function() {

			const policy = _.cloneDeep( validRetentionPolicy );
			delete policy.retention_policies.test.replication;

			assert.throws(
				() => ymlDefinitionValidator( policy ),
				Error,
				'/retention_policies/test => Missing required property: replication'
			);
		} );
	} );

	describe( 'when invalid continuous query', function() {

		const validContinuousQuery = {
			'continuous_queries': {
				'test': {
					query: `
						SELECT mean("passengers") AS "passengers"
						INTO "1year"."average_passengers"
						FROM "2hr"."bus_data"
						GROUP BY time(1d)
					`
				}
			}
		};

		it( 'should throw when missing query', function() {

			const policy = _.cloneDeep( validContinuousQuery );
			delete policy.continuous_queries.test.query;

			assert.throws(
				() => ymlDefinitionValidator( policy ),
				Error,
				'/continuous_queries/test => Missing required property: query'
			);
		} );
	} );

	describe( 'when valid definition', function() {
		it( 'should not throw', function() {
			assert.doesNotThrow(
				() => ymlDefinitionValidator( {
					'retention_policies': {
						'2hr': {
							duration: '2h',
							replication: 1,
							'shard_duration': '1h',
							default: true
						}
					},
					'continuous_queries': {
						'average_passengers': {
							query: `
								SELECT mean("passengers") AS "passengers"
								INTO "1year"."average_passengers"
								FROM "2hr"."bus_data"
								GROUP BY time(1d)
							`,
							resample: {
								every: '30m',
      							for: '3d'
							}
						}
					}
				} )
			);
		} );
	} );

} );
