if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'underscore',
	'restlink/server/rest_target_indexed_shared_container',
	'extended-exceptions',
	'mocha'
],
function(chai, _, CUT, EE) {
	"use strict";

	var expect = chai.expect;
	chai.should();
	chai.Assertion.includeStack = true; // defaults to false


	describe('REST target (url+action) indexed container', function() {


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

		// note : advanced features are tested below, in "internal API"
		describe('regular API', function() {

			describe('storage', function() {

				it('should allow operations', function() {
					var out = CUT.make_new();
					//var out = out_.get_bound_interface("test key");

					out.ensure( "/agent/:id", "GET").test = 1;
					out.ensure( "/agent",     "PUT").test = 3;

					out.at( "/agent/:id", "GET").test.should.equals(1);
					out.at( "/agent/1",   "GET").test.should.equals(1);
					out.at( "/agent",     "PUT").test.should.equals(3);

					out.detailed_at( "/agent/1",   "GET").found.should.be.true;
				});

				it('should not mix infos', function() {
					var out = CUT.make_new();

					out.ensure( "/agent/:id", "GET").foo = 1;
					out.ensure( "/agent",     "PUT").foo = 3;

					out.ensure( "/agent/:id", "GET").bar = -1;
					out.ensure( "/agent",     "PUT").bar = -3;

					out.at( "/agent/:id", "GET").foo.should.equals(1);
					out.at( "/agent",     "PUT").foo.should.equals(3);

					out.at( "/agent/:id", "GET").bar.should.equals(-1);
					out.at( "/agent",     "PUT").bar.should.equals(-3);
				});

			}); // describe feature

			describe('matching', function() {

				it('should correctly handle inexistent data', function() {
					var out = CUT.make_new();

					var match_infos = out.detailed_at("/firm/ACME/order/513/part/2b", "PUT");

					match_infos.should.exist;
					match_infos.found.should.be.false;
					match_infos.route_found.should.be.false;
					match_infos.action_found.should.be.false;
					match_infos.found_no_actions_at_all.should.be.true;

					out.internal_ensure("/firm/:id/order/:id/part/:id", "PUT").toto = 1;

					var match_infos = out.detailed_at("/firm/ACME/order/513/part/2b", "GET");
					match_infos.should.exist;
					match_infos.found.should.be.false;
					match_infos.route_found.should.be.true;
					match_infos.action_found.should.be.false;
					match_infos.found_no_actions_at_all.should.be.false;
				});

				it('should correctly handle simple root /', function() {
					var out = CUT.make_new();

					var match_infos = out.detailed_at("/", "GET");

					match_infos.should.exist;
					match_infos.found.should.be.false;
					match_infos.route_found.should.be.true;
					match_infos.action_found.should.be.false;
					match_infos.found_no_actions_at_all.should.be.true;
				});

				it('should work with several numeric+alpha ids', function() {
					var out = CUT.make_new();

					// preparation
					out.ensure("/firm/:id/order/:id/part/:id", "PUT").toto = 1;
					//
					var match_infos = out.detailed_at("/firm/ACME/order/513/part/2b", "PUT");
					match_infos.should.exist;

					match_infos.found.should.be.true;
					match_infos.route_found.should.be.true;
					match_infos.action_found.should.be.true;

					match_infos.payload.toto.should.equals(1);
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

			}); // describe feature

		}); // describe feature (regular API)


		describe('internal API', function() {
			describe('storage', function() {

				it('should allow good insertions', function() {
					var out = CUT.make_new();

					out.ensure( "/",                   "GET");
					out.ensure( "/agent",              "GET");
					out.ensure( "/agent",              "PUT");
					out.ensure( "/agents",             "GET");
					out.ensure( "/order/:id",          "PUT");
					out.ensure( "/firm/:id",           "GET");
					out.ensure( "/firm/:id/order/:id", "PUT");
				});

				it('should handle simple access with or without ids', function() {
					var out = CUT.make_new();

					// preparation
					out.ensure("/order/:id", "GET").test = 1;

					// simple
					out.at("/order/1", "GET").test.should.equal(1);
				});

				// important since we tend to forget the action
				it('should check parameters', function() {
					var out = CUT.make_new();

					var tempfn = function() { out.ensure("/agent"); };
					tempfn.should.throw(EE.InvalidArgument, "action arg should be a string !");

					tempfn = function() { out.ensure("/agent", 3); };
					tempfn.should.throw(EE.InvalidArgument, "action arg should be a string !");

					tempfn = function() { out.ensure(undefined, "GET"); };
					tempfn.should.throw(EE.InvalidArgument, "route arg should be a string !");

					tempfn = function() { out.at("/agent"); };
					tempfn.should.throw(EE.InvalidArgument, "action arg should be a string !");

					// this one works with action undef, so check bad type
					tempfn = function() { out.detailed_at("/agent", 5); };
					tempfn.should.throw(EE.InvalidArgument, "action arg should be a string !");
				});

				it('should not mix infos', function() {
					var out = CUT.make_new();

					// preparation
					out.ensure("/order/:id", "GET").foo = 1;
					out.ensure("/order/:id", "PUT").foo = 2;
					out.ensure("/order/:id", "GET").bar = 3;
					out.ensure("/stanford/teapot", "BREW").foo = 4;
					out.ensure("/stanford/teapot", "GET").foo = 5;

					// check
					out.at("/order/:id", "GET").foo.should.equals(1);
					out.at("/order/:id", "PUT").foo.should.equals(2);
					out.at("/order/:id", "GET").bar.should.equals(3);
					out.at("/stanford/teapot", "BREW").foo.should.equals(4);
					out.at("/stanford/teapot", "GET").foo.should.equals(5);
				});

				it('should allow actions listing', function() {
					var out = CUT.make_new();

					// preparation
					out.ensure("/order/:id", "GET").foo = 1;
					out.ensure("/order/:id", "PUT").foo = 2;
					out.ensure("/order/:id", "GET").bar = 3;
					out.ensure("/stanford/teapot", "BREW").foo = 4;
					out.ensure("/stanford/teapot", "GET").foo = 5;

					// check
					var match1 = out.detailed_at("/order/6");
					expect(CUT.list_matched_methods(match1)).to.have.length(2);
					expect(CUT.list_matched_methods(match1)).to.include.members( [ 'GET', 'PUT' ] );

					var match2 = out.detailed_at("/stanford/teapot");
					expect(CUT.list_matched_methods(match2)).to.have.length(2);
					expect(CUT.list_matched_methods(match2)).to.include.members( [ 'BREW', 'GET' ] );

					var match3 = out.detailed_at("/toto");
					expect(CUT.list_matched_methods(match3)).to.have.length(0);

				});
			}); // describe feature

			describe('matching', function() {

				// we don't duplicate regular test which is equivalent

				it('should work with or without a key', function() {
					var out = CUT.make_new();

					// preparation
					out.ensure("/firm/:id/order/:id/part/:id", "PUT").toto = 1;
					//
					var match_infos = out.detailed_at("/firm/ACME/order/513/part/2b", "PUT");
					match_infos.payload.toto.should.equals(1);
				});

			}); // describe feature
		}); // describe feature (internal API)

	}); // describe CUT
}); // requirejs module
