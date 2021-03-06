if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'restlink/core/response',
	'restlink/core/request',
	'network-constants/http',
	'mocha'
],
function(chai, CUT, Request, http_constants) {
	"use strict";

	var expect = chai.expect;
	chai.should();
	chai.Assertion.includeStack = true; // defaults to false


	describe('Restlink Response', function() {


		describe('instantiation', function() {

			it('should work', function() {
				var out = CUT.make_new();
				out.should.exist;
				out.should.be.an('object');
			});

			it('should set default values', function() {
				var out = CUT.make_new();

				out.return_code.should.equal(http_constants.status_codes.status_500_server_error_internal_error);
				expect(out.content).to.equals("");
			});

			it('should be instantiable from a request (basic)', function() {
				// basic version
				var request = Request.make_new_stanford_teapot();
				var out = CUT.make_new_from_request(request);
				//console.log(out);
				out.method.should.equal('BREW');
				out.uri.should.equal('/stanford/teapot');
				out.return_code.should.equal(http_constants.status_codes.status_500_server_error_internal_error);
				out.meta.should.deep.equal({});
				expect(out.content).to.equals("");
			});

			it('should be instantiable from a request (advanced)', function() {
				// more advanced version
				var request = Request.make_new_stanford_teapot();
				var out = CUT.make_new_from_request(request, {
					return_code: http_constants.status_codes.status_400_client_error_bad_request,
					content: "I'm a teapot !",
					meta: { 'version': 12 }
				});
				//console.log(out2);
				out.method.should.equal('BREW');
				out.uri.should.equal('/stanford/teapot');
				out.return_code.should.equal(http_constants.status_codes.status_400_client_error_bad_request);
				out.meta.should.deep.equal({ 'version': 12 });
				out.content.should.equal("I'm a teapot !");
			});

		}); // describe feature

		describe('utilities', function() {

			it('should provide convenient fluid setters', function() {
				// using setters to change fields
				var request = Request.make_new_stanford_teapot();
				var out = CUT.make_new_from_request(request)
						.with_status(400)
						.with_content("Dude, I'm a teapot !")
						.with_content_type('smurf/text')
						.with_meta({ 'traceroute': true });

				out.method.should.equal('BREW');
				out.uri.should.equal('/stanford/teapot');
				out.return_code.should.equal(http_constants.status_codes.status_400_client_error_bad_request);
				out.content.should.equal("Dude, I'm a teapot !");
				out.content_type.should.equal('smurf/text');
				out.meta.should.deep.equal({ 'traceroute': true });
			});


			it('should allow easy setting of return code to OK', function() {
				var request = Request.make_new_stanford_teapot();
				var out = CUT.make_new_from_request(request);

				out.with_content('toto');
				out.set_to_ok();
				out.method.should.equal('BREW');
				out.uri.should.equal('/stanford/teapot');
				out.return_code.should.equal(http_constants.status_codes.status_200_ok);
				out.content.should.equals('toto'); // should not have been altered
				out.content_type.should.equals('application/json'); // should not have been altered
			});


			it('should allow easy error generation', function() {
				var request = Request.make_new_stanford_teapot();
				var out = CUT.make_new_from_request(request);

				// with an explicit content
				out.set_to_error(http_constants.status_codes.status_403_client_forbidden, "my error content");
				out.method.should.equal('BREW');
				out.uri.should.equal('/stanford/teapot');
				out.return_code.should.equal(http_constants.status_codes.status_403_client_forbidden);
				out.content.should.equals("my error content");
				out.content_type.should.equals('application/json'); // default was kept

				// with auto content
				out.set_to_error(http_constants.status_codes.status_403_client_forbidden);
				out.method.should.equal('BREW');
				out.uri.should.equal('/stanford/teapot');
				out.return_code.should.equal(http_constants.status_codes.status_403_client_forbidden);
				out.content.should.equals('Forbidden');
				out.content_type.should.equals('text/plain'); // was automatically updated
			});


			it('should allow easy common errors generation : not implemented', function() {
				var request = Request.make_new_stanford_teapot();
				var out = CUT.make_new_from_request(request);

				// with an explicit content
				out.set_to_not_implemented("my NIMP content");
				out.method.should.equal('BREW');
				out.uri.should.equal('/stanford/teapot');
				out.return_code.should.equal(http_constants.status_codes.status_501_server_error_not_implemented);
				out.content.should.equals("my NIMP content");
				out.content_type.should.equals('application/json'); // default was kept

				// with auto content
				out.set_to_not_implemented();
				out.method.should.equal('BREW');
				out.uri.should.equal('/stanford/teapot');
				out.return_code.should.equal(http_constants.status_codes.status_501_server_error_not_implemented);
				out.content.should.equals('Not Implemented');
				out.content_type.should.equals('text/plain'); // was automatically updated
			});


			it('should allow easy common errors generation : internal error', function() {
				var request = Request.make_new_stanford_teapot();
				var out = CUT.make_new_from_request(request);

				// with an explicit content
				out.set_to_internal_error("my IE content");
				out.method.should.equal('BREW');
				out.uri.should.equal('/stanford/teapot');
				out.return_code.should.equal(http_constants.status_codes.status_500_server_error_internal_error);
				out.content.should.equals("my IE content");
				out.content_type.should.equals('application/json'); // default was kept

				// with auto content
				out.set_to_internal_error();
				out.method.should.equal('BREW');
				out.uri.should.equal('/stanford/teapot');
				out.return_code.should.equal(http_constants.status_codes.status_500_server_error_internal_error);
				out.content.should.equals('Internal Server Error');
				out.content_type.should.equals('text/plain'); // was automatically updated
			});


			it('should allow easy common errors generation : not found', function() {
				var request = Request.make_new_stanford_teapot();
				var out = CUT.make_new_from_request(request);

				// with an explicit content
				out.set_to_not_found("my 404 content");
				out.method.should.equal('BREW');
				out.uri.should.equal('/stanford/teapot');
				out.return_code.should.equal(http_constants.status_codes.status_404_client_error_not_found);
				out.content.should.equals("my 404 content");
				out.content_type.should.equals('application/json'); // default was kept

				// with auto content
				out.set_to_not_found();
				out.method.should.equal('BREW');
				out.uri.should.equal('/stanford/teapot');
				out.return_code.should.equal(http_constants.status_codes.status_404_client_error_not_found);
				out.content.should.equals('Not Found');
				out.content_type.should.equals('text/plain'); // was automatically updated
			});

		}); // describe feature

	}); // describe CUT
}); // requirejs module
