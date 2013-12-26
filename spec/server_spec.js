if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'when',

	'base-objects/backbone/base_model',
	'generic_store/generic_store',
	'base-objects/backbone/sync_to_store_mixin',

	'restlink/server',
	'restlink/server/adapters/direct',
	'restlink/core/request',
	'restlink/core/response',
	'network-constants/http',
	'mocha'
],
function(chai, when, BaseModel, GenericStore, SymcToStoreMixin, CUT, DirectServerAdapter, Request, Response, http_constants) {
	"use strict";

	var expect = chai.expect;
	chai.should();
	chai.Assertion.includeStack = true; // defaults to false


	describe('Restlink Server', function() {


		describe('instantiation', function() {

			it('should work', function() {
				var out = CUT.make_new();
				//noinspection BadExpressionStatementJS
				out.should.exist;
				out.should.be.an('object');
			});

			it('should set default values', function() {
				var out = CUT.make_new();
				out.is_started().should.be.false;
				out.get_denomination().should.equal("Anonymous");
			});

		}); // describe feature



		describe('startup / shutdown', function() {

			it('should work', function() {
				var out = CUT.make_new();

				out.is_started().should.be.false;
				out.startup();
				out.is_started().should.be.true;
				out.shutdown();
				out.is_started().should.be.false;
			});

		}); // describe feature



		describe('adapters interface', function() {

			it('should allow insertion and correctly propagate startup/shutdown', function() {
				var adapter_started = false;
				var fake_adapter = {
					startup : function() {
						adapter_started = true;
					},
					shutdown : function() {
						adapter_started = false;
					}
				};
				var out = CUT.make_new();

				out.startup();
				adapter_started.should.be.false;
				out.add_adapter(fake_adapter);
				adapter_started.should.be.true;
				out.shutdown();
				adapter_started.should.be.false;
			});

			it('should work', function(signalAsyncTestFinished) {
				var out = CUT.make_new();
				// let's try the direct adapter (even if it already has one)
				var direct_adapter = DirectServerAdapter.make_new();
				out.add_adapter(direct_adapter);

				out.startup();

				var client = direct_adapter.new_connection();

				// go for it
				var request = Request.make_new_stanford_teapot();
				var promise = client.process_request(request);

				// check result : should 404 but not 500
				promise.spread(function on_success(request, response){
					response.method.should.equal('BREW');
					response.uri.should.equal('/stanford/teapot');
					response.return_code.should.equal(http_constants.status_codes.status_404_client_error_not_found);
					response.content.should.equal("Not Found");
					signalAsyncTestFinished();
				});
				promise.otherwise(function on_failure(){
					expect(false).to.be.ok;
				});
			});

			it('should provide a direct adapter by default, for convenience', function(signalAsyncTestFinished) {
				var out = CUT.make_new();
				out.startup();

				var client = out.open_direct_connection();

				// go for it
				var request = Request.make_new_stanford_teapot();
				var promise = client.process_request(request);

				// check result : should 404 but not 500
				promise.spread(function on_success(request, response){
					response.method.should.equal('BREW');
					response.uri.should.equal('/stanford/teapot');
					response.return_code.should.equal(http_constants.status_codes.status_404_client_error_not_found);
					response.content.should.equal("Not Found");
					signalAsyncTestFinished();
				});
				promise.otherwise(function on_failure(){
					expect(false).to.be.ok;
				});

			});

		}); // describe feature



		describe('request handling', function() {

			it('should be configurable and should work', function(signalAsyncTestFinished) {
				var out = CUT.make_new();

				var teapot_BREW_callback = function(request, response) {
					response.return_code = http_constants.status_codes.status_400_client_error_bad_request;
					response.content_type = 'text';
					response.content = "I'm a teapot !";
					response.send();
				};
				out.on("/stanford/teapot", "BREW", teapot_BREW_callback);

				out.startup();
				var client = out.open_direct_connection();

				var request = Request.make_new_stanford_teapot();
				var promise = client.process_request(request);

				promise.spread(function on_success(request, response){
					response.method.should.equal("BREW");
					response.uri.should.equal("/stanford/teapot");
					response.return_code.should.equal(http_constants.status_codes.status_400_client_error_bad_request);
					expect(response.content).to.equals("I'm a teapot !");
					signalAsyncTestFinished();
				});
				promise.otherwise(function on_failure(){
					expect(false).to.be.ok;
				});
			});

		}); // describe feature



		describe('REST handling', function() {

			it('should allow easy service of a backbone model', function(signalAsyncTestFinished) {
				// create a restlink server
				var out = CUT.make_new();

				// create a new augmented model
				var OrderModel = BaseModel.extend({urlRoot : '/order'});
				SymcToStoreMixin.mixin(OrderModel.prototype);

				// set a model-wide store
				var store = GenericStore.make_new("memory");
				SymcToStoreMixin.set_model_store(OrderModel.prototype, store);

				// ask restlink to serve it at the given uri
				out.serve_model_at('/api/v1.0', OrderModel);

				out.startup();
				var client = out.open_direct_connection();

				// from Jim Webber examples
				var request1 = Request.make_new()
						.with_url('/api/v1.0/order')
						.with_method('POST')
						.with_content({
							items: [
								{
									drink: 'latte',
									size: 'large'
								}
							],
							location: 'takeaway'
						});
				var promise1 = client.process_request(request1);
				promise1.spread(function on_success(request, response){
					response.method.should.equal('POST');
					response.uri.should.equal('/api/v1.0/order');
					response.return_code.should.equal(http_constants.status_codes.status_200_ok);
					expect(response.content).to.have.property('id');
					signalAsyncTestFinished();
				});
				promise1.otherwise(function on_failure(){
					expect(false).to.be.ok;
				});
			});

		}); // describe feature

	}); // describe CUT
}); // requirejs module
