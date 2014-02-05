if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'restlink/utils/chai-you-promised',
	'restlink/server/middleware/base',
	'restlink/core/request',
	'restlink/core/response',
	'network-constants/http',
	'mocha'
],
function(chai, Cyp, CUT, Request, Response, http_constants) {
	"use strict";

	var expect = chai.expect;
	chai.should();
	chai.Assertion.includeStack = true; // defaults to false


	describe('Offirmo Middleware Base', function() {


		describe('instantiation', function() {

			it('should be instantiable', function() {
				var out = CUT.make_new();
				expect( out ).to.exist;
				expect( out ).to.be.an('object');
			});

			it('should set default values', function() {
				var out = CUT.make_new();
				expect(out.get_denomination()).to.eq("UnknownMW");
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


		describe('name manipulation', function() {

			it('should work', function() {
				var out = CUT.make_new();

				out.set_denomination("toto");
				out.get_denomination().should.equals("toto");
			});

		}); // describe feature


		describe('request handling', function() {

			it('should allow a basic processing', function(signalAsyncTestFinished) {
				var out = CUT.make_new(function process(req, res) {
					expect(res.middleware_.processing_chain_index).to.eq(1);
					res.return_code = http_constants.status_codes.status_400_client_error_bad_request;
					res.content = "I'm a teapot !";
					res.send();
				});

				//var session = Session.make_new();
				var request = Request.make_new_stanford_teapot();
				var promise = out.initiate_processing(request);

				Cyp.finish_test_expecting_promise_to_be_fulfilled_with_conditions(promise, signalAsyncTestFinished, function(response) {
					expect(response.middleware_.processing_chain_index).to.eq(0);
					response.method.should.equal('BREW');
					response.uri.should.equal('/stanford/teapot');
					response.return_code.should.equal(http_constants.status_codes.status_400_client_error_bad_request);
					response.content.should.equal("I'm a teapot !");
				});
			});


			it('should allow a basic back processing', function(signalAsyncTestFinished) {
				var out = CUT.make_new(function process(req, res) {
							expect(res.middleware_.processing_chain_index).to.eq(1);
					res.content = "I'm a teapot !";
					res.send();
				},
				function process(req, res) {
					expect(res.middleware_.processing_chain_index).to.eq(1);
					res.return_code = http_constants.status_codes.status_400_client_error_bad_request;
					res.content += " Really, dude.";
					res.send();
				});

				var request = Request.make_new_stanford_teapot();
				var promise = out.initiate_processing(request);

				Cyp.finish_test_expecting_promise_to_be_fulfilled_with_conditions(promise, signalAsyncTestFinished, function(response) {
					response.method.should.equal('BREW');
					response.uri.should.equal('/stanford/teapot');
					response.return_code.should.equal(http_constants.status_codes.status_400_client_error_bad_request);
					response.content.should.equal("I'm a teapot ! Really, dude.");
				});
			});

			it('should provide a default error processing', function(signalAsyncTestFinished) {
				var out = CUT.make_new( /* no processing function */ );

				var request = Request.make_new_stanford_teapot();
				var promise = out.initiate_processing(request);

				Cyp.finish_test_expecting_promise_to_be_fulfilled_with_conditions(promise, signalAsyncTestFinished, function(response) {
					response.method.should.equal('BREW');
					response.uri.should.equal('/stanford/teapot');
					response.return_code.should.equal(http_constants.status_codes.status_500_server_error_internal_error);
				});
			});

			it('should allow a chained processing', function(signalAsyncTestFinished) {
				var out_head = CUT.make_new(function process(req, res, next) {
					expect(res.middleware_.processing_chain_index).to.eq(1);
					res.meta["tag"] = "out_head was here !";
					next();
				});
				var out_tail = CUT.make_new(function process(req, res, next) {
					expect(res.middleware_.processing_chain_index).to.eq(2);
					res.return_code = http_constants.status_codes.status_400_client_error_bad_request;
					res.content = "I'm a teapot !";
					res.send();
				});

				// build the chain
				out_head.use(out_tail);

				var request = Request.make_new_stanford_teapot();
				var promise = out_head.initiate_processing(request);
				Cyp.finish_test_expecting_promise_to_be_fulfilled_with_conditions(promise, signalAsyncTestFinished, function(response) {
					response.method.should.equal('BREW');
					response.uri.should.equal('/stanford/teapot');
					response.return_code.should.equal(http_constants.status_codes.status_400_client_error_bad_request);
					response.content.should.equal("I'm a teapot !");
					expect(response.meta["tag"]).to.equal("out_head was here !");
				});
			});

			it('should allow an advanced chained processing', function(signalAsyncTestFinished) {
				var out_head = CUT.make_new(function process(req, res, next) {
					// init of control fields
					// mark our passage
					expect(res.middleware_.processing_chain_index).to.eq(1);
					res.content += "H1>";
					next(function additional_back_process(req, res) {
						res.content += "<H1";
						res.send();
					});
				},
				function back_process(req, res, next) {
					expect(res.middleware_.processing_chain_index).to.eq(1);
					res.content += "<H1b";
					res.send();
				});

				var out_tail = CUT.make_new(function process(req, res) {
					expect(res.middleware_.processing_chain_index).to.eq(2);
					res.return_code = http_constants.status_codes.status_400_client_error_bad_request;
					res.content += "H2>";
					res.send();
				},
				function back_process(req, res) {
					expect(res.middleware_.processing_chain_index).to.eq(2);
					res.content += "<H2";
					res.send();
				});

				// build the chain
				out_head.use(out_tail);

				var request = Request.make_new_stanford_teapot();
				var promise = out_head.initiate_processing(request);
				Cyp.finish_test_expecting_promise_to_be_fulfilled_with_conditions(promise, signalAsyncTestFinished, function(response) {
					expect(response.middleware_.processing_chain_index).to.eq(0);
					console.log(response);
					response.method.should.equal('BREW');
					response.uri.should.equal('/stanford/teapot');
					response.return_code.should.equal(http_constants.status_codes.status_400_client_error_bad_request);
					response.content.should.equal("H1>H2><H2<H1<H1b");
				});
			});

			it('should handle when neither send nor next are called');
			// I have no idea how to do that right now...

			it('should handle when both send and next are called');
			// I have no idea how to do that right now...

			it('should handle when next is called from the tail', function() {
				var out = CUT.make_new(function process(req, res, next) {
					next(); // but no next MW !!
				});

				var request = Request.make_new_stanford_teapot();
				var tempfn = function() { out.initiate_processing(request); };
				tempfn.should.throw(Error, "Can't forward to next middleware, having none !");
			});
		}); // describe feature



	}); // describe CUT
}); // requirejs module
