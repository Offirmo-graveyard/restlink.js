/* HTTP adapter class for a RESTlink client adapter
 * node.js only.
 * TODO
 * - handle JSONP
 * - handle POST with custom method
 */

if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'when',
	'http', // node only
	'url', // node only
	'restlink/core/request',
	'restlink/server/adapters/base',
	'extended-exceptions',
	'restlink/utils/serialization_utils'
],
function(_, when, http, url, Request, BaseServerAdapter, EE, SerializationUtils) {
	"use strict";

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
			// known object, give details
			// TOREVIEW confidentiality ???
			http_res.end(''
					+ 'Internal Server Error\n'
					+ 'Exception caught\n'
					+ '* name    : ' + e.name + '\n'
					+ '* message : ' + e.message + '\n'
					+ '* stack   : ' + e.stack
			);
		}
		else {
			// not a js Error, we can't give more details
			// we rely on default stringification
			http_res.end(''
					+ 'Internal Server Error\n'
					+ 'Caught : ' + e);
		}
		console.log("< [http adapter] response sent (on exception).");
	}

	// convert restlink response to HTTP response
	function format_and_send_http_response(http_res, restlink_res) {
		// generate the HTTP response
		// try/catch in case restlink_response is not what we expect
		try {
			// meta
			var meta = restlink_res.meta;
			meta = _.defaults(meta, {'Access-Control-Allow-Origin':'*'}); // mandatory for CORS
			// content : must be a String or a Buffer
			SerializationUtils.auto_serialize_content_if_needed(restlink_res);
			var type = (typeof restlink_res.content);
			if( type === 'string' ) {
				// OK !
				// add meta content-type in case if not already here
				meta = _.defaults(meta, {"Content-Type": restlink_res.content_type});
				http_res.writeHead(restlink_res.return_code, meta);
				http_res.end(restlink_res.content);
			}
			else {
				// override content-type
				meta = _.defaults({"Content-Type": "text/plain"}, meta);
				http_res.writeHead(500, {"Content-Type": "text/plain"});
				http_res.end(''
						+ 'Internal Server Error\n'
						+ "I don't know how to serialize generated response content !");
			}
			console.log("< [http adapter] response sent.");
		}
		catch (e) {
			send_http_response_on_throw(http_res, e);
		}
	}


	// this function is called by the node http server
	// on incoming request
	function server_callback(http_request, http_response) {
		// exception safety is important
		// we want to be sure to generate an error message and not crash the server
		// all non-trivial code must be enclosed by try/catch
		try {
			console.log("> [http adapter] request received...");

			// url can't be taken "as is"
			// it may contain options
			var parsed_url = url.parse(http_request.url, true);

			// create a restlink request object
			var restlink_request = Request.make_new()
					.with_url( parsed_url.pathname )
					.with_method( http_request.method );
			restlink_request.meta = http_request.headers;
			//		restlink_request.is_long_living => not possible in HTTP for now.

			// HTTP is not connected and not safe
			// we have no session unless using cookie
			// for now create a session each time
			// TODO handle session with cookies but assuming reduced security
			var restlink_session = this.restlink_core.create_session();
			restlink_session.register_request( restlink_request );

			// now deal with content (non trivial)
			if(http_request.headers.hasOwnProperty('Content-Type')) {
				restlink_request.content_type = http_request.headers['Content-Type'];
			}
			else {
				// keep the default content-type (for now, more about that below)
			}

			// how to read the content of the request...
			// This is not trivial in asynchronous code,
			// cf. http://nodejs.org/api/stream.html#stream_api_for_stream_consumers

			// REM :
			// req is an http.IncomingMessage, which is a Readable Stream
			// res is an http.ServerResponse, which is a Writable Stream

			// we want to get the data as utf8 strings
			// If you don't set an encoding, then you'll get Buffer objects
			http_request.setEncoding('utf8');

			// Readable streams emit 'data' events once a listener is added
			http_request.on('data', function (chunk) {
				if(typeof restlink_request.content === 'undefined')
					restlink_request.content = chunk; // init
				else
					restlink_request.content += chunk; // addition
			});

			// the 'end' event tells you that you have entire body
			var restlink_core = this.restlink_core; // closure
			http_request.on('end', function () {
				// try/catch of course, exception safety
				try {
					// finish dealing with content
					// 1) attempt content-type guess **if needed**
					if(restlink_request.content && !http_request.headers.hasOwnProperty('Content-Type')) {
						// try to guess the content by attempting a JSON deserialisation
						try {
							restlink_request.content = JSON.parse(restlink_request.content);
							restlink_request.content_type = "application/json";
						}
						catch(e) {
							// JSON parsing failed : this is no (valid) JSON
							// treat it as default
							restlink_request.content_type = "application/octet-stream"; // the default, unknown
						}
					}

					// 2) create/fuse content from url params if any
					if(Object.getOwnPropertyNames(parsed_url.query).length !== 0) {
						// there are params in the url
						// merge them with content (if any)
						// +decode the special "method" used to override servers that forbid non-standard HTTP methods
						// TODO
						throw new EE.NotImplemented("url params");
					}
					// REM : may throw if error
					var promise = restlink_core.process_request( restlink_request );
					// should no longer throw ...in this context at last. (callbacks are another story)
					promise.then( function(restlink_response) {
						format_and_send_http_response(http_response, restlink_response);
					},
					function(e){
						// this should never happen, error must generate an error response !
						http_response.writeHead(500, {"Content-Type": "text/plain"});
						http_response.end(''
								+ 'Internal Server Error\n'
								+ 'No response generated ! (This should never happen)'
								+ 'Error thrown :' + e
						);
					});}
				catch (e) {
					send_http_response_on_throw(http_response, e);
				}
			});
		}
		catch (e) {
			send_http_response_on_throw(http_response, e);
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
	// TOREVIEW this method is async, allow a callback ?
	methods.shutdown = function() {

		// REM : http.close() is async
		var this_ = this; // closure
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

		var this_ = this; // closure
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
