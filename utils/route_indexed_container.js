/* A container indexed by urls
 * work with both generic /photo/:id and actual /photo/25 urls.
 * Used as a router.
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'extended-exceptions',
	'restlink/utils/string_generics_shim'
],
function(_, EE) {
	"use strict";


	////////////////////////////////////
	var constants  = {};
	var defaults   = {};
	var exceptions = {};
	var methods    = {};


	////////////////////////////////////
	//constants. = ;
	constants.max_route_length       = 200;
	constants.max_segment_length     = 30;
	constants.max_segment_count      = 30;
	constants.id_marker              = ':id';
	constants.segment_control_regexp = /\w+/; // too tight ?
	constants.child_member_radix     = "child:";



	////////////////////////////////////
	defaults.root_node_ = undefined; //< we'll use a tree


	////////////////////////////////////
	exceptions.MalformedRouteError = EE.create_custom_error("MalformedRouteError", EE.RuntimeError);
	Object.freeze(exceptions.MalformedRouteError);
	// route too long must have its own exception
	// because it has a known status code
	exceptions.RouteTooLongError  = EE.create_custom_error("RouteTooLongError", exceptions.MalformedRouteError);
	Object.freeze(exceptions.RouteTooLongError);


	////////////////////////////////////
	// private methods
	// we store children as members for simplicity
	// however, we wouldn't store them "as is"
	function compute_child_member_name(segment) {
		return constants.child_member_radix + segment;
	}

	///
	constants.id_member_name = compute_child_member_name(constants.id_marker);

	// node constructor
	function Node(parent, segment) {
		this.segment_ = segment;
		this.is_id_ = (segment === constants.id_marker);
		this.parent_ = parent; // beware of circular references
		this.rank_ = typeof parent === 'undefined' ? 0 : parent.rank_ + 1;
		this.payload_ = {};

		this.is_id = function() { return this.is_id_; };
		this.has_id_child = function() {
			return (constants.id_member_name in this);
		};
	}

	function validate_segment_(segment) {
		if(segment !== constants.id_marker) {

			if(segment.length <= 0)
				throw new exceptions.MalformedRouteError("Route malformed : empty segment !");

			if(segment.length > constants.max_segment_length)
				throw new exceptions.MalformedRouteError("Route malformed : segment too long !");

			if(!segment.match(constants.segment_control_regexp))
				throw new exceptions.MalformedRouteError("Route malformed : illegal segment format !");
		}
		return true;
	}

	function check_and_split_route_into_segments_(route) {
		// special cases
		if(route === "/")
			return []; // empty
		if(route === "*")
			return [ '*' ]; // never matching

		if(route.length > constants.max_route_length)
			throw new exceptions.MalformedRouteError("Route malformed : route too long !");

		if(! route.startsWith("/") )
			throw new exceptions.MalformedRouteError("Route malformed : missing start !");

		route = route.slice(1); // to skip first '/' which complicate the splitting

		if(route.endsWith("/")) {
			// trailing slash is allowed
			// however we remove it to ease parsing
			route = route.slice(0, - 1);
		}

		// we can now use standard lib split()
		return route.split('/', constants.max_segment_count + 1);
	}


	////////////////////////////////////
	// read only, no creation
	// may throw
	methods.get_node_ = function(route) {
		var current_node = this.root_node_;

		var segments = check_and_split_route_into_segments_(route);

		_.every(segments, function(segment) {

			var node_name = compute_child_member_name(current_node.has_id_child() ? constants.id_marker : segment);

			if( node_name in current_node) {
				current_node = current_node[node_name];
			}
			else {
				current_node = undefined;
				return false; // will stop the loop
			}
			return true;
		});

		return current_node; // may be undefined
	};

	// read and write as parametered
	methods.find_and_optionally_create_node_ = function(route, ids_allowed, creation_allowed) {

		/// check params
		if(!_.isString(route)) throw new EE.InvalidArgument("route arg should be a string !");
		if(route.length > constants.max_route_length) throw new exceptions.RouteTooLongError();

		if (typeof ids_allowed === 'undefined') { ids_allowed = false; }
		if(!_.isBoolean(ids_allowed)) throw new EE.InvalidArgument("ids_allowed arg should be a bool !");
		if (typeof creation_allowed === 'undefined') { creation_allowed = false; }
		if(!_.isBoolean(creation_allowed)) throw new EE.InvalidArgument("creation_allowed arg should be a bool !");

		/// init
		var current_node = this.root_node_;
		var segments = check_and_split_route_into_segments_(route);
		if(segments.length === constants.max_segment_count + 1) // indicate maximum was reached
			throw new exceptions.MalformedRouteError("Route malformed : route too complex !");

		///////
		var match_result = {
			found: true, // for now, by default
			last_segment_type: 'fixed', // root segment for now, will be overwritten
			last_id: undefined,
			segments: [],
			ids: {},
			payload: current_node.payload_ // root segment for now, will be overwritten
		};

		var index = 0;

		// fill data for root node which always match but has no "segment"
		match_result.segments[index] = {
			segment : current_node.segment_,
			type    : 'fixed',
			value   : current_node.segment_,
			payload : current_node.payload_,
			internal_node : current_node
		};
		index++;

		/// iterate on route elements
		_.every(segments, function(segment) {

			// basic checks
			// ':id' is for *creating* a route, it should not appear when *matching* a route
			if(!ids_allowed && segment === constants.id_marker)
				throw new exceptions.MalformedRouteError("Route malformed : incorrect " + constants.id_marker + " segment !");
			if(segment.length === 0)
				throw new exceptions.MalformedRouteError("Route malformed : empty segment !");

			// prepare match infos for this segment
			var segment_infos = {
				segment: undefined,
				type   : undefined,
				value  : segment,
				internal_node : undefined
			};
			match_result.segments[index] = segment_infos;

			// is this segment already known ?
			var member_name = compute_child_member_name(segment);
			if( member_name in current_node) {
				// yes, this segment is known, match him
				current_node = current_node[member_name];
			}
			else if ( !creation_allowed && current_node.has_id_child() ) {
				// not known as is, but we can't create it
				// and there is a joker "id" segment which match everything
				// -> match this as an id
				current_node = current_node[constants.id_member_name];
			}
			else
			{
				// this segment is not known. create it ?
				if(creation_allowed) {
					validate_segment_(segment); // will throw if incorrect
					var new_node = new Node(current_node, segment);
					if(new_node.is_id()) {
						if(current_node.is_id())
							throw new exceptions.MalformedRouteError("Route malformed : a route can't have several consecutive ids !");
						if(current_node.rank_ === 0)
							throw new exceptions.MalformedRouteError("Route malformed : root can't be followed by an id !");
					}
					current_node[member_name] = new_node;
					// and match it
					current_node = new_node;
				}
				else {
					// not found, and creation is not allowed
					// -> no match !
					match_result.found = false;
					current_node = undefined;
					return false; // will stop the loop
				}
			}

			// fill segment infos
			segment_infos.internal_node = current_node;
			segment_infos.payload = current_node.payload_;
			match_result.payload = current_node.payload_; // overwritten until the end
			if(current_node.is_id()) {
				segment_infos.type    = 'id';
				// REM : invariant : :id segments always have a parent
				segment_infos.segment = current_node.parent_.segment_;
				// store additional id infos
				match_result.last_id = segment;
				match_result.ids[segment_infos.segment] = segment;
			}
			else {
				segment_infos.type    = 'fixed';
				segment_infos.segment = current_node.segment_;
			}
			match_result.last_segment_type = segment_infos.type;
			index++;
			return true; // continue the loop
		});

		if(!match_result.found)
			match_result.payload = undefined;

		return match_result;
	};

	// create if needed
	// and returns the payload
	methods.ensure = function(route) {
		var match_infos = this.find_and_optionally_create_node_(route, true, true);
		var last_node = match_infos.segments[match_infos.segments.length-1].internal_node;
		return last_node.payload_; // allow immediate modification
	};

	// returns the payload
	// do not create if missing
	methods.at = function(route) {
		var node = this.get_node_(route);
		return node ? node.payload_ : undefined;
	};

	// returns the payload inside an objects along with other match infos
	methods.detailed_at = function(route) {
		return this.find_and_optionally_create_node_(route, false, false);
	};



	////////////////////////////////////
	Object.freeze(constants);
	Object.freeze(defaults);
	Object.freeze(exceptions);
	Object.freeze(methods);

	var DefinedClass = function RouteIndexedContainer() {
		_.defaults( this, defaults );
		this.root_node_ = new Node(undefined, "/"); // '/' ~discutable
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
