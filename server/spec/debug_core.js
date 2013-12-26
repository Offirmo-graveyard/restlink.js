/** A wrapping around a restlink server core
 * with various debug features.
 * Better to wrap : avoid making the core too fat.
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'when',
	'extended-exceptions',
	'restlink/server/core',
	'restlink/server/middleware/base'
],
function(_, when, EE, Core, BaseMiddleware) {
	"use strict";


	////////////////////////////////////
	var constants  = {};
	var defaults   = {};
	var exceptions = {};
	var methods    = {};


	// starts after setting up a middleware if needed
	methods.startup_with_default_mw_if_needed = function() {
		if(typeof this.head_middleware_ === 'undefined') {
			// add a default middleware
			this.use(BaseMiddleware.make_new(function process(req, res, next) {
				res.set_to_not_implemented("Server is misconfigured. Please add middlewares to handle requests !");
				res.content_type = 'text';
				res.send();
			}));
		}

		// call the original function
		this.startup();
	};

	// combines several calls in one,
	// very useful for unit tests
	methods.startup_and_create_session = function(optional_request) {
		if(!this.is_started())
			this.startup_with_default_mw_if_needed();
		var session = this.create_session();
		if(typeof optional_request === 'object')
			session.register_request(optional_request);
		return session;
	};

	Object.freeze(constants);
	Object.freeze(defaults);
	Object.freeze(exceptions);
	Object.freeze(methods);


	function make_new_test_core() {
		var core = Core.make_new();

		// enrich
		_.extend(core, methods);

		return core;
	}


	////////////////////////////////////
	return {
		// "class" methods
		'make_new': make_new_test_core
	};
}); // requirejs module
