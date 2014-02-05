if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'restlink/utils/chai-you-promised',
	'when',
	'restlink/server/middleware/response_enrichments',
	'restlink/core/response',
	'extended-exceptions',
	'mocha'
],
function(chai, Cyp, when, CUT, Response, EE) {
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
				CUT.process(response, fake_request);
			});

			it('should set default values', function() {
				var response = Response.make_new();
				var fake_request = {};
				CUT.process(response, fake_request);

				expect( response.middleware_ ).to.exist;
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

	}); // describe CUT

}); // requirejs module
