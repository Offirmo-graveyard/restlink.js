// Thank you Mozilla
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
// see also http://stackoverflow.com/questions/646628/javascript-startswith

if (typeof define !== 'function') { var define = require('amdefine')(module); }


/*globals define*/
// Assumes all supplied String instance methods already present (one may use shims for these if not available)
(function () {
	'use strict';

	// We could also build the array of methods with the following, but the
	//   getOwnPropertyNames() method is non-shimable:
	// Object.getOwnPropertyNames(String).filter(function (methodName) {return typeof String[methodName] === 'function'});
	var methods = [
			'quote', 'substring', 'toLowerCase', 'toUpperCase', 'charAt',
			'charCodeAt', 'indexOf', 'lastIndexOf', 'startsWith', 'endsWith',
			'trim', 'trimLeft', 'trimRight', 'toLocaleLowerCase',
			'toLocaleUpperCase', 'localeCompare', 'match', 'search',
			'replace', 'split', 'substr', 'concat', 'slice'
		];

	var implementations = {
		'startsWith': function startsWithPolyfilled(arg1) {
				var part = this.substr(0, arg1.length);
				return arg1 === part;
			},
		'endsWith': function endsWithPolyfilled(arg1) {
				var part = this.slice(-arg1.length);
				return arg1 === part;
			}
		};

	var methodCount = methods.length;

	function assignStringGeneric(methodName) {
		var method = String.prototype[methodName];

		// if method doesn't exist at all,
		// install our implementation in the prototype
		if(!method) {
			if(typeof implementations[methodName] === "undefined") {
				console.warn("string generic method not available : " + methodName);
			}
			else {
				console.log("polyfilling missing string generic method to proto : " + methodName);
				String.prototype[methodName] = implementations[methodName];
				method = implementations[methodName];
			}
		}

		/* add fun to the object itself ? Why ? Should ask Mozilla...
		if(typeof String[methodName] === "undefined" && method) {
			console.log("adding string generic method to object : " + methodName);
			String[methodName] = function (arg1) {
				return method.apply(arg1, Array.prototype.slice.call(arguments, 1));
			};
		}*/
	}

	for (var i = 0; i < methodCount; i++) {
		assignStringGeneric(methods[i]);
	}
}());
