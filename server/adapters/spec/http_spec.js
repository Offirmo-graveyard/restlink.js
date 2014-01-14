if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'restlink/server/adapters/http',
	'restlink/core/request',
	'restlink/core/response',
	'restlink/server/spec/debug_core',
	'network-constants/http',
	'mocha'
],
function(chai, CUT, Request, Response, DebugCore, http_constants) {
	"use strict";

	var expect = chai.expect;
	chai.should();
	chai.Assertion.includeStack = true; // defaults to false


	describe('Restlink direct server adapter', function() {


		describe('instantiation', function() {

			it('should work', function() {
				var out = CUT.make_new();
				out.should.exist;
				out.should.be.an('object');
			});

			it('should set default values', function() {
				var out = CUT.make_new();
				//console.log(out);
				out.is_started().should.be.false;
			});

		}); // describe feature

		describe('startup / shutdown', function() {

			it('should work', function() {
				var out = CUT.make_new();

				var fake_server = {};

				out.is_started().should.be.false;
				out.startup(fake_server);
				out.is_started().should.be.true;
				out.shutdown();
				out.is_started().should.be.false;
			});

		}); // describe feature

		describe('generated client', function() {

			it('should not be available when not started', function() {
				var out = CUT.make_new();

				// go for it
				var tempfn = function() { var client = out.new_connection(); };
				tempfn.should.throw(Error, "Can't open connection : server adapter is stopped.");
			});


			it('should work when started and configured', function(signalAsyncTestFinished) {

				// prepare a real server
				var server_core = DebugCore.make_new();

				var out_ = CUT.make_new(server_core);
				server_core.add_adapter(out_);
				server_core.startup_with_default_mw_if_needed();

				var out = out_.new_connection();

				// go for it
				var request = Request.make_new_stanford_teapot();
				// REM : out is a client, no need to setup session etc.
				var promise = out.process_request(request);

				// check result (expected error : we only configured as much)

				promise.spread(function on_success(request, response){
					response.method.should.equal('BREW');
					response.uri.should.equal('/stanford/teapot');
					response.return_code.should.equal(http_constants.status_codes.status_501_server_error_not_implemented);
					response.content.should.equal("Server is misconfigured. Please add middlewares to handle requests !");
					signalAsyncTestFinished();
				});
				promise.otherwise(function on_failure(){
					expect(false).to.be.ok;
				});
			});

		}); // describe feature

	}); // describe CUT
}); // requirejs module
