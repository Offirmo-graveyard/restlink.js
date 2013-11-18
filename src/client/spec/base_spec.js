if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'restlink/client_adapter_base',
	'restlink/request',
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
				var request = Request.make_new();
				request.method = 'BREW';
				request.uri = '/stanford/teapot';

				var out = CUT.make_new();
				var promise = out.process_request(request);
				promise.spread(function(request, response){
					response.method.should.equal('BREW');
					response.uri.should.equal('/stanford/teapot');
					response.return_code.should.equal(http_constants.status_codes.status_501_server_error_not_implemented);
					response.meta.should.deep.equal({ error_msg: 'ClientAdapterBase process_request is to be implemented in a derived class !' });
					expect(response.content).to.be.undefined;
					signalAsyncTestFinished();
				});
				promise.otherwise(function(){
					expect(false).to.be.ok;
				});
			});

		}); // describe feature

		describe('disconnection', function() {

			it('should be possible');
			it('should prevent new requests');

		}); // describe feature

	}); // describe CUT
}); // requirejs module
