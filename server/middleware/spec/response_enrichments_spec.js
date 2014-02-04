if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'restlink/utils/chai-you-promised',
	'when',
	'restlink/server/middleware/response_enrichments',
	'restlink/core/response',
	'extended-exceptions',
	'mocha'
],
function(chai, Cyp, when, CUT, Response, EE) {
	"use strict";

	var expect = chai.expect;
	chai.should();
	chai.Assertion.includeStack = true; // defaults to false


	describe('Offirmo Middleware Response Enrichment', function() {


		describe('processing', function() {

			it('should work in nominal case', function() {
				var response = Response.make_new();
				var fake_request = {};
				var fake_context = {};
				CUT.process(response, fake_request);
			});

			it('should set default values', function() {
				var response = Response.make_new();
				var fake_request = {};
				CUT.process(response, fake_request);

				expect( response.middleware_ ).to.exist;
				expect( response ).to.respondTo("send");
			});

			it('should not work in mandatory args are missing', function() {
				// no args at all
				var tempfn1 = function() { CUT.process(); };
				tempfn1.should.throw(Error, "Offirmo Middleware : No response to enrich !");

				// no request
				var response = Response.make_new();
				var tempfn2 = function() { CUT.process(response); };
				tempfn2.should.throw(Error, "Offirmo Middleware : A request is needed to enrich a response !");
			});

		}); // describe feature


		describe('response sending', function() {

			it('should correctly handle failure case', function(signalAsyncTestFinished) {

				var fake_request = { is_long_living:true }; // bad, empty !
				var out = Response.make_new();
				CUT.process(out, fake_request);

				// will fail since we expect infos inside the request
				// but should fail in a clean, async-safe manner.
				var tempfn = function() { out.send(); };
				tempfn.should.throw(EE.RuntimeError, "Cannot read property 'back_processing_chain_' of undefined");

				Cyp.finish_test_expecting_promise_to_be_rejected_with_error(
						out.middleware_.final_deferred_.promise,
						signalAsyncTestFinished,
						EE.RuntimeError,
						"Cannot read property 'back_processing_chain_' of undefined"
				);
			});

			// It's not convenient to test that here,
			// it will get covered in base middleware test.
			it('[not tested here] should work in nominal case and handle a middleware chain');
			it('[not tested here] should correctly andle and report errors');

		}); // describe feature

	}); // describe CUT

}); // requirejs module
