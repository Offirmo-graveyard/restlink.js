/* A catch-all restLink request handler middleware.
 * Will always send a response.
 * Useful to be put at the end of the MW chain.
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'restlink/server/middleware/base',
	'restlink/server/rest_target_indexed_shared_container',
	'network-constants/http'
],
function(_, BaseMiddleware, RestContainer, http_constants) {
	"use strict";

	////////////////////////////////////
	var constants  = {};
	var defaults   = {};
	var exceptions = {};
	var methods    = {};

	////////////////////////////////////
	//constants. = ;

	////////////////////////////////////
	defaults.denomination_ = "CatchAllMW";

	////////////////////////////////////
	methods.process_TRACE_ = function(request, response) {
		// Just returns the same content we received.
		// SEC Note that there are security issues with this method,
		// but it's not here that it should be filtered.
		response.content = request.content;
		response.content_type = request.content_type;
		response.send();
	};

	// replace parent's one
	defaults.processing_function_ = function catchall_mw_processing_function(request, response, next) {
		try {
			var match_infos = request.get_match_infos();
			if(!match_infos.route_found) {
				// 404
				response.set_to_not_found();
			}
			else if(!match_infos.action_found) {
				// url was found, but not with this action.
				// what should we return ?
				// 501 Not Implemented ?
				// 405 Method Not Allowed ?
				// or 404 Not Found ?
				if(match_infos.found_no_actions_at_all) {
					// There are no actions at all for this uri.
					// Must be an auto-generated intermediate segment,
					// not a real resource.
					response.set_to_not_found();
				}
				else if(request.method.toLowerCase() in http_constants.methods) {
					// This is a known HTTP method so we're kinda expected to provide it.
					// If its not here, this must mean it's not allowed.
					response.set_to_error(
							http_constants.status_codes.status_405_client_error_method_not_allowed,
							http_constants.status_messages[405]);
					response.content_type = "text/plain";
				}
				else {
					// this is a non-standard method
					// most likely an error
					response.set_to_not_implemented();
				}
			}
			else {
				// all cases should have been filtered by above tests !
				response.set_to_internal_error();
			}
			response.send();
		}
		catch(e) {
			// unknown error
			//response.content_type = 'text/plain';
			//response.set_to_internal_error(e.name + "\n" + e.message + "\n" + e.stack);
			response.set_to_internal_error(e);
			response.send();
		}
	};

	////////////////////////////////////
	// inheriting and extending base fields

	// prototypal inheritance from BaseMiddleware
	_.defaults( constants,  BaseMiddleware.constants );
	_.defaults( exceptions, BaseMiddleware.exceptions );
	_.defaults( defaults,   BaseMiddleware.defaults );
	_.defaults( methods,    BaseMiddleware.methods );

	Object.freeze(constants);
	Object.freeze(exceptions);
	Object.freeze(defaults);
	Object.freeze(methods);

	// contructor
	var DefinedClass = function RestlinkCatchAllMiddleware() {

		// first set our own defaults
		_.defaults( this, defaults );

		// call parent constructor
		BaseMiddleware.klass.prototype.constructor.apply(this);
	};

	// in this case, "class" inheritance via prototype chain
	DefinedClass.prototype = Object.create(BaseMiddleware.klass.prototype);
	DefinedClass.prototype.constructor = DefinedClass;

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
		'methods'    : methods
	};
}); // requirejs module
