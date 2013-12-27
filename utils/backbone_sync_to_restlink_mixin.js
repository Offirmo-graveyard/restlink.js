/* A backbone-compatible sync implementation
 * to be added to an object in whatever fashion.
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'lodash', // need clone deep
	'backbone',
	'when',
	'extended-exceptions',
	'restlink/utils/serialization_utils'
],
function(_, Backbone, when, EE, SerializationUtils) {
	"use strict";

	var methods = {};

	methods.set_restlink_client = function(client) {
		this.restlink_ = client;
	};

	methods.sync = function(method, model, options) {
		console.log("sync_to_restlink begin('"+method+"',...) called with ", arguments);

		var deferred = when.defer();
		var restlink = model.restlink_;

		options = options || {};

		// just in case
		try {
			var target_url = model.url(); // we use the unique url as an id

			var request = restlink.make_new_request();
			// common
			if(options.hasOwnProperty('meta'))
				_.extend(request.meta, options.meta);

			////////////
			if(method === "read") {
				if(typeof target_url === 'undefined')
					throw new Error("can't fetch without id !");

				// fill the request
				request.uri = target_url;
				request.method = "GET";

				var promise = this.restlink_.process_request(request);
				promise.spread(function(request, response){
					// REM : the server round trip succeeded but the answer may be negative !
					if(response.return_code != 200) {
						// failure !
						deferred.reject( [model, new Error('' + response.return_code + ' - ' + response.content), options] );
					}
					else {
						// it worked.
						// we can't just overwrite, we must clear all attrs first (to suppress added one)
						model.clear();
						// now we can set
						model.set(response.content);
						// all in sync
						model.declare_in_sync();
						deferred.resolve( [model, undefined, options] );
					}
				});
				promise.otherwise(function(args){
					deferred.reject(args);
				});
			}
			////////////
			else if(method === "create") {
				if(typeof target_url === 'undefined')
					throw new Error("can't create without an url !");

				// fill the request
				request.uri = target_url;
				request.method = "POST";
				request.content = model.attributes;
				// immediately serialize to avoid sharing internal structures
				SerializationUtils.auto_serialize_content_if_needed(request);

				var promise = this.restlink_.process_request(request);
				promise.spread(function(request, response){
					// REM : the server round trip succeeded but the answer may be negative !
					if(response.return_code != 200) {
						// failure !
						deferred.reject( [model, new Error('' + response.return_code + ' - ' + response.content), options] );
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
						deferred.resolve( [model, undefined, options] );
					}
				});
				promise.otherwise(function(args){
					deferred.reject(args);
				});
			}
			////////////
			else if(method === "update") {
				if(typeof target_url === 'undefined')
					throw new Error("can't update without an url !");

				// fill the request
				request.uri = target_url;
				request.method = "PUT";
				var full_attributes_copy = _.cloneDeep(model.attributes);
				request.content = model.changed_attributes(); // optimization
				// immediately serialize to avoid sharing internal structures
				SerializationUtils.auto_serialize_content_if_needed(request);

				var promise = this.restlink_.process_request(request);
				promise.spread(function(request, response){
					// REM : the server round trip succeeded but the answer may be negative !
					if(response.return_code != 200) {
						// failure !
						deferred.reject( [model, new Error('' + response.return_code + ' - ' + response.content), options] );
					}
					else {
						// it worked.
						// we can't know if in sync (modifs may have be made since, either in client or server)
						// are we in sync ?
						if(_.isEqual(model.attributes, full_attributes_copy)) {
							// still same data, ok
							model.declare_in_sync();
						}
						deferred.resolve( [model, undefined, options] );
					}
				});
				promise.otherwise(function(args){
					deferred.reject(args);
				});
			}
			////////////
			else if(method === "delete") {
				if(typeof target_url === 'undefined')
					throw new Error("can't delete without an url !");

				// fill the request
				request.uri = target_url;
				request.method = "DELETE";

				var promise = this.restlink_.process_request(request);
				promise.spread(function(request, response){
					// REM : the server round trip succeeded but the answer may be negative !
					if(response.return_code != 200) {
						// failure !
						deferred.reject( [model, new Error('' + response.return_code + ' - ' + response.content), options] );
					}
					else {
						// it worked.
						// update model server id
						model.id = undefined; // since was deleted on server
						// are we in sync ? Not at all since no longer on server.
						model.declare_fully_out_of_sync();
						deferred.resolve( [model, undefined, options] );
					}
				});
				promise.otherwise(function(args){
					deferred.reject(args);
				});
			}
			////////////
			else {
				// WAT ?
				throw new Error("Unrecognized sync method !");
			}
		}
		catch(e) {
			deferred.reject( [ model, e ] );
		}

		console.log("sync_to_restlink end - Current changes = ", model.changed_attributes());
		return deferred.promise;
	};

	methods.find = function(criteria) {
		var deferred = when.defer();

		deferred.reject( [this, new Error("not implemented !")] ) ;

		return deferred.promise;
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
