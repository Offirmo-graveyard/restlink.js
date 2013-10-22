if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'restlink/server/transaction',
	'restlink/server/core',
	'restlink/core/request',
	'restlink/core/response',
	'restlink/server/rest_target_indexed_shared_container',
	'extended-exceptions',
	'mocha'
],
function(chai, CUT, ServerCore, Request, Response, RestIndexedContainer, EE) {
	"use strict";

	var expect = chai.expect;
	chai.should();
	chai.Assertion.includeStack = true; // defaults to false

	var request = Request.make_new();
	request.method = 'BREW';
	request.uri = '/stanford/teapot';

	describe('Restlink server transaction', function() {

		describe('instantiation', function() {

			it('should work', function() {
				var out = CUT.make_new();
				out.should.exist;
				out.should.be.an('object');
			});

			it('should set default values', function() {
				var out = CUT.make_new();

				out.is_valid().should.be.true;
			});

		}); // describe feature

		describe('termination', function() {

			it('should be doable manually', function() {
				var out = CUT.make_new();

				out.invalidate();
				out.is_valid().should.be.false;
			});

		}); // describe feature

		describe('origin', function() {

			it('should come from a core via a session', function() {
				var core = ServerCore.make_new();
				core.startup();
				var session = core.create_session();
				var out = session.create_transaction();

				out.should.exist;
				expect(out).to.be.an('object');
				expect(out).to.be.an.instanceof(CUT.klass);
			});

		}); // describe feature

		/*
		describe('matching infos', function() {

			it('should be computed on demand', function() {
				// the object need to be full fledged this time
				var core = ServerCore.make_new();
				core.startup();
				var session = core.create_session();
				var out = session.create_transaction();

				out.set_request(request);

				var match_infos = out.get_match_infos();
				match_infos.should.exist;
				match_infos.found.should.be.false;
			});

		}); // describe feature
*/


	}); // describe CUT
}); // requirejs module
