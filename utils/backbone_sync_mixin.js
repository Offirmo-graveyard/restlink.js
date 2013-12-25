/* A backbone-compatible sync implementation
 * to be added to an object in whatever fashion.
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'backbone',
	'when',
	'extended-exceptions'
],
function(_, Backbone, when, EE) {
	"use strict";

	var methods = {};

	methods.sync = function(method, model, options) {
		console.log("sync_to_restlink begin('"+method+"',...) called with ", arguments);

		var deferred = when.defer();
		var restlink = model.restlink_;

		var url = this.compute_url(); // may fail, it's ok
		var request = model.restlink_.make_new_request();

		////////////
		if(method === "read") {
			if(typeof url === 'undefined')
				throw new Error("can't fetch without id !");

			// fill the request
			request.uri = url;
			request.method = "GET";
			if(options && options.hasOwnProperty('meta'))
				_.extend(request.meta, options.meta);
			if(options && options.hasOwnProperty('meta'))
				_.extend(request.meta, options.meta);
			if(options && options.hasOwnProperty('content'))
				request.content = options.content;

			var promise = this.restlink_.process_request(request);
			promise.spread(function(request, response){
				// Warning : the server round trip succeeded but the answer may be negative !
				throw new EE.NotImplementedError();
				var data = model.store_.get(id);
				// apply fetched data
				model.set(data);
				// all in sync
				model.declare_in_sync();
			});
			promise.otherwise(function(reason){
				deferred.reject(reason);
			});
		}
		////////////
		else if(method === "create") {
			throw new EE.NotImplementedError();
		}
		////////////
		else if(method === "update") {
			throw new EE.NotImplementedError();
		}
		////////////
		else if(method === "delete") {
			throw new EE.NotImplementedError();
		}
		////////////
		else {
			// WAT ?
			deferred.reject("Unrecognized sync method !!!");
		}

		console.log("sync_to_restlink end - Current changes = ", model.changed_attributes());

		return deferred.promise;
	};

	return {
		// exposing these allows various inheritances
		//'constants'  : constants,
		//'exceptions' : exceptions,
		//'defaults'   : defaults,
		'methods'    : methods
	};

}); // requirejs module
