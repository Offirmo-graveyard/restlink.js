/* A backbone-compatible sync implementation
 * to be mixed to a Backbone Model.
 * Used routes :
 * GET /rsrc/id
 * POST /rsrc
 * PUT /rsrc/id
 * DELETE /rsrc/id
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'lodash', // need clone deep
	'backbone',
	'when',
	'extended-exceptions',
	'network-constants/http',
	'restlink/utils/serialization_utils'
],
function(_, Backbone, when, EE, http, SerializationUtils) {
	"use strict";

	var methods = {};

	methods.set_restlink_client = function(client) {
		this.restlink_ = client;
	};

	methods.sync = function(method, model, options) {
		//console.log("sync_to_restlink begin('"+method+"',...) called with ", arguments);

		var restlink_client = model.restlink_; // shortcut

		options = options || {};

		// just in case
		try {
			var target_url = model.url(); // we use the unique url as an id

			var request = restlink_client.make_new_request();
			// common
			if(options.hasOwnProperty('meta'))
				_.extend(request.meta, options.meta);

			////////////
			var restlink_promise;
			if(method === "read") {
				if(typeof target_url === 'undefined')
					throw new EE.InvalidArgument("can't fetch without id !");

				// fill the request
				request.uri = target_url;
				request.method = "GET";

				restlink_promise = restlink_client.process_request(request);
				// filter the restlink client promise into a backbone sync one
				return restlink_promise.then(function(response) {
					// REM : the server round trip succeeded but the answer may be negative !
					if(response.return_code !== http.status_codes.status_200_ok) {
						// failure !
						var err = new EE.RuntimeError('' + response.return_code + ' - ' + response.content);
						err.http_status_hint = response.return_code;
						throw err;
					}
					else {
						// it worked.
						// we can't just overwrite, we must clear all attrs first (to suppress added one)
						model.clear();
						// now we can set
						model.set(response.content);
						// all in sync
						model.declare_in_sync();
						return model.attributes; // change resolution value
					}
				});
			}
			////////////
			else if(method === "create") {
				if(typeof target_url === 'undefined')
					throw new EE.InvalidArgument("can't create without an url !");

				// fill the request
				request.uri = target_url;
				request.method = "POST";
				request.content = model.attributes;
				// immediately serialize to avoid sharing internal structures
				SerializationUtils.auto_serialize_content_if_needed(request);

				restlink_promise = restlink_client.process_request(request);
				// filter the restlink client promise into a backbone sync one
				return restlink_promise.then(function(response) {
					// REM : the server round trip succeeded but the answer may be negative !
					if(response.return_code !== http.status_codes.status_201_created) {
						// failure !
						var err = new EE.RuntimeError('' + response.return_code + ' - ' + response.content);
						err.http_status_hint = response.return_code;
						throw err;
					}
					else {
						// it worked.
						// update model server id
						model.id = response.content.id;
						// are we in sync ?
						if(_.isEqual(model.attributes, request.content)) {
							// still same data, ok
							model.declare_in_sync();
						}
						return model.attributes; // change resolution value
					}
				});
			}
			////////////
			else if(method === "update") {
				if(typeof target_url === 'undefined')
					throw new EE.InvalidArgument("can't update without an url !");

				// fill the request
				request.uri = target_url;
				request.method = "PUT";
				var full_attributes_copy = _.cloneDeep(model.attributes);
				request.content = model.changed_attributes(); // optimization
				// immediately serialize to avoid sharing internal structures
				SerializationUtils.auto_serialize_content_if_needed(request);

				restlink_promise = restlink_client.process_request(request);
				// filter the restlink client promise into a backbone sync one
				return restlink_promise.then(function(response) {
					// REM : the server round trip succeeded but the answer may be negative !
					if(response.return_code !== http.status_codes.status_200_ok) {
						// failure !
						var err = new EE.RuntimeError('' + response.return_code + ' - ' + response.content);
						err.http_status_hint = response.return_code;
						throw err;
					}
					else {
						// it worked.
						// we can't know if in sync (modifs may have be made since, either in client or server)
						// are we in sync ?
						if(_.isEqual(model.attributes, full_attributes_copy)) {
							// still same data, ok
							model.declare_in_sync();
						}
						return model.attributes; // change resolution value
					}
				});
			}
			////////////
			else if(method === "delete") {
				if(typeof target_url === 'undefined')
					throw new EE.InvalidArgument("can't delete without an url !");

				// fill the request
				request.uri = target_url;
				request.method = "DELETE";

				restlink_promise = restlink_client.process_request(request);
				// filter the restlink client promise into a backbone sync one
				return restlink_promise.then(function(response) {
					// REM : the server round trip succeeded but the answer may be negative !
					if(response.return_code !== http.status_codes.status_204_ok_no_content) {
						// failure !
						var err = new EE.RuntimeError('' + response.return_code + ' - ' + response.content);
						err.http_status_hint = response.return_code;
						throw err;
					}
					else {
						// it worked.
						// update model server id
						model.id = undefined; // since was deleted on server
						// are we in sync ? Not at all since no longer on server.
						model.declare_fully_out_of_sync();
						// filter
						return model;
					}
				});
			}
			////////////
			else {
				// WAT ?
				throw new EE.LogicError("Unrecognized sync method !");
			}
		}
		catch(e) {
			return when.reject( e );
		}

		// should never arrive here
		return when.reject( new EE.LogicError("Should never arrive here !") );
	};

	methods.find = function(criteria) {
		return when.reject( new Error("not implemented !") );
	};




	/////// Final ///////
	var SyncToRestlinkMixin = {
		// "class" methods
		mixin: function(prototype) {

			// check if given param is really a prototype (common error)
			if(!prototype.hasOwnProperty('constructor'))
				throw new Error("Backbone sync() to restlink mixin() must be passed a prototype !");

			// check if this object was already mixed ?

			// add other functions
			_.extend(prototype, methods);
		},
		// set store on the model prototype, making it effective for all instances
		set_model_restlink_client: function(prototype, client) {

			// check if given param is really a prototype (common error)
			if(!prototype.hasOwnProperty('constructor'))
				throw new Error("Backbone sync() to restlink set_model_restlink_client() must be passed a prototype !");

			// set the global store
			prototype.restlink_ = client;
		}
	};

	return SyncToRestlinkMixin;
}); // requirejs module
