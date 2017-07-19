'use strict';

const tv4 = require( 'tv4' );
tv4.addFormat( require( 'tv4-formats' ) );

const definitionSchema = require( '../schemas/database.json' );

module.exports = function( definition ) {

	const banUnknownProperties = false;
	const checkRecursive = false;

	const result = tv4.validateResult( definition, definitionSchema, checkRecursive, banUnknownProperties );
	if( result.error ) {
		throw new Error( `${ result.error.dataPath || '/' } => ${ result.error.message }` );
	}
};
