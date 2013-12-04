if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'when',
	'restlink/server/middleware/response_enrichments',
	'restlink/core/response',
	'mocha'
],
function(chai, when, CUT, Response) {
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
				CUT.process(response, fake_request, fake_context);
			});

			it('should set default values', function() {
				var response = Response.make_new();
				var fake_request = {};
				CUT.process(response, fake_request);

				response.middleware_.should.exist;
				response.should.respondTo("send");
			});

			it('should work in nominal case with no context', function() {
				var response = Response.make_new();
				var fake_request = {};
				CUT.process(response, fake_request);
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

			it('should detect problems', function() {
				var response = Response.make_new();
				var fake_request = {};
				CUT.process(response, fake_request);

				// should throw since no promises set
				var tempfn = function() { response.send(); };
				tempfn.should.throw(Error, "Empty deferred chain : middleware error during processing ?");
			});

			it('should work in nominal case', function(signalAsyncTestFinished) {
				var out = Response.make_new();
				var fake_request = {};
				var fake_context = {};
				CUT.process(out, fake_request, fake_context);

				// insert a root deferred
				var deferred = when.defer();
				var promise = deferred.promise;
				out.middleware_.deferred_chain_.push(deferred);

				// it is now allowed to send the response
				out.send();

				promise.spread(function(context, request, response) {
					context.should.equal(fake_context);
					request.should.equal(fake_request);
					response.should.equal(out);
					signalAsyncTestFinished();
				});
				promise.otherwise(function(){
					expect(false).to.be.ok;
				});
			});

			it('should correctly handle a middleware chain', function(signalAsyncTestFinished) {
				var out = Response.make_new();
				var fake_request = {};
				var fake_context = {};
				CUT.process(out, fake_request, fake_context);

				// simulate a middleware chain
				var deferred_head = when.defer();
				var promise_head = deferred_head.promise;
				out.middleware_.deferred_chain_.push(deferred_head);

				var deferred_tail = when.defer();
				var promise_tail = deferred_tail.promise;
				out.middleware_.deferred_chain_.push(deferred_tail);

				out.send();

				promise_tail.spread(function(context, request, response) {
					context.should.equal(fake_context);
					request.should.equal(fake_request);
					response.should.equal(out);

					// inspect and modify (example)
					response.should.not.have.ownProperty('foo');
					response.foo = "bar";

					response.send();
				});
				promise_tail.otherwise(function(){
					expect(false).to.be.ok;
				});

				promise_head.spread(function(context, request, response) {
					context.should.equal(fake_context);
					request.should.equal(fake_request);
					response.should.equal(out);

					response.should.have.ownProperty('foo');
					response.foo.should.equals( "bar" );

					signalAsyncTestFinished();
				});
				promise_head.otherwise(function(){
					expect(false).to.be.ok;
				});
			});

		}); // describe feature

	}); // describe CUT

}); // requirejs module
