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

	var request = Request.make_new();
	request.method = 'BREW';
	request.uri = '/stanford/teapot';


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
				expect(out.content).to.be.undefined;
			});

			it('should be instantiable from a request (basic)', function() {
				// basic version
				var out = CUT.make_new_from_request(request);
				//console.log(out);
				out.method.should.equal('BREW');
				out.uri.should.equal('/stanford/teapot');
				out.return_code.should.equal(http_constants.status_codes.status_500_server_error_internal_error);
				out.meta.should.deep.equal({});
				expect(out.content).to.be.undefined;
			});

			it('should be instantiable from a request (advanced)', function() {
				// more advanced version
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
				var out = CUT.make_new_from_request(request)
						.with_status(400)
						.with_content("Dude, I'm a teapot !")
						.with_meta({ 'traceroute': true });

				out.method.should.equal('BREW');
				out.uri.should.equal('/stanford/teapot');
				out.return_code.should.equal(http_constants.status_codes.status_400_client_error_bad_request);
				out.content.should.equal("Dude, I'm a teapot !");
				out.meta.should.deep.equal({ 'traceroute': true });
			});


			it('should allow easy error generation', function() {
				var out = CUT.make_new_from_request(request);
				expect(out.content).to.be.undefined; // check

				out.set_to_error(http_constants.status_codes.status_403_client_forbidden);

				out.method.should.equal('BREW');
				out.uri.should.equal('/stanford/teapot');
				out.return_code.should.equal(http_constants.status_codes.status_403_client_forbidden);
				out.content.should.equals('Forbidden');

				// same but with a content
				out.set_to_error(http_constants.status_codes.status_403_client_forbidden, "my error content");

				out.method.should.equal('BREW');
				out.uri.should.equal('/stanford/teapot');
				out.return_code.should.equal(http_constants.status_codes.status_403_client_forbidden);
				out.content.should.equals("my error content");
			});


			it('should allow easy common errors generation : not implemented', function() {
				var out = CUT.make_new_from_request(request);
				expect(out.content).to.be.undefined; // check

				out.set_to_not_implemented();

				out.method.should.equal('BREW');
				out.uri.should.equal('/stanford/teapot');
				out.return_code.should.equal(http_constants.status_codes.status_501_server_error_not_implemented);
				out.content.should.equals('Not Implemented');

				// same but with a content
				out.set_to_not_implemented("my NIMP content");

				out.method.should.equal('BREW');
				out.uri.should.equal('/stanford/teapot');
				out.return_code.should.equal(http_constants.status_codes.status_501_server_error_not_implemented);
				out.content.should.equals("my NIMP content");
			});


			it('should allow easy common errors generation : internal error', function() {
				var out = CUT.make_new_from_request(request);
				expect(out.content).to.be.undefined; // check

				out.set_to_internal_error();

				out.method.should.equal('BREW');
				out.uri.should.equal('/stanford/teapot');
				out.return_code.should.equal(http_constants.status_codes.status_500_server_error_internal_error);
				out.content.should.equals('Internal Server Error');

				// same but with a content
				out.set_to_internal_error("my IE content");

				out.method.should.equal('BREW');
				out.uri.should.equal('/stanford/teapot');
				out.return_code.should.equal(http_constants.status_codes.status_500_server_error_internal_error);
				out.content.should.equals("my IE content");
			});

		}); // describe feature

	}); // describe CUT
}); // requirejs module
