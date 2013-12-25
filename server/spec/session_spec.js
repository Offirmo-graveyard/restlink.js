if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'restlink/server/session',
	'mocha'
],
function(chai, CUT) {
	"use strict";

	var expect = chai.expect;
	chai.should();
	chai.Assertion.includeStack = true; // defaults to false


	describe('Restlink server session', function() {


		describe('instantiation', function() {

			it('should work', function() {
				var out = CUT.make_new();
				out.should.exist;
				out.should.be.an('object');
			});

			it('should set default values', function() {
				var out = CUT.make_new();

				out.get_creation_timestamp().should.be.above(0);
				out.get_last_access_timestamp().should.equals(out.get_creation_timestamp());

				out.get_timeout_in_millis().should.be.above(1000);

				out.is_valid().should.be.true;
			});

		}); // describe feature

		describe('termination', function() {

			it('should be automatic');

			it('should be doable manually', function() {
				var out = CUT.make_new();

				out.invalidate();
				out.is_valid().should.be.false;
			});

		}); // describe feature

		describe('request management', function() {

			it('should accept requests', function() {
				var out = CUT.make_new();

				var req = {};
				out.register_request(req);

				// check augmentations
				expect( req ).to.respondTo( 'get_session' );
				expect( req ).to.respondTo( 'is_done' );
				expect( req ).to.respondTo( 'done' );
				expect( req.session_infos_ ).to.deep.equal({
					parent_session : out,
					timestamp      : req.session_infos_.timestamp,
					is_done        : false
				} );
			});

			it('should allow termination', function() {
				var out = CUT.make_new();

				var req = {};
				out.register_request(req);

				// check termination
				out.terminate_request(req);
				expect( req.session_infos_).to.deep.equal({
					parent_session : undefined,
					timestamp      : req.session_infos_.timestamp,
					is_done        : true
				} );
			});

			it('should propagate session termination', function() {
				var out = CUT.make_new();

				var req = {};
				out.register_request(req);

				out.invalidate();

				// invalidation propagated
				expect( req.session_infos_).to.deep.equal({
					parent_session : undefined,
					timestamp      : req.session_infos_.timestamp,
					is_done        : true
				} );
			});

		}); // describe feature

	}); // describe CUT
}); // requirejs module
