/* The RestLink request handler middleware
 * that dispatch requests to previously registered functions.
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'restlink/server/middleware/base',
	'restlink/utils/route_indexed_container',
	'extended-exceptions',
	'network-constants/http'
],
function(_, RestlinkMiddlewareBase, RouteIndexedContainer, EE, http_constants) {
	"use strict";


	////////////////////////////////////
	var constants  = {};
	var defaults   = {};
	var exceptions = {};
	var methods    = {};


	////////////////////////////////////
	constants.shared_container_key = "ActualRequestHandler";


	////////////////////////////////////
	//exceptions. = ;


	////////////////////////////////////
	//defaults. = ;


	////////////////////////////////////
	//methods. = ;


	////////////////////////////////////
	// for overriding parent
	function processing_function(context, request, response, next, that) {

		var handled = false; // for now
		try {
			var match_infos = context.get_match_infos();
			if(!match_infos.route_found) {
				response.set_to_not_found();
				response.send();
			}
			else if(!match_infos.action_found) {
				response.set_to_not_implemented();
				response.send();
			}
			else if(!match_infos.found) {
				// should have been filtered by above tests !
				response.set_to_internal_error();
				response.send();
			}
			else {
				var my_data = match_infos.payload.get_and_optionally_create_data(constants.shared_container_key);

				if( typeof my_data.callback === 'function' ) {
					// should call send when ready.
					// May not call next.
					my_data.callback(context, request, response);
				}
			}
		}
		catch(err) {
			if (err instanceof RouteIndexedContainer.exceptions.RouteTooLongError) {
				response.set_to_error(http_constants.status_codes.status_414_client_error_request_uri_too_long);
				response.send();
			}
			else if (err instanceof RouteIndexedContainer.exceptions.MalformedRouteError) {
				response.set_to_error(http_constants.status_codes.status_400_client_error_bad_request);
				response.send();
			}
			else {// unknown other error
				response.set_to_internal_error(err.message + "/n" + err.stack);
				response.send();
			}
		}

		// not handled yet ?
		next();
	}

	methods.add_callback_handler = function(rest_indexed_container, route, action, callback, replace_existing) {
		if (typeof replace_existing === 'undefined') { replace_existing = false; }

		var container = rest_indexed_container.get_bound_interface(constants.shared_container_key);

		var entry = container.ensure(route, action);

		if(entry.callback && !replace_existing)
			throw new EE.InvalidArgument("Conflict : a callback is already set for this REST endpoint.");

		entry.callback = callback;
	};

	////////////////////////////////////

	Object.freeze(constants);
	Object.freeze(defaults);
	Object.freeze(exceptions);
	Object.freeze(methods);

	var DefinedClass = function RestlinkRequestHandlerActual() {

		// call parent constructor
		RestlinkMiddlewareBase.klass.prototype.constructor.apply(this, [ processing_function ]);

		// now apply our own defaults (in this order this time)
		_.defaults( this, defaults );
	};

	// prototype chain (class) inheritance from base
	DefinedClass.prototype = Object.create(RestlinkMiddlewareBase.klass.prototype);
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
		'methods'    : methods,
		// class methods (should not call this of course)
		'add_callback_handler' : methods.add_callback_handler

	};
}); // requirejs module
