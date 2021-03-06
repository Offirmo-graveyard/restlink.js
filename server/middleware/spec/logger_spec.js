if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'restlink/utils/chai-you-promised',
	'restlink/server/middleware/logger',
	'restlink/server/middleware/base',
	'restlink/server/core',
	'restlink/core/request',
	'network-constants/http',
	'mocha'
],
function(chai, Cyp, CUT, BaseMiddleware, ServerCore, Request, http_constants) {
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
				out.should.be.an.instanceOf(BaseMiddleware.klass);
			});

			it('should have correct default values', function() {
				var out = CUT.make_new();
				expect( out.get_denomination() ).to.eq("LoggerMW");
				expect( out.mode_ ).to.eq("simple");
			});

		}); // describe feature



		describe("request handling", function() {

			it("should log by default without hampering processing", function(signalAsyncTestFinished) {

				// this test just test that the default logger doesn't hamper request processing
				// but we can't test what was logged. See next test.
				var out = CUT.make_new();
				out.use(BaseMiddleware.make_new(function process(req, res, next) {
					res.set_to_not_implemented("Server is misconfigured. Please add middlewares to handle requests !");
					res.send();
				})); // we MUST have another handler after us since logger doesn't send the response

				var request = Request.make_new_stanford_teapot();
				var promise = out.initiate_processing(request);

				Cyp.finish_test_expecting_promise_to_be_fulfilled_with_conditions(promise, signalAsyncTestFinished, function(response) {
					response.method.should.equal('BREW');
					response.uri.should.equal('/stanford/teapot');
					response.return_code.should.equal(http_constants.status_codes.status_501_server_error_not_implemented);
					response.content.should.equal("Server is misconfigured. Please add middlewares to handle requests !");
				});
			});

			it('should log properly', function(signalAsyncTestFinished) {

				// by using a custom logging function,
				// we'll be able to check what is logged
				var buffer = "";
				var custom_log_function = function() {
					for(var i = 0; i<arguments.length; ++i) {
						buffer += (arguments[i] ? arguments[i].toString() : 'undefined');
					}
				};

				var out = CUT.make_new(custom_log_function);

				// we MUST have another handler after us since logger doesn't send the response
				out.use(BaseMiddleware.make_new(function process(req, res, next) {
					res.set_to_not_implemented("Server is misconfigured. Please add middlewares to handle requests !");
					res.send();
				}));

				var request = Request.make_new_stanford_teapot();
				var promise = out.initiate_processing(request);

				Cyp.finish_test_expecting_promise_to_be_fulfilled_with_conditions(promise, signalAsyncTestFinished, function(response) {
					var expected_buffer = request.timestamp
							+ " > request /stanford/teapot.BREW : undefined"
							+ response.timestamp
							+ ' < response to /stanford/teapot.BREW : [501] Server is misconfigured. Please add middlewares to handle requests !';
					//console.log(response);
					//console.log(expected_buffer);
					//console.log(buffer);
					response.method.should.equal('BREW');
					response.uri.should.equal('/stanford/teapot');
					response.return_code.should.equal(http_constants.status_codes.status_501_server_error_not_implemented);
					response.content.should.equal("Server is misconfigured. Please add middlewares to handle requests !");
					buffer.should.equal(expected_buffer);
				});
			});

		}); // describe feature

	}); // describe CUT
}); // requirejs module
