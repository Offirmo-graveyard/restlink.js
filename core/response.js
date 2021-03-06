/* A REST-like response,
 * to be sent over offirmo RESTlink
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'network-constants/http'
],
function(_, http_constants) {
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
		this.return_code  = http_constants.status_codes.status_500_server_error_internal_error;
		// https://en.wikipedia.org/wiki/List_of_HTTP_header_fields
		this.meta         = {};
		// https://en.wikipedia.org/wiki/Internet_media_type
		this.content_type = undefined;
		this.content      = ""; // empty better than undefined, so handlers can concat without having to test for undefined
	};


	////////////////////////////////////
	//exceptions. = ;


	////////////////////////////////////
	//methods. = ;
	// easy setting. Note the "return this" for fluid interface
	methods.with_uri          = function(uri)     { this.uri          = uri;      return this; };
	methods.with_url          = methods.with_uri; // alias
	methods.with_status       = function(code)    { this.return_code  = code;      return this; };
	methods.with_meta         = function(meta)    { this.meta         = meta;     return this; };
	methods.with_content      = function(content) { this.content      = content;  return this; };
	methods.with_content_type = function(content_type) { this.content_type = content_type; return this; };

	// utilities
	methods.set_to_ok      = function() {
		this.return_code = http_constants.status_codes.status_200_ok;
		return this; // for fluid
	};
	methods.set_to_error      = function(error_code, optional_content) {
		this.return_code = error_code;
		if(typeof optional_content !== "undefined") {
			this.content = optional_content;
		}
		else {
			// use the error message as content
			this.content_type = 'text/plain';
			this.content = http_constants.status_messages[error_code];
		}
		return this; // for fluid
	};
	// note : serialization utils handle the case where content = Error
	// so it's ok to pass an Error here
	methods.set_to_internal_error = function(optional_content) {
		return this.set_to_error(http_constants.status_codes.status_500_server_error_internal_error, optional_content);
	};
	methods.set_to_not_implemented = function(optional_content) {
		return this.set_to_error(http_constants.status_codes.status_501_server_error_not_implemented, optional_content);
	};
	methods.set_to_not_found = function(optional_content) {
		return this.set_to_error(http_constants.status_codes.status_404_client_error_not_found, optional_content);
	};

	////////////////////////////////////
	Object.freeze(constants);
	Object.freeze(defaults);
	Object.freeze(exceptions);
	Object.freeze(methods);

	var DefinedClass = function RestlinkResponse() {
		_.defaults( this, defaults );
		// other inits...
		methods.init.apply(this, arguments);
	};

	DefinedClass.prototype.constants  = constants;
	DefinedClass.prototype.exceptions = exceptions;
	_.extend(DefinedClass.prototype, methods);


	// utility
	function make_new_from_request(request, attrs) {
		var response = new DefinedClass();

		// 1st init with request values
		_.extend(response,
			{
				method       : request.method,
				uri          : request.uri,
				content_type : request.content_type
			});

		// then overwrite with explicite values (if any)
		attrs || (attrs = {});
		_.extend(response, attrs);

		// deep for meta
		attrs.meta || (attrs.meta = {});
		_.extend(response.meta, attrs.meta);

		return response;
	}

	////////////////////////////////////
	return {
		// objects are created via a factory, more future-proof
		'make_new'   : function() { return new DefinedClass(); },
		'make_new_from_request' : make_new_from_request,
		// but we still expose the constructor to allow class inheritance
		'klass'      : DefinedClass,
		// exposing these allows convenient syntax and also prototypal inheritance
		'constants'  : constants,
		'exceptions' : exceptions,
		'defaults'   : defaults,
		'methods'    : methods
	};
}); // requirejs module
