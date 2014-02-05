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

	// create a custom exception for JSON problems
	// to make things clearer
	var JsonSerializationError = EE.create_custom_error("JsonSerializationError", EE.RuntimeError);


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

			// auto serialization for convenience.
			if(typeof obj.content === 'object') {
				// Error objects are special objects : JSON.stringify doesn't work on them
				// http://stackoverflow.com/questions/18391212/is-it-not-possible-to-stringify-an-error-using-json-stringify
				if(obj.content instanceof Error) {
					obj.content = ''
							+ 'Internal Server Error\n'
							+ 'Exception caught\n'
							+ '* name    : ' + e.name + '\n'
							+ '* message : ' + e.message + '\n'
							+ '* stack   : ' + e.stack;
					/*
					var error_as_plain_object = {};
					Object.getOwnPropertyNames(obj.content).forEach(function(key) {
						error_as_plain_object[key] = obj.content[key];
					});
					obj.content = JSON.stringify(error_as_plain_object);
					*/
				}
				else {
					obj.content = JSON.stringify(obj.content);
				}
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
				if(obj.content.length === 0)
					obj.content = undefined;
				else {
					// enclosing try/catch to make things clearer
					try {
						obj.content = JSON.parse(obj.content);
					}
					catch(e) {
						throw new JsonSerializationError(e); // cast
					}
				}
			}
		}
	}

	return {
		// 'class' methods
		auto_serialize_content_if_needed: auto_serialize_content_if_needed,
		auto_deserialize_content_if_needed: auto_deserialize_content_if_needed
	};

}); // requirejs module
