if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'when',
	'restlink/server/response_enrichments',
	'restlink/core/response',
	'mocha'
],
function(chai, when, CUT, Response) {
	"use strict";

	var expect = chai.expect;
	chai.should();
	chai.Assertion.includeStack = true; // defaults to false

	describe('Restlink Response Enrichment for middleware', function() {

		describe('initialization', function() {

			it('should work', function() {
				var out = Response.make_new();
				CUT.process(out);
			});

			it('should set default values', function() {
				var out = Response.make_new();
				CUT.process(out);

				out.middleware_.should.exist;
				out.should.respondTo("send");
			});

		}); // describe feature


		describe('response sending', function() {

			it('should detect problems', function() {
				var out = Response.make_new();
				CUT.process(out);

				// should throw since no promises set
				var tempfn = function() { out.send(); };
				tempfn.should.throw(Error, "Empty deferred chain : middleware error during processing ?");
			});

			it('should work in nominal case', function(signalAsyncTestFinished) {
				var out = Response.make_new();
				var fake_request = {};
				var fake_transaction = {};
				CUT.process(out, fake_transaction, fake_request);

				var deferred = when.defer();
				var promise = deferred.promise;
				out.middleware_.deferred_chain_.push(deferred);

				out.send();

				promise.spread(function(transaction, request, response) {
					transaction.should.equal(fake_transaction);
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
				var fake_transaction = {};
				CUT.process(out, fake_transaction, fake_request);

				// simulate a middleware chain
				var deferred_head = when.defer();
				var promise_head = deferred_head.promise;
				out.middleware_.deferred_chain_.push(deferred_head);

				var deferred_tail = when.defer();
				var promise_tail = deferred_tail.promise;
				out.middleware_.deferred_chain_.push(deferred_tail);

				out.send();

				promise_tail.spread(function(transaction, request, response) {
					transaction.should.equal(fake_transaction);
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

				promise_head.spread(function(transaction, request, response) {
					transaction.should.equal(fake_transaction);
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
