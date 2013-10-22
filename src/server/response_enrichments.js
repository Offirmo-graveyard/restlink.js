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

	function send_implementation(transaction, request, response) {
		var deferred = response.middleware_.deferred_chain_.pop();
		if(typeof deferred === 'undefined') {
			// This should never happen ! (Invariant)
			// last deferred should be the one from the adapter,
			// which should not call respond again !
			// We can't even send an error message since we don't know the adapter !
			throw new EE.InvariantNotMetError("Empty deferred chain : middleware error during processing ?");
		}
		deferred.resolve( [transaction, request, response] ); // repetition for convenience
	}


	function enrich_response(response, transaction, request) {
		response.middleware_ = {};

		// chain of deferred objects for sending the response.
		// Allow for multiple handlers to be chained
		// @see forward_to_handler()
		response.middleware_.deferred_chain_ = [];

		response.send = function() {
			send_implementation( transaction, request, response );
		};
	}

	/*
	 // utilities
	 methods.resolve_with_error = function(transaction, request, status_code, optional_content) {
	 var response = request.make_response()
	 .with_status(status_code);
	 if(typeof optional_content !== 'undefined') {
	 response.content = optional_content;
	 }
	 else {
	 response.content = http_constants.status_messages[status_code];
	 }

	 transaction.respond(response);
	 };

	 methods.resolve_with_not_implemented = function(transaction, request, optional_message) {
	 this.resolve_with_error(transaction, request, http_constants.status_codes.status_501_server_error_not_implemented, optional_message);
	 };

	 methods.resolve_with_internal_error = function(transaction, request, optional_message) {
	 this.resolve_with_error(transaction, request, http_constants.status_codes.status_500_server_error_internal_error, optional_message);
	 };

*/

	return {
		process: enrich_response
	};
}); // requirejs module
