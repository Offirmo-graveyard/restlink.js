/* A generic Restlink middleware
 * Meant to be inserted in a server or in a middleware chain
 * can handle requests or dispatch them to next middleware object.
 * API derived from express.js / connect.js for least surprise.
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'when',
	'extended-exceptions',
	'base-objects/mixins/named',
	'restlink/server/middleware/request_enrichments',
	'restlink/server/middleware/response_enrichments'
],
function(_, when, EE, NamedObject, RequestEnricher, ResponseEnricher) {
	"use strict";


	////////////////////////////////////
	var constants  = {};
	var defaults   = {};
	var exceptions = {};
	var methods    = {};


	////////////////////////////////////
	//constants. = ;


	////////////////////////////////////
	defaults.denomination_ = "UnknownMW";

	// default implementation, to be overriden
	// @param request : a request object that will be passed along. Can be anything.
	// @param response : a response object that will be passed along. Can be anything, will have been "enriched" with the middleware special methods.
	// @param next : a function to call to transfer to next middleware. Will throw if none.
	defaults.processing_function_ = function base_middleware_default_processing_function(request, response, next) {
		if(this.next_middleware_) {
			// pass to next
			next();
		}
		else {
			response.send();
		}
	};
	defaults.back_processing_function_ = undefined; // none by default or would cause overhead
	defaults.next_middleware_ = undefined; //< if chain, the middleware just after us to whom we may transfer the processing

	////////////////////////////////////
	//exceptions. = ;


	////////////////////////////////////
	//methods. = ;


	// add a chained middleware after this one.
	// will be inserted at the end of current chain if any.
	methods.use = function(middleware) {
		if(!this.next_middleware_) {
			this.next_middleware_ = middleware;
		}
		else {
			// follow the chain
			this.next_middleware_.use(middleware);
		}
	};

	methods.register_back_function_ = function(request, back_function, chain_depth) {
		request.middleware_.back_processing_chain_.push({
			'func' : back_function,
			'this_': this,
			'depth': chain_depth // the depth in the full MW chain, useful for debug
		});
	};

	// implementation of method "next" which is provided as a param
	// if a back function is given, it'll have to call send() again to continue the processing.
	function next_implementation(request, response, optional_back_function) {
		try {
			if(!this.next_middleware_) {
				// no middleware after us !
				// we should NOT have called next, then !
				// Note : for now, we take it as the user's responsibility to provide a final,
				// always sending middleware.
				throw new EE.IllegalState("Can't forward to next middleware, having none !");
			}

			// invariant check : next should no longer be used if the response has been sent (using send())
			// we can check that
			if(response.middleware_.back_processing_chain_index >= 0) {
				// wrong !
				// Either means a bug,
				// or some user code :
				// - incorrectly called next() after send
				// - incorrectly called next() in a back processing function
				throw new EE.InvariantNotMet("Middleware next() was called in a wrong context !");
			}

			// Note : current mw default back function, if any, was already added.
			// This arg is for adding an "extra".
			if(typeof optional_back_function !== "undefined") {
				if(typeof optional_back_function !== "function")
					throw new EE.InvalidArgument("Back function arg should be a function !");
				this.register_back_function_(request, optional_back_function, response.middleware_.processing_chain_index);
			}
		}
		catch(e) {
			response.set_to_internal_error(e);
			response.send();
			return;
		}

		this.next_middleware_.process_request_(request, response);
	}

	// Actual implementation of the "send" function.
	// send() may be called multiple times from back functions,
	// and is made to start, resume or complete processing.
	// It uses state infos stored in the response
	// and also general infos from the request.
	function send_implementation(request, response) {
		// We must go back through the processing chain to finish the handling.
		// We MAY be already in the back process.
		// We also must handle this in a async-safe manner.

		try {
			var mwdata = response.middleware_;

			// is the back processing initiated ?
			if(mwdata.back_processing_chain_index < 0) {
				// start of the back processing
				// first we freeze (may be already frozen) the back processing chain
				Object.freeze(request.middleware_.back_processing_chain_);
				// then we set initiate values
				mwdata.back_processing_chain_index = request.middleware_.back_processing_chain_.length;
			}

			// We are now sure that the back processing is initiated.
			// Is it finished ?
			if(mwdata.back_processing_chain_index === 0) {
				// back processing is finished. Time to send the response.
				mwdata.processing_chain_index = 0;
				// add debug metas
				// TODO add a debug switch
				response.meta['Restlink-Debug-Traversed-Middlewares'] = response.middleware_.traversed_mw_list.join(', ');
				// Two pathes according to the request mode
				if(request.is_long_living) {
					// This response was server-generated and nobody is specifically waiting for it.
					// Call a special callback for this case.
					// TODO
					throw new Error("Server-generated responses ar not fully implemented !");
				}
				// in any case, resolve the promise
				mwdata.final_deferred.resolve(response);
			}
			else {
				// Back processing chain is not finished.
				// Advance through it.
				mwdata.back_processing_chain_index--;
				var callback_data = request.middleware_.back_processing_chain_[mwdata.back_processing_chain_index];
				mwdata.processing_chain_index = callback_data['depth'];
				console.log(Array(mwdata.processing_chain_index).join(" ")+"<- starting " + this.denomination_ + ' back processing...');
				callback_data.func.call(
						callback_data.this_,
						request, response
				);
			}
		}
		catch(raw_e) {
			// Try to signal the error.
			// Let's be extra-safe to not rethrow.

			// Btw retype the error
			var e = new EE.RuntimeError( raw_e );

			// Assume the basics : response exists
			var signaled = false;

			if(   response
				&& response.middleware_
				&& response.middleware_.final_deferred)
			{
				// try to signal via the deferred
				response.middleware_.final_deferred.reject( e );
				if(!request.is_long_living)
					signaled = true; // if long_living we're pretty sure that no one is waiting on the promise
			}

			if(   !signaled
				&& request
				&& request.get_session
				&& request.get_session())
			{
				var session = request.get_session();
				if(   session
					&& session.get_server_core
					&& session.get_server_core())
				{
					var core = session.get_server_core();
					// try to signal via a dedicated core function
					core.signal_out_of_chain_error(e, request, response);
					signaled = true;
				}
			}
			if(!signaled) {
				// Rethrow, better than swallowing it.
				// But at last subtype it.
				throw e;
			}
		}
	}


	// wrapper around the user-defined processing function
	// @see processing_function_
	methods.process_request_ = function(request, response) {
		try {
			// update the depth
			response.middleware_.processing_chain_index++;
			response.middleware_.traversed_mw_list.push(this.get_denomination());

			// TODO improve
			console.log(Array(response.middleware_.processing_chain_index).join(" ")+"-> starting " + this.denomination_ + ' processing...');

			// create the "next" parameter
			var current_mw = this; // closure
			var next = function(optional_back_function) {
				// see above
				next_implementation.call(
						current_mw,
						request, response, optional_back_function);
			};

			// register the default back function if any
			if(typeof this.back_processing_function_ !== "undefined") {
				this.register_back_function_(request, this.back_processing_function_, response.middleware_.processing_chain_index);
			}

			// call the (hopefully) user-defined processing function
			this.processing_function_(request, response, next);
		}
		catch(e) {
			response.set_to_internal_error(e);
			response.send();
		}
	};


	// Launch the middleware processing chain.
	// should only be called on the head middleware !
	// Not mandatory if you want to initialize the middleware manually
	methods.initiate_processing = function(request) {

		// add some utility methods and private data to the request
		RequestEnricher.process(request);

		// create a response
		// AND also add some utility methods and private data to the response
		var response = this.prepare_blank_response_for_this_request_(request);
		// note usage of closure
		var this_ = this;
		response.send = function() {
			send_implementation.call( this_, request, response );
		};

		// now use the usual function.
		this.process_request_(request, response);

		return response.middleware_.final_deferred.promise; // REM was added by prepare_blank_response_for_this_request_()
	};

	methods.prepare_blank_response_for_this_request_ = function(request) {
		var response = request.make_response(); // REM this response is set to "internal error" by default

		// we add our own special methods and data to the response
		ResponseEnricher.process(response, request);

		return response;
	};



	////////////////////////////////////

	// inheritance

	// prototypal inheritance from StartableObject
	_.defaults(constants, NamedObject.constants);
	_.defaults(defaults,  NamedObject.defaults);
	_.defaults(methods,   NamedObject.methods);
	// exceptions ?

	Object.freeze(constants);
	Object.freeze(exceptions);
	Object.freeze(defaults);
	Object.freeze(methods);

	var DefinedClass = function RestlinkMiddlewareBase(process_func, process_back_func) {
		_.defaults( this, defaults );

		// other inits...
		if(typeof process_func !== "undefined") {
			this.processing_function_ = process_func; // replace default
		}
		if(typeof process_back_func !== "undefined") {
			this.back_processing_function_ = process_back_func;
		}
	};

	DefinedClass.prototype.constants  = constants;
	DefinedClass.prototype.exceptions = exceptions;
	_.extend(DefinedClass.prototype, methods);


	////////////////////////////////////
	return {
		// objects are created via a factory, more future-proof
		'make_new'   : function(process_func, process_back_func) { return new DefinedClass(process_func, process_back_func); },
		// but we still expose the constructor to allow class inheritance
		'klass'      : DefinedClass,
		// exposing these allows convenient syntax and also prototypal inheritance
		'constants'  : constants,
		'exceptions' : exceptions,
		'defaults'   : defaults,
		'methods'    : methods
	};
}); // requirejs module
