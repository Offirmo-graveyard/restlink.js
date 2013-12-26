/* A REST-like request,
 * to be sent over offirmo RESTlink
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'restlink/core/response'
],
function(_, Response) {
	"use strict";


	////////////////////////////////////
	var constants  = {};
	var defaults   = {};
	var exceptions = {};
	var methods    = {};


	////////////////////////////////////
	//constants. = ;


	////////////////////////////////////
	//defaults. = ;

	methods.init = function() {
		// init of member objects

		this.uri          = undefined;
		this.method       = undefined;
		// meta roughly equals http headers
		// https://en.wikipedia.org/wiki/List_of_HTTP_header_fields
		this.meta         = {};
		// https://en.wikipedia.org/wiki/Internet_media_type
		this.content_type = "application/json"; // default
		this.content      = undefined;

		// Not standard REST if set to true
		this.is_long_living = false; //< Is this request considered "permanent" ?
		                             //  If permanent, responses should be "pushed" for each change.
	};


	////////////////////////////////////
	//exceptions. = ;


	////////////////////////////////////
	// easy setting. Note the "return this" for fluid interface
	methods.with_uri          = function(uri)          { this.uri          = uri;          return this; };
	methods.with_url          = methods.with_uri; // alias
	methods.with_method       = function(method)       { this.method       = method;       return this; };
	methods.with_meta         = function(meta)         { this.meta         = meta;         return this; };
	methods.with_content_type = function(content_type) { this.content_type = content_type; return this; };
	methods.with_content      = function(content)      { this.content      = content;      return this; };

	// utility
	// attributes are optional
	methods.make_response = function(optional_attrs) {
		return Response.make_new_from_request(this, optional_attrs);
	};
	// for debug ! Build a sample request.
	function make_new_stanford_teapot() {
		var request = new DefinedClass();
		request.method = 'BREW';
		request.uri = '/stanford/teapot';
		return request;
	}

	////////////////////////////////////
	Object.freeze(constants);
	Object.freeze(defaults);
	Object.freeze(exceptions);
	Object.freeze(methods);

	var DefinedClass = function RestlinkRequest() {
		_.defaults( this, defaults );
		// other inits...
		methods.init.apply(this, arguments);
	};

	DefinedClass.prototype.constants  = constants;
	DefinedClass.prototype.exceptions = exceptions;
	_.extend(DefinedClass.prototype, methods);


	////////////////////////////////////
	return {
		// objects are created via a factory, more future-proof
		'make_new'   : function() { return new DefinedClass(); },
		// but we still expose the constructor to allow class inheritance
		'klass'      : DefinedClass,
		// exposing these allows convenient syntax and also prototypal inheritance
		'constants'  : constants,
		'exceptions' : exceptions,
		'defaults'   : defaults,
		'methods'    : methods,
		// "class" methods
		'make_new_stanford_teapot' : make_new_stanford_teapot
	};
}); // requirejs module
