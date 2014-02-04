if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'restlink/utils/chai-you-promised',
	'underscore',
	'restlink/server',
	'restlink/core/request',
	'base-objects/backbone/base_model',
	'mocha'
],
function(chai, Cyp, _, RestlinkServer, Request, BaseModel) {
	"use strict";

	var expect = chai.expect;
	chai.should();
	chai.Assertion.includeStack = true; // defaults to false



	var TestModel = BaseModel.extend({

		defaults: function(){
			var this_class_defaults = {
				url: 'testobject', //< (backbone) url fragment for this object

				attr1: 12,
				attr2: [ 'chai', 'underscore' ],
				attr3: { code: 543 }
			};

			// merge with parent's defaults if needed
			var parent_defaults = new BaseObject().attributes;
			var defaults = _.defaults(this_class_defaults, parent_defaults);

			return defaults;
		}
	});




	describe('[Integration] Restlink', function() {


		describe('simple setup', function() {

			it('should work for a simple handler', function(signalAsyncTestFinished) {

				// create a restlink server
				var restlink_server = RestlinkServer.make_new();

				// give it a name for debug
				restlink_server.set_denomination("test01");

				// add handlers
				var teapot_BREW_callback = function(req, res) {
					res.with_status(400)
						.with_content_type('text/plain')
						.with_content("I'm a teapot !");

					res.send();
				};

				restlink_server.on("/stanford/teapot", "BREW", teapot_BREW_callback);

				// start the server
				restlink_server.startup();

				// open a connexion to it
				var client = restlink_server.open_direct_connection();

				// send a request
				var request = client.make_new_request()
						.with_uri("/stanford/teapot")
						.with_method("BREW");

				var promise = client.process_request(request);

				Cyp.finish_test_expecting_promise_to_be_fulfilled_with_conditions(promise, signalAsyncTestFinished, function(response) {
					response.return_code.should.equal(400);
					response.content.should.equal("I'm a teapot !");
				});
			});

		}); // describe feature


		describe('more complete setup', function() {

			it('should work for a full object handler'); // to be precised

		}); // describe feature

	}); // describe CUT
}); // requirejs module
