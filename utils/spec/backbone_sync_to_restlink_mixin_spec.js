if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'underscore',
	'backbone',
	'when',

	'base-objects/backbone/base_model',
	'generic_store/generic_store',
	'base-objects/backbone/sync_to_store_mixin',
	'base-objects/backbone/spec/common_sync_api_spec',

	'restlink/server',
	'restlink/utils/backbone_sync_to_restlink_mixin',

	'mocha'
],
function(chai, _, Backbone, when, BaseModel, GenericStore, SyncToStoreMixin, should_implement_backbone_sync_api, RestlinkServer, CUT) {
	"use strict";

	var expect = chai.expect;
	//chai.should();
	chai.Assertion.includeStack = true; // defaults to false


	function prepare_test() {

		/////// Common code ///////

		// create a new augmented model
		var OrderModel = BaseModel.extend({urlRoot : '/order'});

		/////// server side ///////
		// create a restlink server
		var out = RestlinkServer.make_new();

		// since we need to set persistence Model-wide
		// we need to derive a copy for server and another for client
		// here : Server Side
		var OrderModelSS = OrderModel.extend();
		SyncToStoreMixin.mixin(OrderModelSS.prototype);

		// set a model-wide store
		var store = GenericStore.make_new("memory");
		SyncToStoreMixin.set_model_store(OrderModelSS.prototype, store);

		// ask restlink to serve it at the given uri
		out.serve_model_at('/api/v1.0', OrderModelSS);

		out.startup();
		var restlink_client = out.open_direct_connection();

		/////// client side ///////

		// since we need to set persistence Model-wide
		// we need to derive a copy for server and another for client
		// here : Client Side
		var OrderModelCS = OrderModel.extend({urlRoot : '/api/v1.0/order'});
		CUT.mixin(OrderModelCS.prototype);

		// set a model-wide restlink client
		CUT.set_model_restlink_client(OrderModelCS.prototype, restlink_client);

		return OrderModelCS;
	}


	describe('[Backbone Mixin] sync to restlink', function() {

		describe('mixin()', function() {

			it('should mix !', function() {
				var MUT = Backbone.Model.extend({});
				CUT.mixin(MUT.prototype);

				var out = new MUT();

				// yes that's all. basic of the basic.
			});

			it('should prevent a common param error', function() {
				var MUT = Backbone.Model.extend({});

				var tempfn = function() { CUT.mixin(MUT); }; // bad bad we should have passed the prototype
				expect( tempfn ).to.throw(Error, "Backbone sync() to restlink mixin() must be passed a prototype !");
			});

		});

		// shared test
		describe('', function() {
			beforeEach(function(){
				this.CUT = CUT;
				this.TestModel = prepare_test();
			});

			should_implement_backbone_sync_api();
		});


		describe('operations', function() {

		});

	}); // describe CUT
}); // requirejs module
