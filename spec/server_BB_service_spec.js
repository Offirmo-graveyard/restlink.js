if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'restlink/utils/chai-you-promised',
	'when',

	'base-objects/backbone/base_model',
	'generic_store/generic_store',
	'base-objects/backbone/sync_to_store_mixin',

	'restlink/server',
	'restlink/core/request',
	'network-constants/http',

	'restlink/utils/string_generics_shim',
	'mocha'
],
function(chai, Cyp, when, BaseModel, GenericStore, SyncToStoreMixin, CUT, Request, http_constants) {
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

	// shared test function
	function insert_sample_resource(client, optional_content) {
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
		return Cyp.filter_promise_ensuring_fulfilled_with_conditions(promisePOSTcreate, function(response) {
			expect(response.method     ).to.equal('POST');
			expect(response.uri        ).to.equal('/api/v1.0/order');
			expect(response.return_code).to.equal(http_constants.status_codes.status_201_created);
			expect(response.meta.Location).to.exist;
			expect(response.meta.Location.startsWith('/api/v1.0/order')).to.be.true;
			expect(response.content.id).to.exist;
			// for convenience, resolve with the id
			return response.content.id;
		});
	}


	describe('Restlink Server (continued)', function() {

		describe('Backbone Model service', function() {

			// try the common REST routes
			// with an example from Jim Webber

			//   POST /order = create
			it('[Create] should allow creation of a resource with POST', function(signalAsyncTestFinished) {
				var client = prepare_test();

				var promise = insert_sample_resource(client);

				Cyp.finish_test_expecting_promise_to_be_fulfilled(promise, signalAsyncTestFinished);
			});

			it('[Read] should correctly fail the read of an inexisting resource with GET', function(signalAsyncTestFinished) {
				var client = prepare_test();

				var requestGETOne = Request.make_new()
						.with_url('/api/v1.0/order/titi')
						.with_method('GET');
				var promiseGETone = client.process_request(requestGETOne);
				Cyp.finish_test_expecting_promise_to_be_fulfilled_with_conditions(promiseGETone, signalAsyncTestFinished, function(response) {
					response.method.should.equal('GET');
					response.return_code.should.equal(http_constants.status_codes.status_404_client_error_not_found);
				});
			});

			// GET /order/123       read
			it('[Read] should allow read of a resource with GET', function(signalAsyncTestFinished) {
				var client = prepare_test();

				var test_rsrc_insertion = insert_sample_resource(client);

				var promise = test_rsrc_insertion.then(function(id) {
					var requestGETOne = Request.make_new()
							.with_url('/api/v1.0/order/' + id)
							.with_method('GET');
					var promiseGETone = client.process_request(requestGETOne);
					// NOTE we return a new promise, thus filtering the parent promise
					return Cyp.filter_promise_ensuring_fulfilled_with_conditions(promiseGETone, function(response) {
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
					});
				});
				Cyp.finish_test_expecting_promise_to_be_fulfilled(promise, signalAsyncTestFinished);
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

				Cyp.finish_test_expecting_promise_to_be_fulfilled_with_conditions(promisePOSTcreate_with_id, signalAsyncTestFinished, function(response) {
					response.method.should.equal('POST');
					response.uri.should.equal('/api/v1.0/order/123');
					response.return_code.should.equal(http_constants.status_codes.status_501_server_error_not_implemented);
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

					Cyp.finish_test_expecting_promise_to_be_fulfilled_with_conditions(promiseDELETEone, signalAsyncTestFinished, function(response) {
						response.method.should.equal('DELETE');
						response.uri.should.equal('/api/v1.0/order/' + id);
						response.return_code.should.equal(http_constants.status_codes.status_204_ok_no_content);
						expect(response.content).to.be.empty;
					});
				});
			});


			it('[Delete] should correctly handle deletion of an inexisting resource with DELETE', function(signalAsyncTestFinished) {
				var client = prepare_test();

				var requestDeleteOne = Request.make_new()
						.with_url('/api/v1.0/order/123') // non existing
						.with_method('DELETE');
				var promiseDELETEone = client.process_request(requestDeleteOne);

				Cyp.finish_test_expecting_promise_to_be_fulfilled_with_conditions(promiseDELETEone, signalAsyncTestFinished, function(response) {
					response.method.should.equal('DELETE');
					response.uri.should.equal('/api/v1.0/order/123');
					// according to http://stackoverflow.com/a/16632048/587407
					response.return_code.should.equal(http_constants.status_codes.status_204_ok_no_content);
				});
			});

			// *DELETE /orders       delete all
			it('[Delete] should NOT allow mass deletion with DELETE');


			// PUT /order/123       create/update
			// 1) as update
			it('[Update] should allow update of a resource with PUT', function(signalAsyncTestFinished) {
				var client = prepare_test();

				var test_rsrc_insertion = insert_sample_resource(client);

				var PUTUpdate_success = test_rsrc_insertion.then(function(id) {
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
					// NOTE we return a promise, thus filtering/replacing the main promise
					return Cyp.filter_promise_ensuring_fulfilled_with_conditions(promisePUTupdate, function(response) {
						response.method.should.equal('PUT');
						response.uri.should.equal('/api/v1.0/order/' + id);
						response.return_code.should.equal(http_constants.status_codes.status_200_ok);
						// NOTE : we return id, thus replacing the result value in the promise chain
						return id;
					});
				});

				// now read back to ensure correct update
				var final_promise = PUTUpdate_success.then(function(id) {
					var requestGET = Request.make_new()
							.with_url('/api/v1.0/order/' + id)
							.with_method('GET');
					var promiseGET = client.process_request(requestGET);
					// NOTE we return a promise, thus filtering/replacing the main promise
					return Cyp.filter_promise_ensuring_fulfilled_with_conditions(promiseGET, function(response) {
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
					});
				});

				Cyp.finish_test_expecting_promise_to_be_fulfilled(final_promise, signalAsyncTestFinished);
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
				var final_promise = test_rsrc_insertion.then(function(ids) {
					var requestGETall = Request.make_new()
							.with_url('/api/v1.0/order')
							.with_method('GET');
					var promiseGETall = client.process_request(requestGETall);
					// NOTE we return a promise, thus filtering/replacing the main promise
					return Cyp.filter_promise_ensuring_fulfilled_with_conditions(promiseGETall, function(response) {
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
					});
				});

				Cyp.finish_test_expecting_promise_to_be_fulfilled(final_promise, signalAsyncTestFinished);
			});

			// *GET /order           read all
			// GET /order?foo=bar   find

		}); // describe feature

	}); // describe CUT
}); // requirejs module
