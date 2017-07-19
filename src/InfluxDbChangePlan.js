'use strict';

const _ = require( 'lodash' );

class ResourcePlan {

	constructor( action, source, target, definition ) {

		this.action = action;
		this.source = source;
		this.target = target;
		this.definition = definition;
	}

	toLog() {

		const log = _.pick( this, [
			'action',
			'source',
			'target'
		 ] );

		 return log;
	}
}

class InfluxDbChangePlan {

	constructor( databases, continuousQueries, retentionPolicies ) {

		this.databases = databases;
		this.retentionPolicies = retentionPolicies;
		this.continuousQueries = continuousQueries;
	}

	get hasChanges() {
		return this.countChanges() > 0;
	}

	countChanges() {

		const count = (
			this.databases.length
			+ this.retentionPolicies.length
			+ this.continuousQueries.length
		);

		return count;
	}

	toLog() {

		const log = {};

		_.forEach( [ 'databases', 'retentionPolicies', 'continuousQueries' ], resource => {

			const resourcePlans = this[ resource ];
			if( resourcePlans.length > 0 ) {
				log[ resource ] = _.map( resourcePlans, p => p.toLog() );
			}
		} );

		return log;
	}
}

module.exports.InfluxDbChangePlan = InfluxDbChangePlan;
module.exports.ResourcePlan = ResourcePlan;
