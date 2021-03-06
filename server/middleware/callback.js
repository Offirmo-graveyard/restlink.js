/* The restLink request handler middleware
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
	//constants. = ;


	////////////////////////////////////
	//exceptions. = ;


	////////////////////////////////////
	defaults.denomination_ = "CallbackMW";


	////////////////////////////////////
	//methods. = ;


	////////////////////////////////////
	// util
	function test_callback_object_prop(object) {
		return object.hasOwnProperty('callback_mw_infos_')
	}
	function get_callback_object_prop(object) {
		return object.callback_mw_infos_;
	}
	function ensure_callback_object_prop(object) {
		if(!test_callback_object_prop(object))
			object.callback_mw_infos_ = {};
		return get_callback_object_prop(object);
	}

	// our custom processing function
	function processing_function(request, response, next, that) {

		try {
			var match_infos = request.get_match_infos();
			if(!match_infos.route_found) {
				// will forward to next handler.
				// not handled.
			}
			else if(!match_infos.action_found) {
				// url was found, but not with this action.
				// What should we do ?
				// Nothing : will forward to next handler.
				// not handled.
			}
			else if(!match_infos.found) {
				// should have been filtered by above tests !
				response.set_to_internal_error();
				response.send();
				return;
			}
			else {
				// run the callback if any, or else : not handled
				if(test_callback_object_prop(match_infos.payload)) {
					var my_data = get_callback_object_prop( match_infos.payload );

					if( typeof my_data.callback === 'function' ) {
						// should call send when ready.
						// May not call next.
						my_data.callback(request, response);
						return;
					}
				}
			}
		}
		catch(e) {
			// TODO move those specialized tests somewhere else
			if (e instanceof RouteIndexedContainer.exceptions.RouteTooLongError) {
				response.set_to_error(http_constants.status_codes.status_414_client_error_request_uri_too_long);
				response.send();
				return;
			}
			else if (e instanceof RouteIndexedContainer.exceptions.MalformedRouteError) {
				response.set_to_error(http_constants.status_codes.status_400_client_error_bad_request);
				response.send();
				return;
			}
			else { // unknown other error
				response.set_to_internal_error(e);
				response.send();
				return;
			}
		}

		// we couldn't handle : maybe someone else can !
		next();
	}

	// "class method"
	// register a callback to the designated route+action
	// returns the shared payload for the route+action, useful for adding data for the callback
	function add_callback_handler(rest_indexed_container, route, action, callback, replace_existing) {
		if (typeof replace_existing === 'undefined') { replace_existing = false; }

		var payload = rest_indexed_container.ensure(route, action);
		var entry = ensure_callback_object_prop( payload );

		if(entry.callback && !replace_existing)
			throw new EE.InvalidArgument("Conflict : a callback is already set for this REST endpoint.");

		entry.callback = callback;

		return payload;
	}

	////////////////////////////////////

	Object.freeze(constants);
	Object.freeze(defaults);
	Object.freeze(exceptions);
	Object.freeze(methods);

	var DefinedClass = function RestlinkRequestHandlerActual() {

		// call parent constructor
		RestlinkMiddlewareBase.klass.prototype.constructor.apply(this, [ processing_function ]);

		// now apply our own defaults (in this order this time)
		_.extend( this, defaults );
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
		'add_callback_handler' : add_callback_handler

	};
}); // requirejs module
