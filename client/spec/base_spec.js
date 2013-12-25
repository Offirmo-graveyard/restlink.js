if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'restlink/client/base',
	'restlink/core/request',
	'network-constants/http',
	'mocha'
],
function(chai, CUT, Request, http_constants) {
	"use strict";

	var expect = chai.expect;
	chai.should();
	chai.Assertion.includeStack = true; // defaults to false


	describe('Restlink base client adapter', function() {


		describe('instantiation', function() {

			it('should work', function() {
				var out = CUT.make_new();
				out.should.exist;
				out.should.be.an('object');
			});

			it('should set default values', function() {
				var out = CUT.make_new();
				//...
			});

		}); // describe feature


		describe('request processing', function() {

			it('should (not ;-) work', function(signalAsyncTestFinished) {
				var request = Request.make_new_stanford_teapot();

				var out = CUT.make_new();
				var promise = out.process_request(request);
				promise.spread(function(request, response){
					response.method.should.equal('BREW');
					response.uri.should.equal('/stanford/teapot');
					response.return_code.should.equal(http_constants.status_codes.status_501_server_error_not_implemented);
					response.meta.should.deep.equal({ error_msg: 'ClientAdapterBase process_request is to be implemented in a derived class !' });
					expect(response.content).to.be.empty;
					signalAsyncTestFinished();
				});
				promise.otherwise(function(){
					expect(false).to.be.ok;
				});
			});

		}); // describe feature


		describe('disconnection', function() {

			it('should be possible', function() {
				var out = CUT.make_new();
				out.disconnect();
			});

			it('should prevent new requests', function() {
				var request = Request.make_new_stanford_teapot();

				var out = CUT.make_new();
				out.disconnect();

				var tempfn = function() { out.process_request(request); };
				tempfn.should.throw(Error, "This client is disconnected !");
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
