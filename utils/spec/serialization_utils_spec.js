if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'underscore',
	'backbone',
	'when',

	'mocha'
],
function(chai, _, Backbone, when, BaseModel, GenericStore, SyncToStoreMixin, should_implement_backbone_sync_api, RestlinkServer, CUT) {
	"use strict";

	var expect = chai.expect;
	//chai.should();
	chai.Assertion.includeStack = true; // defaults to false



	describe('Serialization utils', function() {



	}); // describe CUT
}); // requirejs module
