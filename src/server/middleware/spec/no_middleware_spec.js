if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'restlink/server/middleware/no_middleware',
	'restlink/server/middleware/base',
	'restlink/server/core',
	'restlink/core/request',
	'network-constants/http',
	'mocha'
],
function(chai, CUT, BaseRequestHandler, ServerCore, Request, http_constants) {
	"use strict";

	var expect = chai.expect;
	chai.should();
	chai.Assertion.includeStack = true; // defaults to false


	describe('Restlink default error middleware', function() {



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



		describe('request handling', function() {

			it('should always answer a not implemented + no middleware error', function(signalAsyncTestFinished) {
				var out = CUT.make_new();

				var trans = {};
				var request = Request.make_new_stanford_teapot();
				var promise = out.head_process_request(trans, request);

				promise.spread(function on_success(context, request, response){
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

		}); // describe feature

	}); // describe CUT
}); // requirejs module
