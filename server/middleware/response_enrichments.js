/* During its processing inside the middlewares,
 * we augment the request/response API.
 * This file defines the response augmentations.
 */

if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'when',
	'extended-exceptions'
],
function response_enrichment_module_def(_, when, EE) {
	"use strict";

	// actual implementation of the "send" function
	function send_implementation(context, request, response) {
		var deferred = response.middleware_.deferred_chain_.pop();
		if(typeof deferred === 'undefined') {
			// This should never happen ! (Invariant)
			// last deferred should be the one from the adapter,
			// which should not call respond again !
			// We can't even send an error message since we don't know the adapter !
			throw new EE.InvariantNotMetError("Empty deferred chain : middleware error during processing ?");
		}
		deferred.resolve( [context, request, response] );
	}

	// class method to enrich the given reqest object
	// @param request : mandatory
	// @param context : optional
	function enrich_response(response, request, context) {
		if(typeof response === "undefined") {
			throw new EE.InvalidArgument("Offirmo Middleware : No response to enrich !");
		}
		if(typeof request === "undefined") {
			throw new EE.InvalidArgument("Offirmo Middleware : A request is needed to enrich a response !");
		}

		// root of all our additions
		// in order to keep the response object clean
		response.middleware_ = {};

		// chain of deferred objects for sending the response.
		// Allow for multiple handlers to be chained
		// @see forward_to_handler()
		response.middleware_.deferred_chain_ = [];

		// note usage of closure
		response.send = function() {
			send_implementation( context, request, response );
		};
	}


	return {
		process: enrich_response
	};
}); // requirejs module
