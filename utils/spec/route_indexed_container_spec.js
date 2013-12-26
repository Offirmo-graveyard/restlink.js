if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'underscore',
	'restlink/utils/route_indexed_container',
	'extended-exceptions',
	'mocha'
],
function(chai, _, CUT, EE) {
	"use strict";

	var expect = chai.expect;
	chai.should();
	chai.Assertion.includeStack = true; // defaults to false


	describe('Route-indexed container', function() {


		describe('instantiation', function() {

			it('should work', function() {
				var out = CUT.make_new();
				out.should.exist;
				out.should.be.an('object');
			});

			it('should set default values', function() {
				var out = CUT.make_new();
				//...
			});

		}); // describe feature

		describe('storage', function() {

			it('should allow good insertions', function() {
				var out = CUT.make_new();

				out.ensure( "/" );
				out.ensure( "/agent" );
				out.ensure( "/agents" );
				out.ensure( "/order/:id" );
				out.ensure( "/firm/:id" );
				out.ensure( "/firm/:id/order/:id" );
			});

			it('should reject bad insertions', function() {
				var out = CUT.make_new();

				// empty route, bad !
				var tempfn = function() { out.ensure( '' ); };
				tempfn.should.throw(CUT.exceptions.MalformedRouteError, "Route malformed : missing start !");

				// double slash, bad
				tempfn = function() { out.ensure("//"); };
				tempfn.should.throw(CUT.exceptions.MalformedRouteError, "Route malformed : empty segment !");

				// consecutive id in sequence, bad
				tempfn = function() { out.ensure("/foo/:id/:id"); };
				tempfn.should.throw(CUT.exceptions.MalformedRouteError, "Route malformed : a route can't have several consecutive ids !");

				// id directly after root, bad
				tempfn = function() { out.ensure("/:id"); };
				tempfn.should.throw(CUT.exceptions.MalformedRouteError, "Route malformed : root can't be followed by an id !");
			});

			it('should ignore trailing slash', function() {
				var out = CUT.make_new();

				// preparation
				out.ensure("/agent").foo = 20;

				// read back
				out.at("/agent").foo.should.equal(20);
				// this is equivalent, so we must get the same number
				out.at("/agent/").foo.should.equal(20);
			});

			it('should handle ids', function() {
				var out = CUT.make_new();

				// preparation
				out.ensure("/order/:id").foo = 30;

				// simple
				out.at("/order/1").foo.should.equal(30);
				// the number we attached to this route

				// anything should work
				out.at("/order/123soleil").foo.should.equal(30);

				// limit : huge value should be detected and should not crash
				out.at("/order/98765432109876543210").foo.should.equal(30);
			});

			it('should enforce limits on route size', function() {
				var out = CUT.make_new();

				var tempfn = function() { out.ensure("/abcdefghijklmnopqrstuvwxyzabcdef"); };
				tempfn.should.throw(CUT.exceptions.MalformedRouteError, "Route malformed : segment too long !");

				tempfn = function() { out.at("" +
				"/abcdefghi/abcdefghi/abcdefghi/abcdefghi/abcdefghi" +
				"/abcdefghi/abcdefghi/abcdefghi/abcdefghi/abcdefghi" +
				"/abcdefghi/abcdefghi/abcdefghi/abcdefghi/abcdefghi" +
				"/abcdefghi/abcdefghi/abcdefghi/abcdefghi/abcdefghi" +
				"/"); };
				tempfn.should.throw(CUT.exceptions.MalformedRouteError, "Route malformed : route too long !");
			});
		}); // describe feature

		describe('matching', function() {

			it('should work with a simple numeric id', function() {
				var out = CUT.make_new();

				// preparation
				out.ensure("/order/:id").foo = 30;

				//
				var match_infos = out.detailed_at("/order/378");
				match_infos.should.exist;

				match_infos.found.should.be.true;
				match_infos.payload.should.deep.equals({foo:30});
				match_infos.last_id.should.equals('378');
				match_infos.ids['order'].should.equals('378');

				match_infos.segments.length.should.equals(3);

				match_infos.segments[0].should.have.property('segment', '/');
				match_infos.segments[0].should.have.property('type',    'fixed');
				match_infos.segments[0].should.have.property('value',   '/');

				match_infos.segments[1].should.have.property('segment', 'order');
				match_infos.segments[1].should.have.property('type',    'fixed');
				match_infos.segments[1].should.have.property('value',   'order');

				match_infos.segments[2].should.have.property('segment', 'order');
				match_infos.segments[2].should.have.property('type',    'id');
				match_infos.segments[2].should.have.property('value',   '378');
			});

			it('should work with several numeric+alpha ids', function() {
				var out = CUT.make_new();

				// preparation
				out.ensure("/firm/:id/order/:id/part/:id").foo = 50;

				//
				var match_infos = out.detailed_at("/firm/ACME/order/513/part/2b");
				match_infos.should.exist;

				match_infos.found.should.be.true;
				match_infos.payload.should.deep.equals({foo:50});
				match_infos.last_id.should.equals('2b');
				match_infos.ids['firm'].should.equals('ACME');
				match_infos.ids['order'].should.equals('513');
				match_infos.ids['part'].should.equals('2b');

				match_infos.segments.length.should.equals(7);

				match_infos.segments[0].should.have.property('segment', '/');
				match_infos.segments[0].should.have.property('type',    'fixed');
				match_infos.segments[0].should.have.property('value',   '/');

				match_infos.segments[1].should.have.property('segment', 'firm');
				match_infos.segments[1].should.have.property('type',    'fixed');
				match_infos.segments[1].should.have.property('value',   'firm');

				match_infos.segments[2].should.have.property('segment', 'firm');
				match_infos.segments[2].should.have.property('type',    'id');
				match_infos.segments[2].should.have.property('value',   'ACME');

				match_infos.segments[3].should.have.property('segment', 'order');
				match_infos.segments[3].should.have.property('type',    'fixed');
				match_infos.segments[3].should.have.property('value',   'order');

				match_infos.segments[4].should.have.property('segment', 'order');
				match_infos.segments[4].should.have.property('type',    'id');
				match_infos.segments[4].should.have.property('value',   '513');

				match_infos.segments[5].should.have.property('segment', 'part');
				match_infos.segments[5].should.have.property('type',    'fixed');
				match_infos.segments[5].should.have.property('value',   'part');

				match_infos.segments[6].should.have.property('segment', 'part');
				match_infos.segments[6].should.have.property('type',    'id');
				match_infos.segments[6].should.have.property('value',   '2b');
			});

			it('should handle ill-formed requests');

		}); // describe feature

	}); // describe CUT
}); // requirejs module
