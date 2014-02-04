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

		// enrich returned ri_match_infos

		// systematic
		ri_match_infos.route_found = ri_match_infos.found;
		ri_match_infos.action_found = false; // for now
		// is there any action at all ?
		// (useful for generating correct error messages)
		ri_match_infos.found_no_actions_at_all = true; // for now

		// alter result
		if (ri_match_infos.found) {
			if(ri_match_infos.found && !(ri_match_infos.hasOwnProperty('payload') && ri_match_infos.payload))
				throw new EE.InvariantNotMet('ri_match_infos payload !');
			if(!ri_match_infos.payload.hasOwnProperty(action)) {
				ri_match_infos.found = false;
				ri_match_infos.found_no_actions_at_all = (Object.getOwnPropertyNames(ri_match_infos.payload).length === 0);
			}
			else {
				ri_match_infos.action_found = true;
				var rai_entry = ri_match_infos.payload[action];

				ri_match_infos.found_no_actions_at_all = false; // obviously
				ri_match_infos.payload = rai_entry;
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
