/* During its processing inside the middlewares,
 * we augment the request API.
 * This file defines those augmentations.
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
		response.middleware_ = {};

		// chain of deferred objects for sending the response.
		// Allow for multiple handlers to be chained
		// @see forward_to_handler()
		response.middleware_.deferred_chain_ = [];

		// memorize locally the params
		/*var closure_response = response;
		var closure_context  = context;
		var closure_request  = request;*/

		response.send = function() {
			send_implementation( context, request, response );
		};
	}

	/*
	 // utilities
	 methods.resolve_with_error = function(context, request, status_code, optional_content) {
	 var response = request.make_response()
	 .with_status(status_code);
	 if(typeof optional_content !== 'undefined') {
	 response.content = optional_content;
	 }
	 else {
	 response.content = http_constants.status_messages[status_code];
	 }

	 context.respond(response);
	 };

	 methods.resolve_with_not_implemented = function(context, request, optional_message) {
	 this.resolve_with_error(context, request, http_constants.status_codes.status_501_server_error_not_implemented, optional_message);
	 };

	 methods.resolve_with_internal_error = function(context, request, optional_message) {
	 this.resolve_with_error(context, request, http_constants.status_codes.status_500_server_error_internal_error, optional_message);
	 };

*/

	return {
		process: enrich_response
	};
}); // requirejs module
