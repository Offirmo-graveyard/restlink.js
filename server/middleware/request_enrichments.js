/* During its processing inside the middlewares,
 * we augment the request/response API.
 * This file defines the request augmentations.
 */

if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'when',
	'extended-exceptions'
],
function request_enrichment_module_def(_, when, EE) {
	"use strict";

	// actual implementation of the "get_match_infos" function
	function get_match_infos_implementation(request) {
		// compute only if needed
		if(!request.match_infos_) {
			if(!request.hasOwnProperty('get_session')) {
				throw new EE.InvalidArgument("Can't compute match infos : request is not linked to a session !");
			}
			var session = request.get_session(); // REM : available when linked to a session
			if(!session) {
				throw new EE.InvalidArgument("Can't compute match infos : parent session is unknown !");
			}
			else {
				var server = session.get_server();
				if(!server || !server.rest_indexed_shared_container) {
					throw new EE.InvalidArgument("Can't compute match infos : session parents are not fully initialized !");
				}
				else {
					request.match_infos_ = server.rest_indexed_shared_container.shared_detailed_at(request.uri, request.method);
				}
			}
		}
		return request.match_infos_;
	}

	// class method to enrich the given reqest object
	// @param request : mandatory
	function enrich_request(request) {
		if(typeof request === "undefined") {
			throw new EE.InvalidArgument("Offirmo Middleware : No request to enrich !");
		}

		// note : closure
		request.get_match_infos = function() {
			return get_match_infos_implementation( this );
		};
	}

	return {
		// "class" method
		process: enrich_request
	};
}); // requirejs module
