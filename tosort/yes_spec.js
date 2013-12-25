if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'when',
	'restlink/server/middleware/yes',
	'restlink/server/middleware/base',
	'restlink/server/middleware/integrated',
	'restlink/server/rest_target_indexed_shared_container',
	'restlink/server/core',
	'restlink/core/request',
	'network-constants/http',
	'mocha'
],
function(chai, when, CUT, BaseRequestHandler, IntegratedMWs, RestIndexedContainer, ServerCore, Request, http_constants) {
	"use strict";

	var expect = chai.expect;
	chai.should();
	chai.Assertion.includeStack = true; // defaults to false


	describe("Restlink Yes Middleware", function() {


		describe("instantiation", function() {

			it("should be instantiable", function() {
				var out = CUT.make_new();
				out.should.exist;
				out.should.be.an('object');
			});

			it("should have correct inheritance", function() {
				var out = CUT.make_new();
				out.should.be.an.instanceOf(BaseRequestHandler.klass);
			});

		}); // describe feature



		describe("request handling", function() {


			it("should allow CREATE", function() {
				var out = CUT.make_new();

				var core = ServerCore.make_new();
				core.use(out);
				var transaction = core.startup_create_session_and_create_transaction();

				var deferred1 = when.defer();
				var request = Request.make_new_stanford_teapot();
				request.method = "POST";
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

		}); // describe feature

	}); // describe CUT
}); // requirejs module
