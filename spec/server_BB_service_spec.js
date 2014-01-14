if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'when',

	'base-objects/backbone/base_model',
	'generic_store/generic_store',
	'base-objects/backbone/sync_to_store_mixin',

	'restlink/server',
	'restlink/core/request',
	'network-constants/http',

	'mocha'
],
function(chai, when, BaseModel, GenericStore, SyncToStoreMixin, CUT, Request, http_constants) {
	"use strict";

	var expect = chai.expect;
	chai.should();
	chai.Assertion.includeStack = true; // defaults to false


	function prepare_test() {
		// create a restlink server
		var out = CUT.make_new();

		// create a new augmented model
		var OrderModel = BaseModel.extend({urlRoot : '/order'});
		SyncToStoreMixin.mixin(OrderModel.prototype);

		// set a model-wide store
		var store = GenericStore.make_new("memory");
		SyncToStoreMixin.set_model_store(OrderModel.prototype, store);

		// ask restlink to serve it at the given uri
		out.serve_model_at('/api/v1.0', OrderModel);

		out.startup();
		var client = out.open_direct_connection();

		return client;
	}

	function insert_sample_resource(client, optional_content) {
		var POSTcreate_success = when.defer();
		var content = optional_content || {
			items: [
				{
					drink: 'latte',
					size: 'large'
				}
			],
			location: 'takeaway'
		};

		var requestPOSTcreate = Request.make_new()
				.with_url('/api/v1.0/order')
				.with_method('POST')
				.with_content(content);
		var promisePOSTcreate = client.process_request(requestPOSTcreate);
		promisePOSTcreate.spread(function on_success(request, response){
			response.method.should.equal('POST');
			response.uri.should.equal('/api/v1.0/order');
			response.return_code.should.equal(http_constants.status_codes.status_200_ok);
			expect(response.content).to.have.property('id');
			POSTcreate_success.resolve(response.content.id);
		});
		promisePOSTcreate.otherwise(function on_failure(){
			expect(false).to.be.ok;
		});

		return POSTcreate_success.promise;
	}


	describe('Restlink Server (continued)', function() {

		describe('Backbone Model service', function() {

			// try the common REST routes
			// with an example from Jim Webber

			//   POST /order = create
			it('[Create] should allow creation of a resource with POST', function(signalAsyncTestFinished) {
				var client = prepare_test();

				var promise_POST_create = insert_sample_resource(client);

				promise_POST_create.then(function() {
					signalAsyncTestFinished();
				});
			});

			// GET /order/123       read
			it('[Read] should allow read of a resource with GET', function(signalAsyncTestFinished) {
				var client = prepare_test();

				var test_rsrc_insertion = insert_sample_resource(client);

				test_rsrc_insertion.then(function(id) {
					var requestGETOne = Request.make_new()
							.with_url('/api/v1.0/order/' + id)
							.with_method('GET');
					var promiseGETone = client.process_request(requestGETOne);
					promiseGETone.spread(function on_success(request, response){
						response.method.should.equal('GET');
						response.uri.should.equal('/api/v1.0/order/' + id);
						response.return_code.should.equal(http_constants.status_codes.status_200_ok);
						expect(response.content).to.deep.equals({
							items: [
								{
									drink: 'latte',
									size: 'large'
								}
							],
							location: 'takeaway'
						});
						signalAsyncTestFinished();
					});
					promiseGETone.otherwise(function on_failure(){
						expect(false).to.be.ok;
					});
				});
			});

			// POST /order/123 = create/update
			// here : as create
			it('[Create] should NOT allow creation of a resource with POST and an explicit id', function(signalAsyncTestFinished) {
				var client = prepare_test();

				var requestPOSTcreate_with_id = Request.make_new()
						.with_url('/api/v1.0/order/123') // note the explicit id
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
				var promisePOSTcreate_with_id = client.process_request(requestPOSTcreate_with_id);
				promisePOSTcreate_with_id.spread(function on_success(request, response){
					response.method.should.equal('POST');
					response.uri.should.equal('/api/v1.0/order/123');
					response.return_code.should.equal(http_constants.status_codes.status_501_server_error_not_implemented);
					signalAsyncTestFinished();
				});
				promisePOSTcreate_with_id.otherwise(function on_failure(){
					expect(false).to.be.ok;
				});
			});

			// POST /order/123 = create/update
			// here : as update
			it('[Update] should NOT allow update of a resource with POST');

			// * POST /orders         create_multiple
			// -> not supported in either create, create multiple or update version. (not needed)
			it('[Create] should NOT allow multiple resources creation with POST');


			// DELETE /order/123    delete
			it('[Delete] should allow deletion of a resource with DELETE', function(signalAsyncTestFinished) {
				var client = prepare_test();

				var test_rsrc_insertion = insert_sample_resource(client);

				test_rsrc_insertion.then(function(id) {
					var requestDeleteOne = Request.make_new()
							.with_url('/api/v1.0/order/' + id)
							.with_method('DELETE');
					var promiseDELETEone = client.process_request(requestDeleteOne);
					promiseDELETEone.spread(function on_success(request, response){
						response.method.should.equal('DELETE');
						response.uri.should.equal('/api/v1.0/order/' + id);
						response.return_code.should.equal(http_constants.status_codes.status_200_ok);
						expect(response.content).to.be.empty;
						signalAsyncTestFinished();
					});
					promiseDELETEone.otherwise(function on_failure(){
						expect(false).to.be.ok;
					});
				});
			});
			it('[Delete] should correctly handle deletion of an inexisting resource with DELETE', function(signalAsyncTestFinished) {
				var client = prepare_test();

				var requestDeleteOne = Request.make_new()
						.with_url('/api/v1.0/order/123') // non existing
						.with_method('DELETE');
				var promiseDELETEone = client.process_request(requestDeleteOne);
				promiseDELETEone.spread(function on_success(request, response) {
					response.method.should.equal('DELETE');
					response.uri.should.equal('/api/v1.0/order/123');
					response.return_code.should.equal(http_constants.status_codes.status_200_ok);
					signalAsyncTestFinished();
				});
				promiseDELETEone.otherwise(function on_failure(){
					expect(false).to.be.ok;
				});
			});

			// *DELETE /orders       delete all
			it('[Delete] should NOT allow mass deletion with DELETE');


			// PUT /order/123       create/update
			// 1) as update
			it('[Update] should allow update of a resource with PUT', function(signalAsyncTestFinished) {
				var client = prepare_test();

				var test_rsrc_insertion = insert_sample_resource(client);

				var PUTUpdate_success = when.defer();
				test_rsrc_insertion.then(function(id) {
					var requestPUTupdate = Request.make_new()
							.with_url('/api/v1.0/order/' + id)
							.with_method('PUT')
							.with_content({
								items: [
									{
										drink: 'tea',
										size: 'medium'
									},
									{
										drink: 'expresso'
									}
								]
							});
					var promisePUTupdate = client.process_request(requestPUTupdate);
					promisePUTupdate.spread(function on_success(request, response){
						response.method.should.equal('PUT');
						response.uri.should.equal('/api/v1.0/order/' + id);
						response.return_code.should.equal(http_constants.status_codes.status_200_ok);
						PUTUpdate_success.resolve(id);
					});
					promisePUTupdate.otherwise(function on_failure(){
						expect(false).to.be.ok;
					});
				});

				// now read back to ensure correct update
				PUTUpdate_success.promise.then(function(id) {
					var requestGET = Request.make_new()
							.with_url('/api/v1.0/order/' + id)
							.with_method('GET');
					var promiseGET = client.process_request(requestGET);
					promiseGET.spread(function on_success(request, response){
						response.method.should.equal('GET');
						response.uri.should.equal('/api/v1.0/order/' + id);
						response.return_code.should.equal(http_constants.status_codes.status_200_ok);
						expect(response.content).to.deep.equals({
							items: [
								{
									drink: 'tea',
									size: 'medium'
								},
								{
									drink: 'expresso'
								}
							],
							location: 'takeaway'
						});
						signalAsyncTestFinished();
					});
					promisePUTupdate.otherwise(function on_failure(){
						expect(false).to.be.ok;
					});
				});
			});

			// GET /orders          read all
			it('[Read] should allow read of all resource with GET', function(signalAsyncTestFinished) {
				var client = prepare_test();

				var test_rsrc_1_insertion = insert_sample_resource(client);
				var test_rsrc_2_insertion = insert_sample_resource(client, {
					items: [
						{
							drink: 'tea',
							size: 'medium'
						},
						{
							drink: 'expresso'
						}
					],
					location: 'takeaway'
				});

				var test_rsrc_insertion = when.join(test_rsrc_1_insertion, test_rsrc_2_insertion);
				test_rsrc_insertion.then(function(id) {
					var requestGETall = Request.make_new()
							.with_url('/api/v1.0/order')
							.with_method('GET');
					var promiseGETall = client.process_request(requestGETall);
					promiseGETall.spread(function on_success(request, response){
						response.method.should.equal('GET');
						response.uri.should.equal('/api/v1.0/order');
						response.return_code.should.equal(http_constants.status_codes.status_200_ok);
						expect(response.content).to.deep.equals(
							[
								{
									items: [
										{
											drink: 'latte',
											size: 'large'
										}
									],
									location: 'takeaway'
								},
								{
									items: [
										{
											drink: 'tea',
											size: 'medium'
										},
										{
											drink: 'expresso'
										}
									],
									location: 'takeaway'
								}
							]);
						signalAsyncTestFinished();
					});
					promiseGETall.otherwise(function on_failure(){
						expect(false).to.be.ok;
					});
				},function on_failure() {
					expect(false).to.be.ok;
				});
			});

			// *GET /order           read all
			// GET /order?foo=bar   find

		}); // describe feature

	}); // describe CUT
}); // requirejs module
