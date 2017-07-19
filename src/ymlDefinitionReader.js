'use strict';

const _ = require( 'lodash' );
const es6template = require( 'es6-template' );
const fs = require( 'fs' );
const jsyaml = require( 'js-yaml' );
const pathUtil = require( 'path' );
const Promise = require( 'bluebird' );
const sortKeys = require( 'sort-keys' );

const ymlDefinitionValidator = require( './ymlDefinitionValidator.js' );

const fsUtil = Promise.promisifyAll( fs );

function parseDefinition( yml ) {

	const rawDefinition = jsyaml.safeLoad( yml );
	ymlDefinitionValidator( rawDefinition );

	const definition = {
		continuousQueries: rawDefinition.continuous_queries || {},
		retentionPolicies: rawDefinition.retention_policies || {}
	};

	_.forIn( definition.continuousQueries, ( value, key ) => {
		value.name = key;
	} );

	_.forIn( definition.retentionPolicies, ( value, key ) => {
		value.name = key;
	} );

	return definition;
}

function mergeDefinitions( definitions ) {

	const merged = {
		continuousQueries: {},
		retentionPolicies: {}
	};

	_.forEach( definitions, definition => {

		_.forIn( definition.continuousQueries, ( value, key ) => {
			if( merged.continuousQueries[ key ] ) {
				throw new Error( `Duplicate continuous query: ${ key }` );
			}
			merged.continuousQueries[ key ] = value;
		} );

		_.forIn( definition.retentionPolicies, ( value, key ) => {
			if( merged.retentionPolicies[ key ] ) {
				throw new Error( `Duplicate retention policy: ${ key }` );
			}
			merged.retentionPolicies[ key ] = value;
		} );
	} );

	return merged;
}

function readDefinitionFile( path, templateArguments ) {

	return fsUtil
		.readFileAsync( path, { encoding: 'utf8' } )
		.then( ymlTemplate => {

			const yml = es6template( ymlTemplate, templateArguments );

			const definition = parseDefinition( yml );
			return definition;
		} );
}

function readDefinitionDirectory( path, templateArguments ) {

	return fsUtil
		.readdirAsync( path, 'utf8' )
		.then( files => {

			const ymlFiles = _.filter( files, name => {
				return pathUtil.extname( name ).toLowerCase() === '.yml';
			} );

			const ymlPaths = _.map( ymlFiles, name => {
				return pathUtil.join( path, name );
			} );

			return Promise.map(
				ymlPaths,
				ymlPath => readDefinitionFile( ymlPath, templateArguments ),
				{ concurrency: 4 }
			);
		} )
		.then( definitions => {

			const merged = mergeDefinitions( definitions );
			return merged;
		} );
}

function validateDefaultRetentionPolicy( definition ) {

	const defaults = _.filter(
		_.values( definition.retentionPolicies ),
		policy => policy.default
	);

	switch( defaults.length ) {

		case 0:
			throw new Error( 'Default retention policy not defined' );

		case 1:
			return;

		default:
			throw new Error( 'Multiple default retention policies defined' );
	}
}

module.exports = function( path, templateArguments ) {

	return fsUtil
		.statAsync( path )
		.then( stats => {

			if( stats.isFile() ) {
				return readDefinitionFile( path, templateArguments );
			}

			if( stats.isDirectory() ) {
				return readDefinitionDirectory( path, templateArguments );
			}

			throw new Error( `Invalid yml definition path: ${ path }` );
		} )
		.then( definition => {
			validateDefaultRetentionPolicy( definition );

			const sorted = sortKeys( definition, { deep: true } );
			return sorted;
		} );
};
