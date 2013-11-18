if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'restlink/server/middleware/logger',
	'restlink/server/middleware/base',
	'restlink/server/middleware/no_middleware',
	'restlink/server/core',
	'restlink/core/request',
	'network-constants/http',
	'mocha'
],
function(chai, CUT, BaseRequestHandler, DefaultRequestHandler, ServerCore, Request, http_constants) {
	"use strict";

	var expect = chai.expect;
	chai.should();
	chai.Assertion.includeStack = true; // defaults to false


	describe('Restlink logger middleware', function() {


		describe('instantiation', function() {

			it('should be instantiable', function() {
				var out = CUT.make_new();
				out.should.exist;
				out.should.be.an('object');
			});

			it('should have correct inheritance', function() {
				var out = CUT.make_new();
				out.should.be.an.instanceOf(BaseRequestHandler.klass);
			});

		}); // describe feature



		describe("request handling", function() {

			it("should log by default without hampering processing", function(signalAsyncTestFinished) {

				// this test just test that the default logger doesn't hamper request processing
				// but we can't test what was logged. See next test.
				var out = CUT.make_new();
				out.use( DefaultRequestHandler.make_new() ); // we MUST have another handler after us since logger doesn't send the response

				var trans = {};
				var request = Request.make_new_stanford_teapot();
				var promise = out.head_process_request(trans, request);

				promise.spread(function on_success(context, request, response) {
					response.method.should.equal('BREW');
					response.uri.should.equal('/stanford/teapot');
					response.return_code.should.equal(http_constants.status_codes.status_501_server_error_not_implemented);
					response.content.should.equal("Server is misconfigured. Please add middlewares to handle requests !");
					signalAsyncTestFinished();
				});
				promise.otherwise(function on_failure(context, request, response){
					expect(false).to.be.ok;
				});
			});

			it('should log properly', function(signalAsyncTestFinished) {

				// by using a custom logging function,
				// we'll be able to check what is logged
				var buffer = "";
				var custom_log_function = function() {
					for(var i = 0; i<arguments.length; ++i) {
						buffer += arguments[i].toString();
					}
				};

				var out = CUT.make_new(custom_log_function);
				out.use( DefaultRequestHandler.make_new() ); // we MUST have another handler after us since logger doesn't send the response

				var trans = {};
				var request = Request.make_new_stanford_teapot();
				var promise = out.head_process_request(trans, request);

				promise.spread(function on_success(context, request, response) {
					var exepected_buffer = request.date
							+ " > request /stanford/teapot.BREW(undefined)"
							+ response.date
							+ ' < response to /stanford/teapot.BREW(...) : [501] "Server is misconfigured. Please add middlewares to handle requests !"';
					//console.log(response);
					//console.log(exepected_buffer);
					//console.log(buffer);
					response.method.should.equal('BREW');
					response.uri.should.equal('/stanford/teapot');
					response.return_code.should.equal(http_constants.status_codes.status_501_server_error_not_implemented);
					response.content.should.equal("Server is misconfigured. Please add middlewares to handle requests !");
					buffer.should.equal(exepected_buffer);
					signalAsyncTestFinished();
				});
				promise.otherwise(function on_failure(context, request, response){
					expect(false).to.be.ok;
				});
			});

		}); // describe feature

	}); // describe CUT
}); // requirejs module
