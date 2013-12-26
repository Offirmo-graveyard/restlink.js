if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'when',
	'restlink/server/middleware/auto_crud',
	'restlink/server/middleware/base',
	'restlink/server/rest_target_indexed_shared_container',
	'restlink/server/spec/debug_core',
	'restlink/core/request',
	'network-constants/http',
	'mocha'
],
function(chai, when, CUT, BaseMiddleware, RestIndexedContainer, DebugCore, Request, http_constants) {
	"use strict";

	var expect = chai.expect;
	chai.should();
	chai.Assertion.includeStack = true; // defaults to false


	describe("Restlink Auto CRUD Middleware", function() {


		describe("instantiation", function() {

			it("should be instantiable", function() {
				var out = CUT.make_new();
				out.should.exist;
				out.should.be.an('object');
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

				out.add_callback_handler(ric, "/stanford/teapot", "BREW", test_callback);
				out.add_callback_handler(ric, "/firm/:id",        "GET",  test_callback);
			});


			it("should correctly call the appropriate callback", function(signalAsyncTestFinished) {
				var out = CUT.make_new();

				var core = DebugCore.make_new();
				core.use(out);
				var session = core.startup_and_create_session();


				var teapot_BREW_callback = function ( request, response) {
					response.set_to_error(
							http_constants.status_codes.status_400_client_error_bad_request,
							"I'm a teapot !");
					response.send();
				};

				var firm_GET_callback = function( request, response) {
					response.return_code = http_constants.status_codes.status_200_ok;
					response.content = "I'm here !";
					response.send();
				};

				out.add_callback_handler(core.rest_indexed_shared_container, "/stanford/teapot", "BREW", teapot_BREW_callback);
				out.add_callback_handler(core.rest_indexed_shared_container, "/firm/:id",        "GET",  firm_GET_callback);

				var deferred1 = when.defer();
				var request = Request.make_new_stanford_teapot();
				session.register_request(request);
				var promise1 = core.process_request(request);
				promise1.spread(function(request, response) {
					response.method.should.equal("BREW");
					response.uri.should.equal("/stanford/teapot");
					response.return_code.should.equal(http_constants.status_codes.status_400_client_error_bad_request);
					expect(response.content).to.equals("I'm a teapot !");
					deferred1.resolve();
				});
				promise1.otherwise(function() {
					expect(false).to.be.ok;
				});

				var request2 = Request.make_new();
				request2.uri = '/firm/ACME';
				request2.method = 'GET';
				var deferred2 = when.defer();
				session.register_request(request2);
				var promise2 = core.process_request(request2);
				promise2.spread(function(request, response) {
					response.method.should.equal("GET");
					response.uri.should.equal("/firm/ACME");
					response.return_code.should.equal(http_constants.status_codes.status_200_ok);
					expect(response.content).to.equals("I'm here !");
					deferred2.resolve();
				});
				promise2.otherwise(function(){
					expect(false).to.be.ok;
				});

				deferred1.promise.then(function(){
					deferred2.promise.then(function(){
						signalAsyncTestFinished();
					});
				});
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
				promise.spread(function(request, response) {
					response.return_code.should.equal(http_constants.status_codes.status_501_server_error_not_implemented);
					response.content.should.equal("Server is misconfigured. Please add middlewares to handle requests !");
					signalAsyncTestFinished();
				});
				promise.otherwise(function(){
					expect(false).to.be.ok;
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
				promise.spread(function(request, response) {
					response.method.should.equal('BREW');
					response.uri.should.equal('/stanford/teapot');
					response.return_code.should.equal(http_constants.status_codes.status_501_server_error_not_implemented);
					response.content.should.equals('Not Implemented');
					signalAsyncTestFinished();
				});
				promise.otherwise(function(){
					expect(false).to.be.ok;
				});
			});

		}); // describe feature

	}); // describe CUT
}); // requirejs module