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


	// Actual implementation of the "send" function.
	// send() may be called multiple times from back functions,
	// and is made to start, resume or complete processing.
	// It uses state infos stored in the response
	// and also general infos from the request.
	function send_implementation(request, response) {
		// We must go back through the processing chain to finish the handling.
		// We MAY be already in the back process.
		// We also must handle this in a async-safe manner.

		try {
			// is the back processing initiated ?
			if(response.middleware_.back_processing_chain_index_ < 0) {
				// start of the back processing
				// first we freeze (may be already frozen) the back processing chain
				Object.freeze(request.middleware_.back_processing_chain_);
				// then we set initiate values
				response.middleware_.back_processing_chain_index_ = request.middleware_.back_processing_chain_.length;
			}

			// We are now sure that the back processing is initiated.
			// Is it finished ?
			if(response.middleware_.back_processing_chain_index_ === 0) {
				// back processing is finished. Time to send the response.
				// Two pathes according to the request mode
				if(request.is_long_living) {
					// This response was server-generated and nobody is specifically waiting for it.
					// Call a special callback for this case.
					// TODO
					throw new Error("Server-generated responses ar not fully implemented !");
				}
				// in any case, resolve the promise
				response.middleware_.final_deferred_.resolve(response);
			}
			else {
				// Back processing chain is not finished.
				// Advance through it.
				response.middleware_.back_processing_chain_index_--;
				var callback_data = request.middleware_.back_processing_chain_[response.middleware_.back_processing_chain_index_];
				callback_data.func.call(
					callback_data.this_,
					request,
					response
				);
			}
		}
		catch(raw_e) {
			// Try to signal the error.
			// Let's be extra-safe to not rethrow.

			// Btw retype the error
			var e = new EE.RuntimeError( raw_e );

			// Assume the basics : response exists
			var signaled = false;

			if(   response
				&& response.middleware_
				&& response.middleware_.final_deferred_)
			{
				// try to signal via the deferred
				response.middleware_.final_deferred_.reject( e );
				if(!request.is_long_living)
					signaled = true; // if long_living we're pretty sure that no one is waiting on the promise
			}

			if(   !signaled
				&& request
				&& request.get_session
				&& request.get_session())
			{
				var session = request.get_session();
				if(   session
					&& session.get_server_core
					&& session.get_server_core())
				var core = session.get_server_core();
				// try to signal via a dedicated core function
				core.signal_out_of_chain_error(e, request, response);
				signaled = true;
			}
			if(!signaled) {
				// Rethrow, better than swallowing it.
				// But at last subtype it.
				throw e;
			}
		}
	}

	// class method to enrich the given reqest object
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
			// where are we in the back processing chain
			// -1 if not started
			back_processing_chain_index_ : -1,
			// a deferred to be resolved at the end of this response generation
			final_deferred_ : when.defer()
		};

		// note usage of closure
		response.send = function() {
			send_implementation( request, response );
		};
	}


	return {
		process: enrich_response
	};
}); // requirejs module
