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

	function callback_create_one(request, response) {
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
			promise.otherwise(function(args) {
				var err = args[1];
				response.set_to_internal_error(err);
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
			response.set_to_internal_error(err);
			response.send();
		}
	}

	function callback_delete_one(request, response) {
		var match_infos = request.get_match_infos();
		if(!match_infos.found || !test_bbmodel_object_prop(match_infos.payload)) {
			// Uh ?
			throw EE.InvariantNotMetError('REST BB model service is missing its internal data !');
		}

		// get the id
		var id = undefined;
		if(match_infos.last_segment_type !== 'id')
			throw EE.InvariantNotMetError("REST BB model service delete one route can't find the id !");
		id = match_infos.last_id;

		var payload = get_bbmodel_object_prop(match_infos.payload);
		var Model = payload.model;
		try {
			var new_instance = new Model(request.content);
			new_instance.id = id;
			var promise = new_instance.destroy();
			promise.spread(function(instance) {
				response.set_to_ok();
				response.send();
			});
			promise.otherwise(function(args) {
				var err = args[1];
				response.set_to_internal_error(err);
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
			response.set_to_internal_error(err);
			response.send();
		}
	}

	function callback_update_one(request, response) {
		var match_infos = request.get_match_infos();
		if(!match_infos.found || !test_bbmodel_object_prop(match_infos.payload)) {
			// Uh ?
			throw EE.InvariantNotMetError('REST BB model service is missing its internal data !');
		}

		// get the id
		var id = undefined;
		if(match_infos.last_segment_type !== 'id')
			throw EE.InvariantNotMetError("REST BB model service delete one route can't find the id !");
		id = match_infos.last_id;

		var payload = get_bbmodel_object_prop(match_infos.payload);
		var Model = payload.model;
		try {
			var new_instance = new Model();
			new_instance.id = id;
			var promise_fetch = new_instance.fetch();
			promise_fetch.spread(function(instance) {
				instance.set(request.content);
				var promise_save = instance.save();
				promise_save.spread(function(instance) {
					response.set_to_ok();
					response.send();
				});
				promise_save.otherwise(function(args) {
					var err = args[1];
					response.set_to_internal_error(err);
					response.send();
				});
			});
			promise_fetch.otherwise(function(args) {
				var err = args[1];
				response.set_to_internal_error(err);
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
			response.set_to_internal_error(err);
			response.send();
		}
	}

	function callback_read_one(request, response) {
		var match_infos = request.get_match_infos();
		if(!match_infos.found || !test_bbmodel_object_prop(match_infos.payload)) {
			// Uh ?
			throw EE.InvariantNotMetError('REST BB model service is missing its internal data !');
		}

		// get the id
		var id = undefined;
		if(match_infos.last_segment_type !== 'id')
			throw EE.InvariantNotMetError("REST BB model service delete one route can't find the id !");
		id = match_infos.last_id;

		// check content type
		if(!request.content_type.endsWith('json')) {
			// don't know such content type...
			response.set_to_not_implemented();
			response.content = "Content type not suppported.";
			response.send();
			return;
		}

		var payload = get_bbmodel_object_prop(match_infos.payload);
		var Model = payload.model;
		try {
			var new_instance = new Model();
			new_instance.id = id;
			var promise_fetch = new_instance.fetch();
			promise_fetch.spread(function(instance) {
				response.set_to_ok();
				response.with_content(new_instance.attributes);
				response.send();
			});
			promise_fetch.otherwise(function(args) {
				var err = args[1];
				response.set_to_internal_error(err);
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
			response.set_to_internal_error(err);
			response.send();
		}
	}

	function callback_read_all(request, response) {
		var match_infos = request.get_match_infos();
		if(!match_infos.found || !test_bbmodel_object_prop(match_infos.payload)) {
			// Uh ?
			throw EE.InvariantNotMetError('REST BB model service is missing its internal data !');
		}

		// check content type
		if(!request.content_type.endsWith('json')) {
			// don't know such content type...
			response.set_to_not_implemented();
			response.content = "Content type not suppported.";
			response.send();
			return;
		}

		var payload = get_bbmodel_object_prop(match_infos.payload);
		var Model = payload.model;

		try {
			var new_instance = new Model();
			var promise_find = new_instance.find();
			promise_find.spread(function(instance, result) {
				response.set_to_ok();
				response.with_content(new_instance.attributes);
				response.send();
			});
			promise_find.otherwise(function(args) {
				var err = args[1];
				response.set_to_internal_error(err);
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
			response.set_to_internal_error(err);
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

		//   POST   /order         create
		var payload = CallbackMiddleware.add_callback_handler(risc, singular_full_route, 'POST', callback_create_one);
		ensure_bbmodel_object_prop( payload).model = Model;

		// POST   /order/123       create/update
		// Backbone doesn't allow creation with an explicit id (with reason)
		// and there is PUT for more explicit update
		// so we don't serve this route.
		payload = CallbackMiddleware.add_callback_handler(risc, singular_full_route + '/:id', 'POST', function(request, response) {
			response.set_to_not_implemented();
			response.content = 'Creation with explicit id is not available on this resource.';
			response.send();
		});

		// * POST   /orders          create_multiple
		// seldom used. Not implemented for now.
		payload = CallbackMiddleware.add_callback_handler(risc, plural_full_route, 'POST', function(request, response) {
			response.set_to_not_implemented();
			response.content = 'Multiple creation is not available on this resource.';
			response.send();
		});

		//   DELETE /order/123       delete
		payload = CallbackMiddleware.add_callback_handler(risc, singular_full_route + '/:id', 'DELETE', callback_delete_one);
		ensure_bbmodel_object_prop( payload).model = Model;

		// * DELETE /orders          delete all
		// seldom used. Big safety issues. Not implemented for now.
		payload = CallbackMiddleware.add_callback_handler(risc, plural_full_route, 'DELETE', function(request, response) {
			response.set_to_not_implemented();
			response.content = 'Mass deletion is not available on this resource.';
			response.send();
		});
		// * DELETE /order          delete all
		// on singularized route (variant)
		payload = CallbackMiddleware.add_callback_handler(risc, singular_full_route, 'DELETE', function(request, response) {
			response.set_to_not_implemented();
			response.content = 'Mass deletion is not available on this resource.';
			response.send();
		});

		//   PUT    /order/123       create/update
		payload = CallbackMiddleware.add_callback_handler(risc, singular_full_route + '/:id', 'PUT', callback_update_one);
		ensure_bbmodel_object_prop( payload).model = Model;

		//   GET    /orders          read all
		// Not implemented for now.
		payload = CallbackMiddleware.add_callback_handler(risc, plural_full_route, 'GET', callback_read_all);
		ensure_bbmodel_object_prop( payload).model = Model;

		// * GET    /order           read all
		// GET all on singularized route (allowed variant)
		payload = CallbackMiddleware.add_callback_handler(risc, singular_full_route, 'GET', callback_read_all);
		ensure_bbmodel_object_prop( payload).model = Model;

		//   GET    /order/123       read one
		payload = CallbackMiddleware.add_callback_handler(risc, singular_full_route + '/:id', 'GET', callback_read_one);
		ensure_bbmodel_object_prop( payload).model = Model;

		//   GET    /order?foo=bar   find
	}

	return {
		// 'class' methods
		register_rest_routes_for_model: register_rest_routes_for_model
	};

}); // requirejs module
