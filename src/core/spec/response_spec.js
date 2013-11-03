if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'restlink/core/response',
	'restlink/core/request',
	'network-constants/http',
	'mocha'
],
function(chai, CUT, Request, http_constants) {
	"use strict";

	var expect = chai.expect;
	chai.should();
	chai.Assertion.includeStack = true; // defaults to false

	describe('Restlink Response', function() {

		describe('instantiation', function() {

			it('should work', function() {
				var out = CUT.make_new();
				out.should.exist;
				out.should.be.an('object');
			});

			it('should set default values', function() {
				var out = CUT.make_new();

				out.return_code.should.equal(http_constants.status_codes.status_500_server_error_internal_error);
			});

			it('should be instantiable from a request (basic)', function() {
				var request = Request.make_new();
				request.method = 'BREW';
				request.uri = '/stanford/teapot';

				// basic version
				var out = CUT.make_new_from_request(request);
				//console.log(out);
				out.method.should.equal('BREW');
				out.uri.should.equal('/stanford/teapot');
				out.return_code.should.equal(http_constants.status_codes.status_500_server_error_internal_error);
				out.meta.should.deep.equal({});
				expect(out.content).to.be.undefined;
			});

			it('should be instantiable from a request (advanced)', function() {
				var request = Request.make_new();
				request.method = 'BREW';
				request.uri = '/stanford/teapot';

				// more advanced version
				var out = CUT.make_new_from_request(request, {
					return_code: http_constants.status_codes.status_400_client_error_bad_request,
					content: "I'm a teapot !",
					meta: { 'version': 12 }
				});
				//console.log(out2);
				out.method.should.equal('BREW');
				out.uri.should.equal('/stanford/teapot');
				out.return_code.should.equal(http_constants.status_codes.status_400_client_error_bad_request);
				out.meta.should.deep.equal({ 'version': 12 });
				out.content.should.equal("I'm a teapot !");
			});

		}); // describe feature

		describe('utilities', function() {

			it('should provide convenient fluid setters', function() {
				var request = Request.make_new();
				request.method = 'BREW';
				request.uri = '/stanford/teapot';

				// more advanced version
				var out = CUT.make_new_from_request(request).with_status(400).with_content("Dude, I'm a teapot !").with_meta({ 'traceroute': true });

				out.method.should.equal('BREW');
				out.uri.should.equal('/stanford/teapot');
				out.return_code.should.equal(http_constants.status_codes.status_400_client_error_bad_request);
				out.content.should.equal("Dude, I'm a teapot !");
				out.meta.should.deep.equal({ 'traceroute': true });
			});

			it('should allow easy error generation', function(signalAsyncTestFinished) {
				var out = CUT.make_new();
				// override default implementation
				out.handle_request = function(transaction, request) {
					this.resolve_with_error(transaction, request, http_constants.status_codes.status_403_client_forbidden);
				};

				var core = ServerCore.make_new();
				core.startup();
				var session = core.create_session();
				var trans = session.create_transaction(request);

				var promise = trans.forward_to_handler_and_intercept_response(out);
				promise.spread(function(transaction, request, response) {
					console.log("in spread !");
					response.method.should.equal('BREW');
					response.uri.should.equal('/stanford/teapot');
					response.return_code.should.equal(http_constants.status_codes.status_403_client_forbidden);
					response.content.should.equals('Forbidden');
					signalAsyncTestFinished();
				});
				promise.otherwise(function(){
					expect(false).to.be.ok;
				});
			});

			it('should allow easy common errors generation : not implemented', function(signalAsyncTestFinished) {
				var out = CUT.make_new();
				// override default implementation
				out.handle_request = function(transaction, request) {
					this.resolve_with_not_implemented(transaction, request);
				};

				var core = ServerCore.make_new();
				core.startup();
				var session = core.create_session();
				var trans = session.create_transaction(request);

				var promise = trans.forward_to_handler_and_intercept_response(out);
				promise.spread(function(transaction, request, response) {
					console.log("in spread !");
					response.return_code.should.equal(http_constants.status_codes.status_501_server_error_not_implemented);
					signalAsyncTestFinished();
				});
				promise.otherwise(function(){
					expect(false).to.be.ok;
				});
			});

			it('should allow easy common errors generation : internal error', function(signalAsyncTestFinished) {
				var out = CUT.make_new();
				// override default implementation
				out.handle_request = function(transaction, request) {
					this.resolve_with_internal_error(transaction, request);
				};

				var core = ServerCore.make_new();
				core.startup();
				var session = core.create_session();
				var trans = session.create_transaction(request);

				var promise = trans.forward_to_handler_and_intercept_response(out);
				promise.spread(function(transaction, request, response) {
					console.log("in spread !");
					response.return_code.should.equal(http_constants.status_codes.status_500_server_error_internal_error);
					signalAsyncTestFinished();
				});
				promise.otherwise(function(){
					expect(false).to.be.ok;
				});
			});

		}); // describe feature

	}); // describe CUT
}); // requirejs module
