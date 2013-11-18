if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'restlink/server/middleware/integrated',
	'restlink/core/request',
	'network-constants/http',
	'mocha'
],
function(chai, CUT, Request, http_constants) {
	"use strict";

	var expect = chai.expect;
	chai.should();
	chai.Assertion.includeStack = true; // defaults to false


	describe('Restlink listing of integrated middlewares', function() {


		// we replicate the most complicated tests of each

		it('should expose the base one with proper parameters', function(signalAsyncTestFinished) {
			var out = CUT.base(function process(context, req, res) {
				res.content = "I'm a teapot !";
				res.send();
			},
			function process(context, req, res) {
				res.return_code = http_constants.status_codes.status_400_client_error_bad_request;
				res.content += " Really, dude.";
				res.send();
			});

			var trans = {};
			var request = Request.make_new_stanford_teapot();
			var promise = out.head_process_request(trans, request);

			promise.spread(function on_success(context, request, response){
				response.method.should.equal('BREW');
				response.uri.should.equal('/stanford/teapot');
				response.return_code.should.equal(http_constants.status_codes.status_400_client_error_bad_request);
				response.content.should.equal("I'm a teapot ! Really, dude.");
				signalAsyncTestFinished();
			});
			promise.otherwise(function on_failure(context, request, response){
				expect(false).to.be.ok;
			});
		});



		it('should expose the logger one with proper parameters', function(signalAsyncTestFinished) {

			// by using a custom logging function,
			// we'll be able to check what is logged
			var buffer = "";
			var custom_log_function = function() {
				for(var i = 0; i<arguments.length; ++i) {
					buffer += arguments[i].toString();
				}
			};

			var out = CUT.logger(custom_log_function);
			out.use( CUT.no_middleware() ); // we MUST have another handler after us since logger doesn't send the response

			var trans = {};
			var request = Request.make_new_stanford_teapot();
			var promise = out.head_process_request(trans, request);

			promise.spread(function on_success(context, request, response) {
				var exepected_buffer = request.date
						+ " > request /stanford/teapot.BREW(undefined)"
						+ response.date
						+ ' < response to /stanford/teapot.BREW(...) : [501] "Server is misconfigured. Please add middlewares to handle requests !"';
				//console.log(response);
				//console.log(exepected_buffer);
				//console.log(buffer);
				response.method.should.equal('BREW');
				response.uri.should.equal('/stanford/teapot');
				response.return_code.should.equal(http_constants.status_codes.status_501_server_error_not_implemented);
				response.content.should.equal("Server is misconfigured. Please add middlewares to handle requests !");
				buffer.should.equal(exepected_buffer);
				signalAsyncTestFinished();
			});
			promise.otherwise(function on_failure(context, request, response){
				expect(false).to.be.ok;
			});
		});



		it('should expose the default one with proper parameters', function(signalAsyncTestFinished) {
			var out = CUT.no_middleware();
			out.should.exist;
			out.should.be.an('object');

			var trans = {};
			var request = Request.make_new_stanford_teapot();
			var promise = out.head_process_request(trans, request);

			promise.spread(function on_success(context, request, response){
				response.return_code.should.equal(http_constants.status_codes.status_501_server_error_not_implemented);
				response.content.should.equal("Server is misconfigured. Please add middlewares to handle requests !");
				signalAsyncTestFinished();
			});
			promise.otherwise(function on_failure(context, request, response){
				expect(false).to.be.ok;
			});
		});

		it("should expose the 'not found' one with proper parameters");

	}); // describe CUT
}); // requirejs module
