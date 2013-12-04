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
	function get_match_infos_implementation(transaction, request) {
		if(!request.match_infos_) {
			if(!transaction.parent_session) {
				throw new EE.InvalidArgument("Can't compute match infos : This transaction parent session is unknown !");
			}
			else {
				var server = transaction.parent_session.get_server();
				if(!server || !server.rest_indexed_shared_container) {
					throw new EE.InvalidArgument("Can't compute match infos : This transaction parents are not fully initialized !");
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
	// @param transaction : mandatory
	function enrich_request(request, transaction) {
		if(typeof request === "undefined") {
			throw new EE.InvalidArgument("Offirmo Middleware : No request to enrich !");
		}
		if(typeof transaction === "undefined") {
			throw new EE.InvalidArgument("Offirmo Middleware : A transaction is needed to enrich a request !");
		}

		// note usage of closure
		request.get_match_infos = function() {
			return get_match_infos_implementation( transaction, request );
		};
	}

	return {
		process: enrich_request
	};
}); // requirejs module
