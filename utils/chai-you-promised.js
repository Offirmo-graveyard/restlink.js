/* prototype of a chai plugin for promises
 * TODO make it more "chai-like"
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }


define(
[
	'chai',
	'when'
],
function(chai, when) {
	"use strict";

	var expect = chai.expect;

	// all those functions are FINAL
	// they will end the current test
	// no more code / tests will be executed after that
	// since promise are async, the done() func MUST be provided

	function finish_test_expecting_promise_to_be_fulfilled_with_conditions(promise, done_func, optional_test_func) {
		// TODO check correct promise
		if( typeof done_func !== 'function' )
			throw new Error('finish_test_expecting_promise_to_be_fulfilled_with_conditions(...) must be given the done() func !');
		if(   typeof optional_test_func !== 'undefined'
			&& typeof optional_test_func !== 'function')
			throw new Error('finish_test_expecting_promise_to_be_fulfilled_with_conditions(...) must be given a func or nothing as third arg !');

		promise.then(function(args) {
			//console.log("examining resolved value...");
			try {
				var result; // = undefined = returning nothing, which is what we want by default
				if( typeof optional_test_func === 'function' )
					result = optional_test_func.apply(undefined, arguments);
				// we are at the end of the chain, if test_func return something,
				// it may be that the user is expecting some sort of chaining,
				// which is NOT provided
				if(typeof result !== 'undefined')
					throw new Error('finish_test_expecting_promise_to_be_fulfilled_with_conditions(...) optional test function returned something but no form of chaining is allowed at this stage. Please check !');
				//console.log("ok.");
				done_func(); // success
			} catch(error) {
				//console.log("resolved value examination ended with an exception...");
				// most likely a chai assertion failure
				done_func(error);
			}
		},
		function(reason) {
			//console.log("Unexpected rejection : examining reason... (" + error + ")");
			var error = -1; // safety
			// hey ! we expected this promise to be fulfilled !
			// report error :
			// - if error = undefined -> bad, we replace with something.
			// - if error = Error() -> that's what is expected, perfect !
			// - if error = anything else -> OK, will trigger a chai error report
			if(typeof reason === 'undefined')
				error = new Error('Promise was not fulfilled as expected, and even worse, it was rejected with no reason given !');
			else {
				error = new Error('Promise was not fulfilled as expected. It was rejected with reason : "' + reason + '"');
				if(reason instanceof Error)
					console.error("Promise was not fulfilled as expected. It was rejected with reason :", reason, reason.stack);
			}
			done_func(error);
		});
	}

	// since promise are async, the done() func MUST be provided
	function finish_test_expecting_promise_to_be_rejected_with_conditions(promise, done_func, optional_test_func) {
		// TODO check correct promise
		if( typeof done_func !== 'function' )
			throw new Error('expect_promise_to_be_fulfilled_with(...) must be given the done() func !');
		if(   typeof optional_test_func !== 'undefined'
			&& typeof optional_test_func !== 'function')
			throw new Error('expect_promise_to_be_fulfilled_with(...) must be given a func or nothing as third arg !');

		promise.then(function(value) {
			// hey ! we expected this promise to be rejected !
			var error = new Error('Promise was not rejected as expected but fulfilled with value : "' + value + '" !');
			done_func(error);
		},
		function(error) {
			// ok, rejected as expected
			try {
				var result; // = undefined = returning nothing, which is what we want by default
				if( typeof optional_test_func === 'function' )
					result = optional_test_func.apply(undefined, arguments);
				// we are at the end of the chain, if test_func return something,
				// it may be that the user is expecting some sort of chaining,
				// which is NOT provided
				if(typeof result !== 'undefined')
					throw new Error('finish_test_expecting_promise_to_be_rejected_with_conditions(...) optional test function returned something but no form of chaining is allowed at this stage. Please check !');
				done_func(); // success
			} catch(error) {
				// most likely a chai assertion failure
				done_func(error);
			}
		});
	}

	// utility for rejection with an Error()
	function finish_test_expecting_promise_to_be_rejected_with_error(promise, done_func, error_class, error_msg) {
		finish_test_expecting_promise_to_be_rejected_with_conditions(promise, done_func, function(error) {
			expect( error ).to.be.an.instanceof( error_class );
			expect( error.message ).to.equals( error_msg );
		});
	}

	function finish_test_expecting_all_those_promises_to_be_fulfilled(promise_array, done_func) {
		var new_promise = when.all(promise_array);
		finish_test_expecting_promise_to_be_fulfilled_with_conditions(new_promise, done_func);
	}

	// optional_test_and_filter_func may return something that will be used as the new promise value
	// return a promise !
	function filter_promise_ensuring_fulfilled_with_conditions(promise, optional_test_and_filter_func) {
		// TODO check correct promise
		if(   typeof optional_test_and_filter_func !== 'undefined'
			&& typeof optional_test_and_filter_func !== 'function')
			throw new Error('expect_promise_to_be_fulfilled_with(...) must be given a func or nothing as 2nd arg !');

		// filter by returning a new promise
		return promise.then(function(args) {
			// no need to try catch : covered by promise internals
			var result; // = undefined = returning nothing, which is what we want by default
			if( typeof optional_test_and_filter_func === 'function' ) {
				// REM : may throw, that's ok
				result = optional_test_and_filter_func.apply(undefined, arguments);
			}
			return result;
		},
		function(error) {
			// hey ! we expected this promise to be fulfilled !
			// report error :
			// - if error = undefined -> bad, we replace with something.
			// - if error = Error() -> that's what is expected, perfect !
			// - if error = anything else -> OK, will trigger a chai error report
			if(typeof error === 'undefined')
				error = new Error('Promise was not fulfilled as expected, and even worse, it was rejected with no reason given !');
			// rethrow to ensure rejection
			throw error;
		});
	}

	////////////////////////////////////
/*
	'restlink/utils/chai-you-promised',
*/
	return {
		// Cyp.finish_test_expecting_promise_to_be_fulfilled_with_conditions(promise, signalAsyncTestFinished, function
		'finish_test_expecting_promise_to_be_fulfilled_with_conditions': finish_test_expecting_promise_to_be_fulfilled_with_conditions,
		// alias for better expressiveness when no conditions
		// Cyp.finish_test_expecting_promise_to_be_fulfilled(promise, signalAsyncTestFinished);
		'finish_test_expecting_promise_to_be_fulfilled'                : finish_test_expecting_promise_to_be_fulfilled_with_conditions,
		// Cyp.finish_test_expecting_promise_to_be_rejected_with_conditions(promise, signalAsyncTestFinished, function
		'finish_test_expecting_promise_to_be_rejected_with_conditions' : finish_test_expecting_promise_to_be_rejected_with_conditions,
		// Cyp.finish_test_expecting_promise_to_be_rejected_with_error(promise, signalAsyncTestFinished,
		'finish_test_expecting_promise_to_be_rejected_with_error'      : finish_test_expecting_promise_to_be_rejected_with_error,
		// Cyp.finish_test_expecting_all_those_promises_to_be_fulfilled( [promise1, promise2], signalAsyncTestFinished );
		'finish_test_expecting_all_those_promises_to_be_fulfilled'     : finish_test_expecting_all_those_promises_to_be_fulfilled,
		// Cyp.filter_promise_ensuring_fulfilled_with_conditions(promise,
		'filter_promise_ensuring_fulfilled_with_conditions'            : filter_promise_ensuring_fulfilled_with_conditions
	};
}); // requirejs module
