if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'restlink/utils/chai-you-promised',
	'restlink/client/base',
	'restlink/core/request',
	'network-constants/http',
	'mocha'
],
function(chai, Cyp, CUT, Request, http_constants) {
	"use strict";

	var expect = chai.expect;
	chai.Assertion.includeStack = true; // defaults to false


	describe('Restlink base client adapter', function() {


		describe('instantiation', function() {

			it('should work', function() {
				var out = CUT.make_new();
				expect( out ).to.exist;
				expect( out ).to.be.an('object');
			});

			it('should set default values', function() {
				var out = CUT.make_new();
				//...
			});

		}); // describe feature


		describe('request processing', function() {

			it('should (not ;-) work until properly derived', function(signalAsyncTestFinished) {
				var request = Request.make_new_stanford_teapot();

				var out = CUT.make_new();
				var promise = out.process_request(request);

				Cyp.finish_test_expecting_promise_to_be_fulfilled_with_conditions(promise, signalAsyncTestFinished, function(response) {
					expect( response.method      ).to.be.equal('BREW');
					expect( response.uri         ).to.be.equal('/stanford/teapot');
					expect( response.return_code ).to.be.equal(http_constants.status_codes.status_501_server_error_not_implemented);
					expect( response.meta        ).to.deep.equal({
						error_msg: 'ClientAdapterBase process_request is to be implemented in a derived class !'
					});
					expect( response.content     ).to.be.empty;
				});
			});

		}); // describe feature


		describe('disconnection', function() {

			it('should be possible', function() {
				var out = CUT.make_new();
				out.disconnect();
			});

			it('should prevent new requests', function(signalAsyncTestFinished) {
				var request = Request.make_new_stanford_teapot();

				var out = CUT.make_new();
				out.disconnect(); // since direct client is connected by default
				var promise = out.process_request(request);

				Cyp.finish_test_expecting_promise_to_be_rejected_with_error(promise, signalAsyncTestFinished,
					Error, "This client is disconnected !");
			});

		}); // describe feature


		describe('utilities', function() {

			it('should allow easy creation of a request', function() {
				var out = CUT.make_new();
				var request = out.make_new_request();
				expect( request ).to.be.an.instanceOf(Request.klass)
			});

		}); // describe feature

	}); // describe CUT
}); // requirejs module
