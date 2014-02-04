if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'restlink/utils/chai-you-promised',
	'when',
	'restlink/server/middleware/callback',
	'restlink/server/middleware/base',
	'restlink/server/rest_target_indexed_shared_container',
	'restlink/server/spec/debug_core',
	'restlink/core/request',
	'network-constants/http',
	'mocha'
],
function(chai, Cyp, when, CUT, BaseMiddleware, RestIndexedContainer, DebugCore, Request, http_constants) {
	"use strict";

	var expect = chai.expect;
	chai.should();
	chai.Assertion.includeStack = true; // defaults to false


	describe("Restlink Callback Middleware", function() {


		describe("instantiation", function() {

			it("should be instantiable", function() {
				var out = CUT.make_new();
				expect( out ).to.exist;
				expect( out ).to.be.an('object');
			});

			it("should have correct inheritance", function() {
				var out = CUT.make_new();
				out.should.be.an.instanceOf(BaseMiddleware.klass);
			});

		}); // describe feature



		describe("request handling", function() {


			it("should allow setting callbacks", function() {
				var out = CUT.make_new();
				var ric = RestIndexedContainer.make_new();

				var test_callback = function() {}; // fake function, no need for more for now

				// should not cause errors (actual handling tested later)
				out.add_callback_handler(ric, "/stanford/teapot", "BREW", test_callback);
				out.add_callback_handler(ric, "/firm/:id",        "GET",  test_callback);
			});


			it("should correctly call the appropriate callback", function(signalAsyncTestFinished) {
				var out = CUT.make_new();

				var core = DebugCore.make_new();
				core.use(out);
				var session = core.startup_and_create_session();


				var teapot_BREW_callback = function (request, response) {
					response.set_to_error(
							http_constants.status_codes.status_400_client_error_bad_request,
							"I'm a teapot !");
					response.send();
				};

				var firm_GET_callback = function(request, response) {
					response.return_code = http_constants.status_codes.status_200_ok;
					response.content = "I'm here !";
					response.send();
				};

				var payload1 = out.add_callback_handler(core.rest_indexed_shared_container, "/stanford/teapot", "BREW", teapot_BREW_callback);
				expect( payload1).to.be.an.object;
				var payload2 = out.add_callback_handler(core.rest_indexed_shared_container, "/firm/:id",        "GET",  firm_GET_callback);
				expect( payload2).to.be.an.object;

				var request = Request.make_new_stanford_teapot();
				session.register_request(request);
				var promise1x = core.process_request(request);
				var promise1 = Cyp.filter_promise_ensuring_fulfilled_with_conditions(promise1x, function(response) {
					response.method.should.equal("BREW");
					response.uri.should.equal("/stanford/teapot");
					response.return_code.should.equal(http_constants.status_codes.status_400_client_error_bad_request);
					expect(response.content).to.equals("I'm a teapot !");
				});

				var request2 = Request.make_new();
				request2.uri = '/firm/ACME';
				request2.method = 'GET';
				session.register_request(request2);
				var promise2x = core.process_request(request2);
				var promise2 = Cyp.filter_promise_ensuring_fulfilled_with_conditions(promise2x, function(response) {
					response.method.should.equal("GET");
					response.uri.should.equal("/firm/ACME");
					response.return_code.should.equal(http_constants.status_codes.status_200_ok);
					expect(response.content).to.equals("I'm here !");
				});

				Cyp.finish_test_expecting_all_those_promises_to_be_fulfilled( [promise1, promise2], signalAsyncTestFinished );
			});


			it("should control callbacks behaviour");
			// TODO add a spy on returned promise to check params type


			it("should forward to delegate when unknown route", function(signalAsyncTestFinished) {
				var out = CUT.make_new();

				var core = DebugCore.make_new();
				core.use(out);
				core.use(BaseMiddleware.make_new(function process(req, res, next) {
					res.set_to_not_implemented("Server is misconfigured. Please add middlewares to handle requests !");
					res.send();
				})); // no confusion possible if we use this one

				// no route added

				var request = Request.make_new_stanford_teapot();
				core.startup_and_create_session(request);
				var promise = core.process_request(request);
				Cyp.finish_test_expecting_promise_to_be_fulfilled_with_conditions(promise, signalAsyncTestFinished, function(response) {
					response.return_code.should.equal(http_constants.status_codes.status_501_server_error_not_implemented);
					response.content.should.equal("Server is misconfigured. Please add middlewares to handle requests !");
				});
			});


			it("should return a 501 not_implemented error when called on an unknown action", function(signalAsyncTestFinished) {
				var out = CUT.make_new();

				var core = DebugCore.make_new();
				core.use(out);

				var callback = function() {};
				out.add_callback_handler(core.rest_indexed_shared_container, "/stanford/teapot", "GET", callback);

				var request = Request.make_new_stanford_teapot();
				core.startup_and_create_session(request);
				var promise = core.process_request(request);
				Cyp.finish_test_expecting_promise_to_be_fulfilled_with_conditions(promise, signalAsyncTestFinished, function(response) {
					response.method.should.equal('BREW');
					response.uri.should.equal('/stanford/teapot');
					response.return_code.should.equal(http_constants.status_codes.status_501_server_error_not_implemented);
					response.content.should.equals('Not Implemented');
				});
			});

		}); // describe feature

	}); // describe CUT
}); // requirejs module
