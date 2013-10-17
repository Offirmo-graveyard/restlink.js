// Thank you Mozilla
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String

if (typeof define !== 'function') { var define = require('amdefine')(module); }


/*globals define*/
// Assumes all supplied String instance methods already present (one may use shims for these if not available)
(function () {
	'use strict';

	var i,
	// We could also build the array of methods with the following, but the
	//   getOwnPropertyNames() method is non-shimable:
	// Object.getOwnPropertyNames(String).filter(function (methodName) {return typeof String[methodName] === 'function'});
		methods = [
			'quote', 'substring', 'toLowerCase', 'toUpperCase', 'charAt',
			'charCodeAt', 'indexOf', 'lastIndexOf', 'startsWith', 'endsWith',
			'trim', 'trimLeft', 'trimRight', 'toLocaleLowerCase',
			'toLocaleUpperCase', 'localeCompare', 'match', 'search',
			'replace', 'split', 'substr', 'concat', 'slice'
		],
		methodCount = methods.length,
		assignStringGeneric = function (methodName) {
			var method = String.prototype[methodName];
			String[methodName] = function (arg1) {
				return method.apply(arg1, Array.prototype.slice.call(arguments, 1));
			};
		};

	for (i = 0; i < methodCount; i++) {
		assignStringGeneric(methods[i]);
	}
}());
