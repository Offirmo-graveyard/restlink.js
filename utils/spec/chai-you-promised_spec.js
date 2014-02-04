if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'restlink/utils/chai-you-promised',
	'when',
	'mocha'
],
function(chai, CUT, when) {
	"use strict";

	chai.Assertion.includeStack = true; // defaults to false
	var expect = chai.expect;


	// a helper function for testing expected chai-generated errors
	function expect_sub_test_to_fail_with_a_specific_error(sub_test_code, error_prototype, error_msg, signalAsyncTestFinished) {
		function internal_signalAsyncTestFinished(error) {
			try {
				expect( error         ).to.be.an.instanceOf(error_prototype);
				expect( error.message ).to.equals(error_msg);
				signalAsyncTestFinished(); // success
			}
			catch(e) {
				signalAsyncTestFinished(e); // problem
			}
		}

		// try/catch to handle case where sub test code throw synchronously
		try {
			sub_test_code(internal_signalAsyncTestFinished);
		}
		catch(e) {
			signalAsyncTestFinished(e);
		}
	}

	describe('Offirmo Chai promises helpers (prototype)', function() {




		////////////
		describe('expectation : finish_test_expecting_promise_to_be_fulfilled', function() {

			it('should work on a simple resolution', function(signalAsyncTestFinished) {
				var deferred = when.defer();
				var promise = deferred.promise;

				CUT.finish_test_expecting_promise_to_be_fulfilled(promise, signalAsyncTestFinished);

				deferred.resolve(42);
			});

			it('should work on a simple rejection', function(signalAsyncTestFinished) {
				expect_sub_test_to_fail_with_a_specific_error(function(signalAsyncTestFinished) {
					var deferred = when.defer();
					var promise = deferred.promise;

					CUT.finish_test_expecting_promise_to_be_fulfilled(promise, signalAsyncTestFinished);

					deferred.reject(new Error("oups !"));
				},
				Error, 'Promise was not fulfilled as expected. It was rejected with reason : "Error: oups !"',
				signalAsyncTestFinished);
			});

		}); // describe feature




		////////////
		describe('expectation : finish_test_expecting_promise_to_be_fulfilled_with_conditions', function() {

			it('should work on a simple resolution', function(signalAsyncTestFinished) {
				var deferred = when.defer();
				var promise = deferred.promise;

				CUT.finish_test_expecting_promise_to_be_fulfilled_with_conditions(promise, signalAsyncTestFinished);

				deferred.resolve(42);
			});

			it('should work on a simple rejection', function(signalAsyncTestFinished) {
				expect_sub_test_to_fail_with_a_specific_error(function(signalAsyncTestFinished) {
					var deferred = when.defer();
					var promise = deferred.promise;

					CUT.finish_test_expecting_promise_to_be_fulfilled_with_conditions(promise, signalAsyncTestFinished);

					deferred.reject(new Error("oups !"));
				},
				Error, 'Promise was not fulfilled as expected. It was rejected with reason : "Error: oups !"',
				signalAsyncTestFinished);
			});

			it('should work on a resolution with successful conditions', function(signalAsyncTestFinished) {
				var deferred = when.defer();
				var promise = deferred.promise;

				CUT.finish_test_expecting_promise_to_be_fulfilled_with_conditions(promise, signalAsyncTestFinished, function(value) {
					expect( value).to.equals( 42 );
				});

				deferred.resolve(42);
			});

			it('should work on a resolution with UNsuccessful conditions', function(signalAsyncTestFinished) {
				expect_sub_test_to_fail_with_a_specific_error(function(signalAsyncTestFinished) {
					var deferred = when.defer();
					var promise = deferred.promise;

					CUT.finish_test_expecting_promise_to_be_fulfilled_with_conditions(promise, signalAsyncTestFinished, function(value) {
						expect( value).to.equals( 43 ); // will fail
					});

					deferred.resolve(42);
				},
				Error, 'expected 42 to equal 43',
				signalAsyncTestFinished);
			});

			it('should correctly detect when a conditions function try to returns something', function(signalAsyncTestFinished) {
				expect_sub_test_to_fail_with_a_specific_error(function(signalAsyncTestFinished) {
					var deferred = when.defer();
					var promise = deferred.promise;

					CUT.finish_test_expecting_promise_to_be_fulfilled(promise, signalAsyncTestFinished, function(value) {
						return 1; // what it that ? No chaining is hadled in this function !
					});

					deferred.resolve(42);
				},
				Error, 'finish_test_expecting_promise_to_be_fulfilled_with_conditions(...) optional test function returned something but no form of chaining is allowed at this stage. Please check !',
				signalAsyncTestFinished);
			});

		}); // describe feature




		////////////
		describe('expectation : finish_test_expecting_promise_to_be_rejected_with_conditions', function() {

			it('should work on a simple resolution', function(signalAsyncTestFinished) {
				expect_sub_test_to_fail_with_a_specific_error(function(signalAsyncTestFinished) {
					var deferred = when.defer();
					var promise = deferred.promise;

					CUT.finish_test_expecting_promise_to_be_rejected_with_conditions(promise, signalAsyncTestFinished);

					deferred.resolve(42);
				},
				Error, 'Promise was not rejected as expected but fulfilled with value : "42" !',
				signalAsyncTestFinished);
			});

			it('should work on a simple rejection', function(signalAsyncTestFinished) {
				var deferred = when.defer();
				var promise = deferred.promise;

				CUT.finish_test_expecting_promise_to_be_rejected_with_conditions(promise, signalAsyncTestFinished);

				deferred.reject(new Error("oups !"));
			});

			it('should work on a rejection with successful conditions', function(signalAsyncTestFinished) {
				var deferred = when.defer();
				var promise = deferred.promise;

				CUT.finish_test_expecting_promise_to_be_rejected_with_conditions(promise, signalAsyncTestFinished, function(reason) {
					expect( reason.message ).to.equals( "oups !" );
				});

				deferred.reject(new Error("oups !"));
			});

			it('should work on a resolution with UNsuccessful conditions', function(signalAsyncTestFinished) {
				expect_sub_test_to_fail_with_a_specific_error(function(signalAsyncTestFinished) {
					var deferred = when.defer();
					var promise = deferred.promise;

					CUT.finish_test_expecting_promise_to_be_rejected_with_conditions(promise, signalAsyncTestFinished, function(reason) {
						expect( reason.message ).to.equals( "oups !" );
					});

					deferred.reject(new Error("oupsie !"));
				},
				Error, "expected 'oupsie !' to equal 'oups !'",
				signalAsyncTestFinished);
			});

			it('should correctly detect when a conditions function try to returns something', function(signalAsyncTestFinished) {
				expect_sub_test_to_fail_with_a_specific_error(function(signalAsyncTestFinished) {
					var deferred = when.defer();
					var promise = deferred.promise;

					CUT.finish_test_expecting_promise_to_be_rejected_with_conditions(promise, signalAsyncTestFinished, function(value) {
						return 1; // what it that ? No chaining is handled in this function !
					});

					deferred.reject(new Error("oups !"));
				},
				Error, 'finish_test_expecting_promise_to_be_rejected_with_conditions(...) optional test function returned something but no form of chaining is allowed at this stage. Please check !',
				signalAsyncTestFinished);
			});

		}); // describe feature




		////////////
		describe('expectation : finish_test_expecting_promise_to_be_rejected_with_error', function() {

			it('should work on a correct case', function(signalAsyncTestFinished) {
				var deferred = when.defer();
				var promise = deferred.promise;

				CUT.finish_test_expecting_promise_to_be_rejected_with_error(promise, signalAsyncTestFinished,
					Error, "oups !");

				deferred.reject(new Error("oups !"));
			});

			it('should correctly detect an unexpected message', function(signalAsyncTestFinished) {
				expect_sub_test_to_fail_with_a_specific_error(function(signalAsyncTestFinished) {
					var deferred = when.defer();
					var promise = deferred.promise;

					CUT.finish_test_expecting_promise_to_be_rejected_with_error(promise, signalAsyncTestFinished,
							Error, "oups !");

					deferred.reject(new Error("oupsie !"));
				},
				Error, "expected 'oupsie !' to equal 'oups !'",
				signalAsyncTestFinished);
			});

			it('should correctly detect an unexpected error type', function(signalAsyncTestFinished) {
				expect_sub_test_to_fail_with_a_specific_error(function(signalAsyncTestFinished) {
					var deferred = when.defer();
					var promise = deferred.promise;

					CUT.finish_test_expecting_promise_to_be_rejected_with_error(promise, signalAsyncTestFinished,
							RangeError, "oups !");

					deferred.reject(new Error("oups !"));
				},
				Error, "expected [Error: oups !] to be an instance of RangeError",
				signalAsyncTestFinished);
			});

		}); // describe feature




		////////////
		describe('expectation : finish_test_expecting_all_those_promises_to_be_fulfilled', function() {

			it('should work on a correct case', function(signalAsyncTestFinished) {
				var deferred1 = when.defer();
				var promise1  = deferred1.promise;
				var deferred2 = when.defer();
				var promise2  = deferred2.promise;
				var deferred3 = when.defer();
				var promise3  = deferred3.promise;

				CUT.finish_test_expecting_all_those_promises_to_be_fulfilled( [promise1, promise2, promise3], signalAsyncTestFinished);

				deferred1.resolve(10);
				deferred2.resolve(20);
				deferred3.resolve(30);
			});

			it('should work on a failure case', function(signalAsyncTestFinished) {
				expect_sub_test_to_fail_with_a_specific_error(function(signalAsyncTestFinished) {
					var deferred1 = when.defer();
					var promise1  = deferred1.promise;
					var deferred2 = when.defer();
					var promise2  = deferred2.promise;
					var deferred3 = when.defer();
					var promise3  = deferred3.promise;

					CUT.finish_test_expecting_all_those_promises_to_be_fulfilled( [promise1, promise2, promise3], signalAsyncTestFinished);

					deferred1.resolve(10);
					deferred2.reject(new Error("oups !"));
					deferred3.reject(new Error("oupsie !"));
				},
				Error, 'Promise was not fulfilled as expected. It was rejected with reason : "Error: oups !"',
				signalAsyncTestFinished);
			});

		}); // describe feature




		////////////
		describe('expectation : filter_promise_ensuring_fulfilled_with_conditions', function() {

			it('should work on a simple correct resolution', function(signalAsyncTestFinished) {
				var deferred = when.defer();
				var promise = deferred.promise;

				var final_promise = CUT.filter_promise_ensuring_fulfilled_with_conditions(promise, function(value) {
					expect(value).to.equals( 42 );
				});
				CUT.finish_test_expecting_promise_to_be_fulfilled(final_promise, signalAsyncTestFinished);

				deferred.resolve(42);
			});

			it('should work on a simple rejection', function(signalAsyncTestFinished) {
				expect_sub_test_to_fail_with_a_specific_error(function(signalAsyncTestFinished) {
					var deferred = when.defer();
					var promise = deferred.promise;

					var final_promise = CUT.filter_promise_ensuring_fulfilled_with_conditions(promise, function(value) {
						expect(value).to.equals( 42 );
					});
					CUT.finish_test_expecting_promise_to_be_fulfilled(final_promise, signalAsyncTestFinished);

					deferred.reject(new Error("oups !"));
				},
				Error, 'Promise was not fulfilled as expected. It was rejected with reason : "Error: oups !"',
				signalAsyncTestFinished);
			});

			it('should correctly detect an UNcorrect resolution', function(signalAsyncTestFinished) {
				expect_sub_test_to_fail_with_a_specific_error(function(signalAsyncTestFinished) {
					var deferred = when.defer();
					var promise = deferred.promise;

					var final_promise = CUT.filter_promise_ensuring_fulfilled_with_conditions(promise, function(value) {
						expect(value).to.equals( 42 );
					});
					CUT.finish_test_expecting_promise_to_be_fulfilled(final_promise, signalAsyncTestFinished);

					deferred.resolve(43);
				},
				Error, 'Promise was not fulfilled as expected. It was rejected with reason : "AssertionError: expected 43 to equal 42"',
				signalAsyncTestFinished);
			});

		}); // describe feature

	});
});
