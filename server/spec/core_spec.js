if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'restlink/utils/chai-you-promised',
	'underscore',
	'when',

	'restlink/server/core',
	'restlink/server/spec/debug_core', // same as core with debug functions

	'restlink/server/session',
	'restlink/core/request',
	'restlink/core/response',
	'restlink/server/adapters/base',
	'restlink/server/middleware/base',
	'mocha'
],
function(chai, Cyp, _, when, CUT, CUTD, Session, Request, Response, ServerAdapterBase, BaseMiddleware) {
	"use strict";

	var expect = chai.expect;
	chai.should();
	chai.Assertion.includeStack = true; // defaults to false


	describe('Restlink server internal core', function() {


		describe('instantiation', function() {

			it('should be possible', function() {
				var out = CUT.make_new();
				out.should.exist;
				out.should.be.an('object');
			});

			it('should set default values', function() {
				var out = CUT.make_new();

				out.is_started().should.be.false;
			});

			it('should prepare a rest-indexed shared container member', function() {
				var out = CUT.make_new();

				out.rest_indexed_shared_container.should.exist;
				out.rest_indexed_shared_container.should.be.an('object');
			});

		}); // describe feature



		describe('startup / shutdown', function() {

			it('should work', function() {
				var out = CUT.make_new();
				out.use({}); // fake middleware

				out.is_started().should.be.false;
				out.startup();
				out.is_started().should.be.true;
				out.shutdown();
				out.is_started().should.be.false;
			});

			it('should not allow startup if some config is missing', function() {
				var out = CUT.make_new();

				var tempfn = function() { out.startup(); };
				tempfn.should.throw(Error, "No middleware provided !");
			});

		}); // describe feature



		describe('adapters management', function() {

			it('should allow insertion', function() {
				var out = CUT.make_new();

				out.add_adapter({});
			});

			it('should correctly propagate startup/shutdown', function() {
				var out = CUT.make_new();
				out.use({}); // provide fake MW

				// first with an adapter added before start
				var test_adapter1 = ServerAdapterBase.make_new();
				test_adapter1.is_started().should.be.false;
				out.add_adapter( test_adapter1 );
				test_adapter1.is_started().should.be.false;

				out.startup();
				test_adapter1.is_started().should.be.true;

				// now an adapter added after start
				var test_adapter2 = ServerAdapterBase.make_new();
				out.add_adapter( test_adapter2 );
				test_adapter2.is_started().should.be.true;

				out.shutdown();
				test_adapter1.is_started().should.be.false;
				test_adapter2.is_started().should.be.false;
			});

			describe('support functions', function() {

				it('should allow session creation but only when started', function() {
					var out = CUT.make_new();
					out.use({}); // provide fake MW

					var tempfn = function() { var session = out.create_session(); };
					tempfn.should.throw(Error, "Can't create new session : server is stopped !");

					out.startup();
					var session = out.create_session(); // OK
					session.is_valid().should.be.true;
				});

				it('should allow session termination', function() {
					var out = CUT.make_new();
					out.use({}); // provide fake MW

					out.startup();
					var session = out.create_session(); // OK
					session.is_valid().should.be.true;

					out.terminate_session(session);
					session.is_valid().should.be.false;
				});


				it('should allow handling', function(signalAsyncTestFinished) {
					var out = CUTD.make_new();

					var request = Request.make_new_stanford_teapot();
					out.startup_and_create_session(request);

					// will return something by default even if no handler
					var promise = out.process_request(request);
					Cyp.finish_test_expecting_promise_to_be_fulfilled_with_conditions(promise, signalAsyncTestFinished, function(response) {
						response.return_code.should.equal(501);
						response.content.should.equal("Server is misconfigured. Please add middlewares to handle requests !");
					});
				});

			});

		}); // describe feature



		describe('middleware management', function() {

			it('should allow insertion', function(signalAsyncTestFinished) {
				var out = CUTD.make_new();
				out.use(BaseMiddleware.make_new(function process(req, res, next) {
					res.set_to_not_implemented("Server is misconfigured. Please add middlewares to handle requests !");
					res.send();
				}));

				var request = Request.make_new_stanford_teapot();
				out.startup_and_create_session(request);

				var promise = out.process_request(request);
				Cyp.finish_test_expecting_promise_to_be_fulfilled_with_conditions(promise, signalAsyncTestFinished, function(response) {
					response.return_code.should.equal(501);
					response.content.should.equal("Server is misconfigured. Please add middlewares to handle requests !");
				});
			});

			it('should allow insertion of a chain', function(signalAsyncTestFinished) {
				var out = CUTD.make_new();
				out.use(BaseMiddleware.make_new(function process(req, res, next) {
					// pretend to do something
					next();
				}));
				out.use(BaseMiddleware.make_new(function process(req, res, next) {
					res.meta["tag1"] = "base was here !";
					next();
				},
				function back_process(req, res) {
					res.meta["tag2"] = "base was back !";
					res.send();
				}));
				out.use(BaseMiddleware.make_new(function process(req, res, next) {
					res.set_to_not_implemented("Server is misconfigured. Please add middlewares to handle requests !");
					res.send();
				}));

				var request = Request.make_new_stanford_teapot();
				out.startup_and_create_session(request);

				var promise = out.process_request(request);
				Cyp.finish_test_expecting_promise_to_be_fulfilled_with_conditions(promise, signalAsyncTestFinished, function(response) {
					response.return_code.should.equal(501);
					response.content.should.equal("Server is misconfigured. Please add middlewares to handle requests !");
					expect(response.meta["tag1"]).to.equal("base was here !");
					expect(response.meta["tag2"]).to.equal("base was back !");
				});
			});

			it('should correctly propagate startup/shutdown'); // TODO one day

		}); // describe feature


		describe('session management', function() {

			it('should allow creation', function() {
				var core = CUT.make_new();
				core.use({}); // fake MW
				core.startup();
				var out = core.create_session();

				out.should.exist;
				expect(out).to.be.an('object');
				expect(out).to.be.an.instanceof(Session.klass);
			});

		}); // describe feature

	}); // describe CUT
}); // requirejs module
