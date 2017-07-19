'use strict';

module.exports = function( databaseName, continuousQuery ) {

	let statement = `CREATE CONTINUOUS QUERY ${ continuousQuery.name }`
		+ ` ON ${ databaseName }`;

	const resample = continuousQuery.resample;
	if( resample && ( resample.every || resample.for ) ) {
		statement += ' RESAMPLE';
		if( resample.every ) {
			statement += ` EVERY ${ resample.every }`;
		}
		if( resample.for ) {
			statement += ` FOR ${ resample.for }`;
		}
	}

	const query = continuousQuery.query.replace( /\s+/g, ' ' ).trim();
	statement += ` BEGIN ${ query } END`;

	return statement;
};
