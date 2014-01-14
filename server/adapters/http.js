/* HTTP adapter class for a RESTlink client adapter
 * node.js only.
 */

if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'when',
	'restlink/core/request',
	'restlink/server/adapters/base',
	'extended-exceptions',
	'restlink/utils/serialization_utils'
],
function(_, when, Request, BaseServerAdapter, EE, SerializationUtils) {
	"use strict";

	var http = require('http');
	var url = require("url");
	var Parent = BaseServerAdapter;

	////////////////////////////////////
	var constants  = {};
	var defaults   = {};
	var exceptions = {};
	var methods    = {};


	////////////////////////////////////
	//constants. = ;


	////////////////////////////////////
	//defaults. = ;
	defaults.listening_port = 8080;

	methods.init = function(options) {
		// init of member objects
		options = options || {};

		this.listening_port = options.port || defaults.listening_port;
		this.restlink_core = undefined;
		this.http_server = undefined;
	};


	////////////////////////////////////
	//exceptions. = ;


	////////////////////////////////////

	function send_http_response_on_throw(http_res, e) {
		// this code must be ultra-safe !

		http_res.writeHead(500, {"Content-Type": "text/plain"});

		if(e instanceof Error) {
			// give details
			http_res.end(''
					+ 'Internal Server Error\n'
					+ 'Exception caught\n'
					+ '* name    : ' + e.name + '\n'
					+ '* message : ' + e.message + '\n'
					+ '* stack   : ' + e.stack
			);
		}
		else {
			// we can't give more details
			http_res.end(''
					+ 'Internal Server Error\n'
					+ 'Caught : ' + e);
		}
	}

	function format_and_send_http_response(http_res, restlink_res) {
		// generate the HTTP response
		// try/catch in case restlink_response is not what we expect
		try {
			// content : must be a String or a Buffer
			SerializationUtils.auto_serialize_content_if_needed(restlink_res);
			var type = (typeof restlink_res.content);
			if( type === 'string' ) {
				// OK !
				http_res.writeHead(restlink_res.return_code, {"Content-Type": restlink_res.content_type});
				// TODO meta
				http_res.end(restlink_res.content);
			}
			else {
				http_res.writeHead(500, {"Content-Type": "text/plain"});
				http_res.end(''
						+ 'Internal Server Error\n'
						+ "I don't know how to serialize generated response content !");
			}
		}
		catch (e) {
			send_http_response_on_throw(http_res, e);
		}
	}

	function server_callback(http_req, http_res) {
		// exception safety is important
		// we want to be sure to generate an error message and not crash the server
		// all non-trivial code must be enclosed by try/catch
		try {
			// url can't be taken "as is"
			// it may contain options
			var parsed_url = url.parse(http_req.url, true);

			// create a restlink request object
			var restlink_request = Request.make_new()
					.with_url( parsed_url.pathname )
					.with_method( http_req.method );
			restlink_request.meta = http_req.headers;
			//		restlink_request.is_long_living = ??;

			// HTTP is not connected and not safe
			// we have no session unless using cookie
			// for now create a session each time
			var restlink_session = this.restlink_core.create_session();
			restlink_session.register_request( restlink_request );

			// now deal with content (non trivial)
			if(http_req.headers.hasOwnProperty('Content-Type')) {
				restlink_request.content_type = http_req.headers['Content-Type'];
			}
			else {
				// keep the default (for now, more about that below)
			}

			// how to read the content of the request...
			//cf. http://nodejs.org/api/stream.html#stream_api_for_stream_consumers

			// req is an http.IncomingMessage, which is a Readable Stream
			// res is an http.ServerResponse, which is a Writable Stream

			// we want to get the data as utf8 strings
			// If you don't set an encoding, then you'll get Buffer objects
			http_req.setEncoding('utf8');

			// Readable streams emit 'data' events once a listener is added
			http_req.on('data', function (chunk) {
				if(typeof restlink_request.content === 'undefined')
					restlink_request.content = chunk; // init
				else
					restlink_request.content += chunk;
			});

			// the end event tells you that you have entire body
			var restlink_core = this.restlink_core; // closure
			http_req.on('end', function () {
				try {
					// finish dealing with content
					// 1) attempt content-type guess if needed
					if(! http_req.headers.hasOwnProperty('Content-Type')) {
						// try to guess the content by attempting a JSON deserialisation
						try {
							restlink_request.content = JSON.parse(restlink_request.content);
							restlink_request.content_type = "application/json";
						}
						catch(e) {
							// this is no JSON even
							// treat it as default
							restlink_request.content_type = "application/octet-stream"; // the default, unknown
						}
					}
					// 2) create/fuse content from url params if any
					if(Object.getOwnPropertyNames(parsed_url.query).length !== 0) {
						// there are params in the url
						// merge them with content (if any)
						// +decode the special "method" used to override servers that forbid non-standard HTTP methods
						throw new EE.NotImplementedError("url params");
					}
					// REM : may throw if error
					var promise = restlink_core.process_request( restlink_request );
					// should no longer throw ...in this context at last. (callbacks are another story)
					promise.spread(function(restlink_req, restlink_res) {
						format_and_send_http_response(http_res, restlink_res);
					});
					promise.otherwise(function(){
						// this should never happen, error must generate an error response !
						http_res.writeHead(500, {"Content-Type": "text/plain"});
						http_res.end(''
								+ 'Internal Server Error\n'
								+ 'No response generated ! (This should never happen)'
						);
					});}
				catch (e) {
					send_http_response_on_throw(http_res, e);
				}
			});
		}
		catch (e) {
			send_http_response_on_throw(http_res, e);
		}
	}

	methods.startup = function(core) {
		console.log("* Starting HTTP server for restlink adapter...");

		// call parent
		Parent.methods.startup.apply(this, arguments);

		// start listening and serving
		this.http_server.listen(this.listening_port);
		console.log("* Listening to HTTP port " + this.listening_port + "...");
	};
	methods.shutdown = function() {
		var this_ = this;

		// REM : close() is async
		this.http_server.close(function() {
			// release ref
			this_.http_server = undefined;

			// call parent
			Parent.methods.shutdown.apply(this_);
		});
	};

	////////////////////////////////////
	Object.freeze(constants);
	Object.freeze(defaults);
	Object.freeze(exceptions);
	Object.freeze(methods);

	var DefinedClass = function RestlinkServerHTTPAdapter(options) {
		_.defaults( this, defaults ); // TODO enhance

		// call parent constructor (by choice)
		Parent.klass.prototype.constructor.apply(this, arguments);

		// other inits...
		methods.init.apply(this, arguments);

		var this_ = this; // for closure
		var server_callback_closure = function(http_req, http_res) {
			return server_callback.apply(this_, arguments);
		};
		this.http_server = http.createServer(server_callback_closure);
	};

	// class inheritance via prototype chain
	DefinedClass.prototype = Object.create(Parent.klass.prototype);
	DefinedClass.prototype.constructor = DefinedClass;

	DefinedClass.prototype.constants  = constants;
	DefinedClass.prototype.exceptions = exceptions;
	_.extend(DefinedClass.prototype, methods);


	////////////////////////////////////
	return {
		// objects are created via a factory, more future-proof
		'make_new'   : function(options) { return new DefinedClass(options); },
		// but we still expose the constructor to allow class inheritance
		'klass'      : DefinedClass,
		// exposing these allows convenient syntax and also prototypal inheritance
		'constants'  : constants,
		'exceptions' : exceptions,
		'defaults'   : defaults,
		'methods'    : methods
	};
}); // requirejs module
