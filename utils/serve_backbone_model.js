/* Utilities for serving a backbone model from a restlink server
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'backbone',
	'when',
	'extended-exceptions',
	'restlink/server/middleware/callback',
	'network-constants/http'
],
function(_, Backbone, when, EE, CallbackMiddleware, http_constants) {
	"use strict";

	function pluralize(word) {
		return word + 's';
	}

	// util
	function test_bbmodel_object_prop(object) {
		return object.hasOwnProperty('bb_model_service_infos_');
	}
	function get_bbmodel_object_prop(object) {
		return object.bb_model_service_infos_;
	}
	function ensure_bbmodel_object_prop(object) {
		if(!test_bbmodel_object_prop(object))
			object.bb_model_service_infos_ = {};
		return get_bbmodel_object_prop(object);
	}
	function compute_full_uri(segments, model_uri) {
		// simple version for now
		var url = '';
		// skip the 1st and last one
		for(var i = 1; i < segments.length - 1; ++i) {
			url += '/' + segments[i].value;
		}
		url += model_uri;
		return url;
	}
	function set_response_for_backbone_error(response, bbe) {
		// Our BB sync implementations *may* hint us about the status code.
		// Useful especially for the 404
		if(bbe.http_status_hint) {
			response.set_to_error(bbe.http_status_hint /*, bbe*/);
		}
		else {
			response.set_to_internal_error(bbe);
		}
	}

	function callback_create_one(request, response) {
		var match_infos = request.get_match_infos();
		if(!match_infos.found || !test_bbmodel_object_prop(match_infos.payload)) {
			// Uh ?
			throw EE.InvariantNotMet('REST BB model service is missing its internal data !');
		}

		var payload = get_bbmodel_object_prop(match_infos.payload);
		var Model = payload.model;
		try {
			// content is supposed to contains the attributes
			// TODO SEC filter attributes with whitelist !
			var new_instance = new Model(request.content);
			var promise = new_instance.save();
			var safety_promise = promise.then(function(attributes) {
				response.return_code = http_constants.status_codes.status_201_created;
				response.meta['Location'] = compute_full_uri(match_infos.segments, new_instance.url());
				// content
				response.content = { id: new_instance.id }; // XXX is this standard ?
				response.content_type = 'application/json'; // obviously
				response.send();
			},
			function(bbe) {
				// BB errors *may* have extra infos to help generate a good response
				set_response_for_backbone_error(response, bbe);
				response.send();
				return true; // no need to forward error
			});
			safety_promise.otherwise(function(e) {
				// final catch-all
				response.set_to_internal_error(e);
				response.send();
			});
		}
		catch(e) {
			/*if (err instanceof RouteIndexedContainer.exceptions.MalformedRouteError) {
				response.set_to_error(http_constants.status_codes.status_400_client_error_bad_request);
				response.send();
				handled = true;
			}
			else {// unknown other error*/
			response.set_to_internal_error(e);
			response.send();
		}
	}

	function callback_delete_one(request, response) {
		var match_infos = request.get_match_infos();
		if(!match_infos.found || !test_bbmodel_object_prop(match_infos.payload)) {
			// Uh ?
			throw EE.InvariantNotMet('REST BB model service is missing its internal data !');
		}

		// get the id
		if(match_infos.last_segment_type !== 'id')
			throw EE.InvariantNotMet("REST BB model service delete one route can't find the id !");
		var id = match_infos.last_id;

		var payload = get_bbmodel_object_prop(match_infos.payload);
		var Model = payload.model;
		try {
			var instance = new Model(request.content);
			instance.id = id;
			var promise = instance.destroy();
			var safety_promise = promise.then(function(model) {
				response.return_code = http_constants.status_codes.status_204_ok_no_content;
				response.send();
			},
			function(bbe) {
				// BB errors *may* have extra infos to help generate a good response
				set_response_for_backbone_error(response, bbe);
				response.send();
				return true; // no need to forward error
			});
			safety_promise.otherwise(function(e) {
				// final catch-all
				response.set_to_internal_error(e);
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
			throw EE.InvariantNotMet('REST BB model service is missing its internal data !');
		}

		// get the id
		if(match_infos.last_segment_type !== 'id')
			throw EE.InvariantNotMet("REST BB model service delete one route can't find the id !");
		var id = match_infos.last_id;

		var payload = get_bbmodel_object_prop(match_infos.payload);
		var Model = payload.model;
		try {
			var existing_instance = new Model();
			existing_instance.id = id;
			var promise_fetch = existing_instance.fetch();
			var safety_promise = promise_fetch.then(function(attributes) {
				// we fetched the existing one
				// patch it
				// TODO SEC filter attributes with whitelist
				existing_instance.set(request.content);
				var promise_save = existing_instance.save();
				// filter parent promise
				return promise_save.then(function(attributes) {
					response.set_to_ok();
					response.send();
				});
			},
			function(bbe) {
				// BB errors *may* have extra infos to help generate a good response
				set_response_for_backbone_error(response, bbe);
				response.send();
				return true; // no need to forward error
			});
			safety_promise.otherwise(function(e) {
				// final catch-all
				response.set_to_internal_error(e);
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
			throw EE.InvariantNotMet('REST BB model service is missing its internal data !');
		}

		// get the id
		if(match_infos.last_segment_type !== 'id')
			throw EE.InvariantNotMet("REST BB model service delete one route can't find the id !");
		var id = match_infos.last_id;

		// check content type
		if(request.content) {
			if(!request.content_type.endsWith('json')) {
				// don't know such content type...
				response.set_to_not_implemented(); // REM : set content type to text/plain
				response.content = "Content type not suppported.";
				response.send();
				return;
			}
			throw new EE.NotImplemented("GET with content");
		}

		var payload = get_bbmodel_object_prop(match_infos.payload);
		var Model = payload.model;
		try {
			var existing_instance = new Model();
			existing_instance.id = id;
			var promise_fetch = existing_instance.fetch();
			var safety_promise = promise_fetch.then(function(attributes) {
				response.set_to_ok();
				response.content = existing_instance.attributes;
				response.content_type = 'application/json'; // obviously
				response.send();
			},
			function(bbe) {
				// BB errors *may* have extra infos to help generate a good response
				set_response_for_backbone_error(response, bbe);
				response.send();
				return true; // no need to forward error
			});
			safety_promise.otherwise(function(e) {
				// final catch-all
				response.set_to_internal_error(e);
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

		// check content type (only if there is a content)
		if(request.content && !request.content_type.endsWith('json')) {
			// don't know such content type...
			response.set_to_not_implemented();
			response.content = "Content type not suppported.";
			response.send();
			return;
		}

		var payload = get_bbmodel_object_prop(match_infos.payload);
		var Model = payload.model;

		try {
			var temp_instance = new Model();
			// find() is not standard BackBone, so let's handle the case it's not present
			var promise_find;
			if(! temp_instance.find) {
				var err = new EE.NotImplemented("BB find() !");
				err.http_status_hint = http_constants.status_codes.status_501_server_error_not_implemented;
				promise_find = when.reject(err);
			}
			else {
				promise_find = temp_instance.find();
			}
			var safety_promise = promise_find.then(function(tbd) {
				// XXX should not work for now
				response.set_to_ok();
				response.with_content(temp_instance.attributes);
				response.content_type = 'application/json'; // obviously
				response.send();
			},
			function(bbe) {
				// BB errors *may* have extra infos to help generate a good response
				set_response_for_backbone_error(response, bbe);
				response.send();
				return true; // no need to forward error
			});
			safety_promise.otherwise(function(e) {
				// final catch-all
				response.set_to_internal_error(e);
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
