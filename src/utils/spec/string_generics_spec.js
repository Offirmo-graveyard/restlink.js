if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'restlink/utils/string_generics_shim',
	'mocha'
],
function(chai) {
	"use strict";

	var expect = chai.expect;

	describe('String generics', function() {

		describe('startsWith', function() {
			it('should work', function() {
				var out = "Hello world !";
				expect( out.startsWith("Hello")).to.be.true;
			});
		});

		describe('endsWith', function() {
			it('should work', function() {
				var out = "Hello world !";
				expect( out.endsWith("!")).to.be.true;
			});
		});
	});
});
