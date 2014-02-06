if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'restlink/utils/chai-you-promised',
	'restlink/server/middleware/meta',
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


	describe('Offirmo Middleware Meta', function() {


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
				expect( out.get_denomination() ).to.eq("MetaMW");
			});

		}); // describe feature


		describe('OPTIONS handling', function() {

			it('should work on an existing route', function(signalAsyncTestFinished) {
				var out = CUT.make_new();

				var core = DebugCore.make_new();
				core.use(out);
				var session = core.startup_and_create_session();

				var useless_callback = function (request, response) {
					response.set_to_internal_error();
					response.send();
				};

				CallbackMiddleware.add_callback_handler(core.rest_indexed_shared_container, "/stanford/teapot", "BREW", useless_callback);
				CallbackMiddleware.add_callback_handler(core.rest_indexed_shared_container, "/stanford/teapot", "INFUSE", useless_callback);

				var request = Request.make_new()
						.with_uri('/stanford/teapot')
						.with_method('OPTIONS');
				session.register_request(request);
				var promise = core.process_request(request);
				Cyp.finish_test_expecting_promise_to_be_fulfilled_with_conditions( promise, signalAsyncTestFinished, function(response) {
					expect( response.method).to.equal('OPTIONS');
					expect( response.return_code).to.equal(http_constants.status_codes.status_200_ok);
					expect( response.content ).to.equal('');
					expect( response.meta ).to.include.keys('Allow', 'Access-Control-Allow-Methods');
					expect( response.meta['Allow'] ).to.equals("BREW, INFUSE");
					expect( response.meta['Access-Control-Allow-Methods'] ).to.equals("BREW, INFUSE");
				});
			});


			it('should work on a non existing route');
			it('should work on *');
		}); // describe feature

		describe('TRACE handling', function() {

			it('should work on whatever route', function(signalAsyncTestFinished) {
				var out = CUT.make_new();

				var core = DebugCore.make_new();
				core.use(out);
				var session = core.startup_and_create_session();

				var request = Request.make_new_stanford_teapot()
						.with_method('TRACE')
						.with_content_type('lolcat')
						.with_content('meow !');
				session.register_request(request);
				var promise = core.process_request(request);
				Cyp.finish_test_expecting_promise_to_be_fulfilled_with_conditions( promise, signalAsyncTestFinished, function(response) {
					expect( response.method).to.equal('TRACE');
					expect( response.content ).to.equal('meow !');
					expect( response.content_type ).to.equal('lolcat');
				});
			});
		}); // describe feature



	}); // describe CUT
}); // requirejs module
