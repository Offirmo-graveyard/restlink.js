if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'restlink/utils/chai-you-promised',
	'restlink/server/middleware/catch_all',
	'restlink/server/middleware/base',
	'restlink/server/middleware/callback',
	'restlink/core/request',
	'restlink/core/response',
	'restlink/server/spec/debug_core',
	'network-constants/http',
	'mocha'
],
function(chai, Cyp, CUT, BaseMiddleware, CallbackMiddleware, Request, Response, DebugCore, http_constants) {
	"use strict";

	var expect = chai.expect;
	chai.should();
	chai.Assertion.includeStack = true; // defaults to false


	describe('Offirmo Middleware CatchAll', function() {


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
				expect( out.get_denomination() ).to.eq("CatchAllMW");
			});

		}); // describe feature


		describe('handling', function() {

			it('should return 404 on a non existing route', function(signalAsyncTestFinished) {
				var out = CUT.make_new();

				var core = DebugCore.make_new();
				core.use(out);
				var session = core.startup_and_create_session();

				var request = Request.make_new_stanford_teapot();
				session.register_request(request);
				var promise = core.process_request(request);
				Cyp.finish_test_expecting_promise_to_be_fulfilled_with_conditions( promise, signalAsyncTestFinished, function(response) {
					expect( response.return_code).to.equal(http_constants.status_codes.status_404_client_error_not_found);
					expect( response.content ).to.equal('Not Found');
				});
			});

			it("should return a 501 not_implemented on an existing route but unknown action", function(signalAsyncTestFinished) {
				var out = CUT.make_new();

				var core = DebugCore.make_new();
				core.use(out);

				var callback = function() {};
				CallbackMiddleware.add_callback_handler(core.rest_indexed_shared_container, "/stanford/teapot", "GET", callback);

				var request1 = Request.make_new_stanford_teapot();
				core.startup_and_create_session(request1);
				var promise1 = core.process_request(request1);
				Cyp.finish_test_expecting_promise_to_be_fulfilled_with_conditions(promise1, signalAsyncTestFinished, function(response) {
					response.return_code.should.equal(http_constants.status_codes.status_501_server_error_not_implemented);
					response.content.should.equals('Not Implemented');
				});

				// TODO more TRACE and nothing

			});

		}); // describe feature


	}); // describe CUT
}); // requirejs module
