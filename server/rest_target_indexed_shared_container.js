/* A special container indexed by the tuple (url, action)
 * and storing a hash where separate entities can set stuff
 */

if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'restlink/utils/route_indexed_container',
	'extended-exceptions'
],
function(_, RouteIndexedContainer, EE) {
	"use strict";


	////////////////////////////////////
	var constants  = {};
	var defaults   = {};
	var exceptions = {};
	var methods    = {};


	////////////////////////////////////
	//constants. = ;
	constants.max_action_length = 30;



	////////////////////////////////////
	//defaults. = ;
	defaults.internal_container_ = undefined;


	////////////////////////////////////
	//exceptions. = ;


	////////////////////////////////////
	//methods. = ;

	// naming notes :
	// ri = route indexed
	// rai = route+action indexed

	methods.internal_ensure = function(route, action) {
		if(!_.isString(route)) throw new EE.InvalidArgument("route arg should be a string !");
		if(!_.isString(action)) throw new EE.InvalidArgument("action arg should be a string !");

		var ri_entry = this.internal_container_.ensure(route);
		if(! ri_entry.hasOwnProperty(action))
			ri_entry[action] = {};
		var rai_entry = ri_entry[action];
		return rai_entry;
	};

	methods.internal_at = function(route, action) {
		if(!_.isString(route)) throw new EE.InvalidArgument("route arg should be a string !");
		if(!_.isString(action)) throw new EE.InvalidArgument("action arg should be a string !");

		var ri_entry = this.internal_container_.at(route);

		return ri_entry ? ri_entry[action] : undefined;
	};

	methods.internal_detailed_at = function(route, action) {
		if(!_.isString(route)) throw new EE.InvalidArgument("route arg should be a string !");
		if(!_.isString(action)) throw new EE.InvalidArgument("action arg should be a string !");

		var ri_match_infos = this.internal_container_.detailed_at(route);

		// systematic
		ri_match_infos.route_found = ri_match_infos.found;
		ri_match_infos.action_found = false; // for now

		// alter result
		if (ri_match_infos.found) {
			if(ri_match_infos.found && !ri_match_infos.hasOwnProperty('payload'))
				throw new EE.InvariantNotMetError('ri_match_infos payload !');
			if(!ri_match_infos.payload.hasOwnProperty(action)) {
				ri_match_infos.found = false;
			}
			else {
				ri_match_infos.action_found = true;
				var rai_entry = ri_match_infos.payload[action];

				ri_match_infos.payload = rai_entry;

				/*if(typeof key !== 'undefined') {
					if(!rai_entry.hasOwnProperty(key)) {
						ri_match_infos.found = false;
					}
					else {
						ri_match_infos.payload = rai_entry[key];
					}
				}
				else {
					var get_data = function(key) {
						// note : rai_entry get scoped
						return rai_entry.hasOwnProperty(key) ? rai_entry[key] : undefined;
					};

					var get_and_optionally_create_data = function(key) {
						// note : rai_entry get scoped
						if(!rai_entry.hasOwnProperty(key))
							rai_entry[key] = {};
						return rai_entry[key];
					};

					ri_match_infos.payload = {
						'get_data' : get_data,
						'get_and_optionally_create_data' : get_and_optionally_create_data
					};
				}*/
			}
		}

		return ri_match_infos;
	};

	methods.ensure = function(route, action) {
		return this.internal_ensure(route, action);
	};

	methods.at = function(route, action) {
		return this.internal_at(route, action);
	};

	methods.detailed_at = function(route, action) {
		return this.internal_detailed_at(route, action);
	};

	methods.shared_detailed_at = function(route, action) {
		return this.internal_detailed_at(route, action);
	};

	////////////////////////////////////
	Object.freeze(constants);
	Object.freeze(defaults);
	Object.freeze(exceptions);
	Object.freeze(methods);

	var DefinedClass = function RESTIndexedContainer() {
		_.defaults( this, defaults );
		this.internal_container_ = RouteIndexedContainer.make_new();
	};

	DefinedClass.prototype.constants  = constants;
	DefinedClass.prototype.exceptions = exceptions;
	_.extend(DefinedClass.prototype, methods);


	////////////////////////////////////
	return {
		// objects are created via a factory, more future-proof
		'make_new': function() { return new DefinedClass(); },
		// exposing these allows inheritance
		'constants'  : constants,
		'exceptions' : exceptions,
		'defaults'   : defaults,
		'methods'    : methods
	};
}); // requirejs module
