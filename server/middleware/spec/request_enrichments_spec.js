if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'restlink/utils/chai-you-promised',
	'when',
	'restlink/server/middleware/request_enrichments',
	'restlink/core/request',
	'restlink/server/spec/debug_core',
	'restlink/server/session',
	'restlink/server/middleware/base',
	'mocha'
],
function(chai, Cyp, when, CUT, Request, DebugCore, Session, BaseMiddleware) {
	"use strict";

	var expect = chai.expect;
	chai.should();
	chai.Assertion.includeStack = true; // defaults to false


	describe('Offirmo Middleware Request Enrichment', function() {


		describe('processing', function() {

			it('should work in nominal case', function() {
				var request = Request.make_new();
				var fake_context = {};
				CUT.process(request, fake_context);
				// nothing more, just to check it doesn't throw
			});

			it('should set default values', function() {
				var request = Request.make_new();
				var fake_context = {};
				CUT.process(request, fake_context);

				// check augmentations
				expect( request ).to.respondTo("get_match_infos");
				expect( request.middleware_ ).to.exist;
			});

			it('should not work if mandatory args are missing', function() {
				// no args at all
				var tempfn1 = function() { CUT.process(); };
				tempfn1.should.throw(Error, "Offirmo Middleware : No request to enrich !");
			});

		}); // describe feature


		describe('match infos computing', function() {

			it('should detect problems', function() {
				var request = Request.make_new();
				CUT.process(request);

				// should throw since context not fully set (no session nor server)
				var tempfn = function() { request.get_match_infos(); };
				tempfn.should.throw(Error, "Can\'t compute match infos : request is not linked to a session !");

				var session = Session.make_new();
				session.register_request(request);
				// should throw since context not fully set (no server)
				var tempfn2 = function() { request.get_match_infos(); };
				tempfn2.should.throw(Error, "Can\'t compute match infos : session parents are not fully initialized !");

			});

			it('should work in nominal case', function(signalAsyncTestFinished) {

				var test_MW = BaseMiddleware.make_new(function process(req, res) {
					// get match infos !
					var match_infos = req.get_match_infos();
					// and check it
					expect(match_infos).to.exist;
					match_infos.found.should.be.false;

					res.set_to_internal_error();
					res.send();
				});

				var core = DebugCore.make_new();
				core.use(test_MW);

				var request = Request.make_new_stanford_teapot();
				core.startup_and_create_session(request);
				var promise = core.process_request(request);

				Cyp.finish_test_expecting_promise_to_be_fulfilled(promise, signalAsyncTestFinished);
			});

		}); // describe feature

	}); // describe CUT

}); // requirejs module
