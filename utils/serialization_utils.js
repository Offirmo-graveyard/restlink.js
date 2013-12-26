/* Utilities for serializing and deserializing
 * requests or responses
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'extended-exceptions'
],
function(_, EE) {
	"use strict";

	// Turn whatever JSON-like value
	// into a proper stringified JSON string.
	// The goal is to avoid pain for the user.
	function auto_serialize_json_content_if_needed(obj) {
		if(obj.content_type.endsWith('json')) {
			if(typeof obj.content === 'string') {
				// assume that the content is already serialized. Correct ?
				return;
			}

			if(typeof obj.content === 'undefined') {
				obj.content = '';
				return;
			}

			if(typeof obj.content === 'object') {
				// TODO check more if correct JSON
				// auto serialization for convenience
				obj.content = JSON.stringify(obj.content);
				return;
			}

			throw new EE.InvalidArgument('A request or a reponse with content-type set to JSON contains a non-JSON value !');
		}
	}

	function auto_serialize_content_if_needed(obj) {
		auto_serialize_json_content_if_needed(obj);

		if (typeof obj.content === 'undefined') {
			obj.content = '';
			return;
		}

		// final check
		if (typeof obj.content !== 'string') {
			throw new EE.InvalidArgument("Request or Response content is not serialized and I don't know how to automatically serialize it !");
		}
	}

	function auto_deserialize_content_if_needed(obj) {
		if(obj.content_type.endsWith('json')) {
			if(typeof obj.content === 'string') {
				// auto deserialization for convenience
				if(obj.content.length == 0)
					obj.content = undefined;
				else
					obj.content = JSON.parse(obj.content);
			}
		}
	}

	return {
		// 'class' methods
		auto_serialize_content_if_needed: auto_serialize_content_if_needed,
		auto_deserialize_content_if_needed: auto_deserialize_content_if_needed
	};

}); // requirejs module
