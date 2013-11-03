if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'restlink/server/middleware/base',
	'restlink/server/core',
	'restlink/core/request',
	'restlink/core/response',
	'network-constants/http',
	'mocha'
],
function(chai, CUT, ServerCore, Request, Response, http_constants) {
	"use strict";

	var expect = chai.expect;
	chai.should();
	chai.Assertion.includeStack = true; // defaults to false

	var request = Request.make_new();
	request.method = 'BREW';
	request.uri = '/stanford/teapot';

	describe('Offirmo Middleware Base', function() {

		describe('instantiation', function() {

			it('should be instantiable', function() {
				var out = CUT.make_new();
				out.should.exist;
				out.should.be.an('object');
			});

			it('should set default values', function() {
				var out = CUT.make_new();
				//out.is_started().should.be.false;
			});

		}); // describe feature

		/*describe('startup / shutdown', function() {

			it('should work', function() {
				var out = CUT.make_new();

				out.is_started().should.be.false;
				out.startup();
				out.is_started().should.be.true;
				out.shutdown();
				out.is_started().should.be.false;
			});

		}); // describe feature*/

		describe('request handling', function() {

			it('should allow a basic processing', function(signalAsyncTestFinished) {
				var out = CUT.make_new(function process(context, req, res) {
					res.return_code = http_constants.status_codes.status_400_client_error_bad_request;
					res.content = "I'm a teapot !";
					res.send();
				});

				var trans = {};
				var promise = out.head_process_request(trans, request);

				promise.spread(function on_success(context, request, response){
					response.method.should.equal('BREW');
					response.uri.should.equal('/stanford/teapot');
					response.return_code.should.equal(http_constants.status_codes.status_400_client_error_bad_request);
					response.content.should.equal("I'm a teapot !");
					signalAsyncTestFinished();
				});
				promise.otherwise(function on_failure(context, request, response){
					expect(false).to.be.ok;
				});
			});

			it('should provide a default error processing', function(signalAsyncTestFinished) {
				var out = CUT.make_new( /* no processing function */ );
				var trans = {};

				var promise = out.head_process_request(trans, request);

				promise.spread(function on_success(context, request, response){
					response.method.should.equal('BREW');
					response.uri.should.equal('/stanford/teapot');
					response.return_code.should.equal(http_constants.status_codes.status_500_server_error_internal_error);
					signalAsyncTestFinished();
				});
				promise.otherwise(function on_failure(context, request, response){
					expect(false).to.be.ok;
				});
			});

			it('should allow a chained processing', function(signalAsyncTestFinished) {
				var out_head = CUT.make_new(function process(context, req, res, next) {
					res.meta["tag"] = "out_head was here !";
					next();
				});
				var out_tail = CUT.make_new(function process(context, req, res, next) {
					res.return_code = http_constants.status_codes.status_400_client_error_bad_request;
					res.content = "I'm a teapot !";
					res.send();
				});

				// build the chain
				out_head.use(out_tail);

				var trans = {};
				var promise = out_head.head_process_request(trans, request);
				promise.spread(function on_success(context, request, response){
					response.method.should.equal('BREW');
					response.uri.should.equal('/stanford/teapot');
					response.return_code.should.equal(http_constants.status_codes.status_400_client_error_bad_request);
					response.content.should.equal("I'm a teapot !");
					expect(response.meta["tag"]).to.equal("out_head was here !");
					signalAsyncTestFinished();
				});
				promise.otherwise(function on_failure(context, request, response){
					expect(false).to.be.ok;
				});
			});

			it('should allow an advanced chained processing', function(signalAsyncTestFinished) {
				var out_head = CUT.make_new(function process(context, req, res, next) {
					res.meta["tag1"] = "out_head will be back !";
					next(function(context, req, res) {
						res.meta["tag2"] = "out_head is back !";
						res.send();
					});
				});
				var out_tail = CUT.make_new(function process(context, req, res, next) {
					res.return_code = http_constants.status_codes.status_400_client_error_bad_request;
					res.content = "I'm a teapot !";
					res.send();
				});

				// build the chain
				out_head.use(out_tail);

				var trans = {};
				var promise = out_head.head_process_request(trans, request);
				promise.spread(function on_success(context, request, response){
					response.method.should.equal('BREW');
					response.uri.should.equal('/stanford/teapot');
					response.return_code.should.equal(http_constants.status_codes.status_400_client_error_bad_request);
					response.content.should.equal("I'm a teapot !");
					expect(response.meta["tag1"]).to.equal("out_head will be back !");
					expect(response.meta["tag2"]).to.equal("out_head is back !");
					signalAsyncTestFinished();
				});
				promise.otherwise(function on_failure(context, request, response){
					expect(false).to.be.ok;
				});
			});

			it('should handle when send is not called');
			// I have no idea how to do that right now...

			it('should handle when next is called from the tail', function() {
				var out = CUT.make_new(function process(context, req, res, next) {
					next(); // but no next MW !!
				});

				var tempfn = function() { out.head_process_request({}, request); };
				tempfn.should.throw(Error, "Can't forward to next middleware, having none !");
			});
		}); // describe feature



	}); // describe CUT
}); // requirejs module
