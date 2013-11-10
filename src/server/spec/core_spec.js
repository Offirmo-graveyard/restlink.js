if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'underscore',
	'when',
	'restlink/server/core',
	'restlink/core/request',
	'restlink/core/response',
	'restlink/server/adapters/base',
	'restlink/server/middleware/integrated',
	'mocha'
],
function(chai, _, when, CUT, Request, Response, ServerAdapterBase, IntegratedMWs) {
	"use strict";

	var expect = chai.expect;
	chai.should();
	chai.Assertion.includeStack = true; // defaults to false

	var request = Request.make_new();
	request.method = 'BREW';
	request.uri = '/stanford/teapot';



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

				it('should allow handling');

			});

		}); // describe feature



		describe('middleware management', function() {

			it('should allow insertion', function(signalAsyncTestFinished) {
				var out = CUT.make_new();
				out.use(IntegratedMWs.default());

				var trans = out.startup_create_session_and_create_transaction();

				var promise = out.process_request(trans, request);
				promise.spread(function on_success(context, request, response){
					response.return_code.should.equal(501);
					response.content.should.equal("Server is misconfigured. Please add middlewares to handle requests !");
					signalAsyncTestFinished();
				});
				promise.otherwise(function on_failure(context, request, response){
					expect(false).to.be.ok;
				});
			});

			it('should allow insertion of a chain', function(signalAsyncTestFinished) {
				var out = CUT.make_new();
				out.use(IntegratedMWs.logger());
				out.use(IntegratedMWs.base(function process(context, req, res, next) {
					res.meta["tag1"] = "base was here !";
					next();
				},
				function back_process(context, req, res) {
					res.meta["tag2"] = "base was back !";
					res.send();
				}));
				out.use(IntegratedMWs.default());

				var trans = out.startup_create_session_and_create_transaction();

				var promise = out.process_request(trans, request);
				promise.spread(function on_success(context, request, response){
					response.return_code.should.equal(501);
					response.content.should.equal("Server is misconfigured. Please add middlewares to handle requests !");
					expect(response.meta["tag1"]).to.equal("base was here !");
					expect(response.meta["tag2"]).to.equal("base was back !");
					signalAsyncTestFinished();
				});
				promise.otherwise(function on_failure(context, request, response){
					expect(false).to.be.ok;
				});
			});

		}); // describe feature

	}); // describe CUT
}); // requirejs module
