/* Fast timestamps to compute elapsed time.
 * We're ok to compromise date for speed.
 * We expect resolution of at least millis.
 *
 * http://jsperf.com/fastest-way-to-get-the-current-date-timestamp
 * http://jsperf.com/new-date-timing
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTime
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(function() {
	"use strict";

	var FastTimestamp = {
		get_timestamp   : function() {
			return Date.now();
			//return window.performance.now();
			//require(performance-now
		},

		diff_timestamps_in_millis : function(ts1, ts2) {
			// current timestamps are in millis
			return (ts2 - ts1);
		}
	};

	////////////////////////////////////
	return FastTimestamp;
}); // requirejs module
