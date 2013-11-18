if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'when',
	'restlink/server/middleware/request_enrichments',
	'restlink/core/request',
	'restlink/server/core',
	'restlink/server/middleware/base',
	'mocha'
],
function(chai, when, CUT, Request, ServerCore, BaseMiddleware) {
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
			});

			it('should set default values', function() {
				var request = Request.make_new();
				var fake_context = {};
				CUT.process(request, fake_context);

				request.should.respondTo("get_match_infos");
			});

			it('should not work in mandatory args are missing', function() {
				// no args at all
				var tempfn1 = function() { CUT.process(); };
				tempfn1.should.throw(Error, "Offirmo Middleware : No request to enrich !");

				// no request
				var request = Request.make_new();
				var tempfn2 = function() { CUT.process(request); };
				tempfn2.should.throw(Error, "Offirmo Middleware : A transaction is needed to enrich a request !");
			});

		}); // describe feature


		describe('match infos computing', function() {

			it('should detect problems', function() {
				var request = Request.make_new();
				var fake_context = {};
				CUT.process(request, fake_context);

				// should throw since context not fully set
				var tempfn = function() { request.get_match_infos(); };
				tempfn.should.throw(Error, "Can\'t compute match infos : This transaction parent session is unknown !");
			});

			it('should work in nominal case', function(signalAsyncTestFinished) {

				var test_MW = BaseMiddleware.make_new(function process(context, req, res) {
					// get match infos !
					var match_infos = req.get_match_infos();
					// and check it
					expect(match_infos).to.exist;
					match_infos.found.should.be.false;

					res.set_to_internal_error();
					res.send();
				});

				var core = ServerCore.make_new();
				core.use(test_MW);

				// register some routes ?
				//...

				var trans = core.startup_create_session_and_create_transaction();
				var request = Request.make_new().with_uri("/stanford/teapot").with_method("BREW");
				var promise = core.process_request(trans, request);

				promise.then(function() { signalAsyncTestFinished(); });
			});

		}); // describe feature

	}); // describe CUT

}); // requirejs module
