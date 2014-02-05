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
function(_, when, EE) {
	"use strict";

	// class method to enrich the given request object
	// @param request : mandatory
	function enrich_response(response, request) {
		if(typeof response === "undefined") {
			throw new EE.InvalidArgument("Offirmo Middleware : No response to enrich !");
		}
		if(typeof request === "undefined") {
			throw new EE.InvalidArgument("Offirmo Middleware : A request is needed to enrich a response !");
		}

		// root of all our additions
		// in order to keep the response object clean
		response.middleware_ = {
			// the depth we are in the processing chain
			// 0 = not entered yet
			// 1 = MW 1, etc
			// useful for indentation of debug logs
			processing_chain_index : 0,
			// where are we in the back processing chain array
			// (REM : stored in the request)
			// -1 if not started
			back_processing_chain_index_ : -1,
			// a deferred to be resolved at the end of this response generation
			final_deferred_ : when.defer()
		};
	}


	return {
		process: enrich_response
	};
}); // requirejs module
