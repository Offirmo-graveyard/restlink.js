/* Utilities for serving a backbone model from a restlink server
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'backbone',
	'when',
	'extended-exceptions',
	'restlink/server/middleware/callback'
],
function(_, Backbone, when, EE, CallbackMiddleware) {
	"use strict";

	function pluralize(word) {
		return word + 's';
	}

	// util
	function test_bbmodel_object_prop(object) {
		return object.hasOwnProperty('bb_model_service_infos_')
	}
	function get_bbmodel_object_prop(object) {
		return object.bb_model_service_infos_;
	}
	function ensure_bbmodel_object_prop(object) {
		if(!test_bbmodel_object_prop(object))
			object.bb_model_service_infos_ = {};
		return get_bbmodel_object_prop(object);
	}

	function callback_create(request, response) {
		var match_infos = request.get_match_infos();
		if(!match_infos.found || !test_bbmodel_object_prop(match_infos.payload)) {
			// Uh ?
			throw EE.InvariantNotMetError('REST BB model service is missing its internal data !');
		}

		var payload = get_bbmodel_object_prop(match_infos.payload);
		var Model = payload.model;
		try {
			var new_instance = new Model(request.content);
			var promise = new_instance.save();
			promise.spread(function(instance) {
				response.set_to_ok();
				response.content = { id: instance.id };
				response.send();
			});
			promise.otherwise(function(err) {
				response.set_to_internal_error(err.message + "/n" + err.stack);
				response.send();
			});
		}
		catch(err) {
			/*if (err instanceof RouteIndexedContainer.exceptions.MalformedRouteError) {
				response.set_to_error(http_constants.status_codes.status_400_client_error_bad_request);
				response.send();
				handled = true;
			}
			else {// unknown other error*/
			response.set_to_internal_error(err.message + "/n" + err.stack);
			response.send();
		}

	}

	function register_rest_routes_for_model(core, route, Model, options) {

		options = {} || options;
		var sample_instance = new Model();

		var singular_route = sample_instance.urlRoot;
		// allow override (ex. complex plurals)
		if('singular_route' in options)
			singular_route = options.singular_route;

		var plural_route = pluralize( singular_route );
		if('plural_route' in options)
			plural_route = options.plural_route;

		if(typeof(singular_route) !== 'string' || typeof(plural_route) !== 'string')
			throw new EE.InvalidArgument('Model url root is unclear !');

		var singular_full_route = route + singular_route;
		var plural_full_route = route + plural_route;

		var risc = core.get_rest_indexed_container();

		//   POST   /order           create
		var payload = CallbackMiddleware.add_callback_handler(risc, singular_full_route, 'POST', callback_create);
		ensure_bbmodel_object_prop( payload).model = Model;

		//   POST   /order/123       create/update
		//var payload = CallbackMiddleware.add_callback_handler(risc, singular_full_route + '/:id', 'POST', callback_create);
		//ensure_bbmodel_object_prop( payload).model = Model;

		// * POST   /orders          create_multiple
		//   DELETE /order/123       delete
		// * DELETE /orders          delete all
		//   PUT    /order/123       create/update
		//   GET    /orders          read all
		// * GET    /order           read all
		//   GET    /order/123       read
		//   GET    /order?foo=bar   find
	}

	return {
		// 'class' methods
		register_rest_routes_for_model: register_rest_routes_for_model
	};

}); // requirejs module
