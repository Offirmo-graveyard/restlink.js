/* Require.js definitions
 */

console.log("starting require js config...");

requirejs.config({

	// base URL from which component files will be searched
	// NOTE 1 : non-rsrc url below may not be affected by baseUrl
	// NOTE 2 : relative baseUrl base refers to the calling html !
	baseUrl: "",

	// http://requirejs.org/docs/api.html#config-enforceDefine
	enforceDefine: false,

	// require.js extensions (plugins)
	map: {
		'*': {
			// an extension to be able to wait for the DOM to be ready
			"domReady": "bower_components/requirejs-domready/domReady",
			// underscore is now replaced by lodash
			"underscore": "lodash"
		}
	},


	/////////////////////
	paths: {
		// AMD plugins (dirs or direct)
		"base-objects"        : "../../base-objects.js", // dir
		"extended-exceptions" : "../../extended-exceptions.js/extended_exceptions", // direct
		"generic_store"       : "../../generic_store.js", // dir
		"network-constants"   : "../../network-constants.js", // dir
		"restlink"            : "..", // dir
		// shim plugins
		"backbone"            : "bower_components/backbone/backbone",
		"chai"                : "bower_components/chai/chai",
		"chai-as-promised"    : "bower_components/chai-as-promised/lib/chai-as-promised",
		"json2"               : "bower_components/json2/json2",
		"mocha"               : "bower_components/mocha/mocha",
		"lodash"              : "bower_components/lodash/dist/lodash",
		"store"               : "bower_components/store.js/store",
		"when"                : "bower_components/when/when"
	},


	/////////////////////
	shim: {
		"backbone": {
			deps: [ "underscore" ],
			exports: "Backbone"
		},
		"lodash": {
			exports: "_"
		},
		"mocha" : {
			deps: [ ],
			exports: "mocha",
			init: function () {
				console.log("Hello from mocha shim ! Setting up mocha...");
				this.mocha.setup("bdd");
				return this.mocha;
			}
		},
		"store": {
			deps: [ "json2" ],
			exports: "store"
		}
	}
});

console.log("require js config done.");

// Start the main app logic.

// not optimal to wait for the full DOM but good for sharing this file amongst sandbox files
console.log("Waiting for DOM before starting app...");
requirejs(["domReady!"],
function() {
	console.log("DOM ready : starting application logic...");
	window.main();
});
