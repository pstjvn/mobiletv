goog.provide('mobiletv.loader');

goog.require('pstj.configure');
goog.require('pstj.resource');

/**
 * @fileoverview Provides the resource loader speciafically designed for this
 * app.
 * @author <regardingscot@gmail.com> (PeterStJ)
 */

goog.scope(function() {
var _ = mobiletv.loader;
var resource = pstj.resource;


/**
 * The resource loader we will use.
 * @type {pstj.resource.Resource}
 * @private
 */
_.ResourceProvider_ = (function() {
  resource.configure({
    run: 'run',
    execPath: goog.asserts.assertString(pstj.configure.getRuntimeValue(
        'DATA_URL', '/cgi-bin/if.cgi', 'SYSMASTER.APPS.MOBILETV')),
    crossdomain: true
  });
  return resource.getInstance();
})();


/**
 * The run parameter for getting the list.
 * @param {function(Error, Object): undefined} callback Handler for the
 *   listing.
 */
_.getList = function(callback) {
  _.ResourceProvider_.get({
    'run': goog.asserts.assertString(pstj.configure.getRuntimeValue(
        'RUN_NAME', 'mblcont', 'SYSMASTER.APPS.MOBILETV'))
  }, callback);
};


/**
 * Loads the fake data we want to test with.
 * We will not use this in the application because we have user log in anyway.
 * @param {Object} data The data object as if returned by real request.
 */
_.loadFakeData = function(data) {
  _.ResourceProvider_.loadStubs(data);
};


/**
 * Loads EPG from the server. As this loader is application specific it is
 * okay to put here any pre-processing needed before the data is rendered into
 * the final usable data structure.
 *
 * @param {string} playUrl The URL of the record, used to generate the URL of
 * the EPG records.
 * @param {function(Error, ?): undefined} callback Handler got the data
 * received.
 */
_.getEpg = function(playUrl, callback) {
  var url = playUrl + _.generateEpgType();
  var handler = goog.partial(_.epgHandler_, callback);
  (new goog.net.Jsonp(url)).send(null, handler, handler);
};


/**
 * Extracted method to generate the URL for getting the EPG as it might change
 * in the server implementation.
 *
 * @protected
 * @return {string}
 */
_.generateEpgType = function() {
  return '&t=52';
};


/**
 * Handler for the epg loading.
 *
 * @param {function(Error, ?): undefined} callback The original callback of
 * the request.
 * @param {?} data The data arriving from the server (assuming valid
 * processable data response) or null if timeout occured.
 * @private
 */
_.epgHandler_ = function(callback, data) {
  if (goog.isNull(data)) {
    // timeout occured
    callback(new Error('Server timeout on EPG'), null);
  } else {
    if (goog.isArray(data)) {
      // we expect array and this is the only reply we can process here.
      callback(_.processEpg_(data), data);
    } else {
      callback(new Error('Invalid server response'), null);
    }
  }
};


/**
 * Processes the EPG data from the server, assuming it is an array or viable
 * records for the TV program. Note that any operations on the data should be
 * altering it 'in place' as it is used subsequently as the raw data for data
 * structures.
 *
 * @param {Array.<Object>} data The EPG data.
 * @return {?Error} If error was found in the data it is returned, otherwise
 * null is returned.
 * @private
 */
_.processEpg_ = function(data) {
  if (data.length == 0) {
    return new Error('No records found for this channel');
  }
  // Convert times to Date objects and if needed adjust to time zone.
  goog.array.forEach(data, _.adjustForTimeZone_);
  // set separators in the raw data objects so we know when a new date
  // starts in the list.
  var now = goog.now();
  var startIndex = -1;
  for (var i = 0, len = data.length; i < len; i++) {
    if (data[i]['id'] > now) {
      startIndex = i - 1;
      break;
    }
  }

  if (i >= len) {
    data.length = 0;
  } else {
    if (startIndex > 0) {
      data.splice(0, startIndex);
    }
  }
  _.findDateSeparators_(data);
  return null;
};


/**
 * Iterates over th records and attempts to find the markers for new dates
 * (i.e. when the date changes) and sets the properties to the objects.
 *
 * @param {Array.<Object>} data The list of EPG records.
 * @private
 */
_.findDateSeparators_ = function(data) {
  var date;
  for (var i = 0, len = data.length; i < len; i++) {
    // the first should always have the separators flags et to true because we
    // want to know which data it is in the heading.
    if (i == 0) {
      data[i]['separator'] = true;
      date = data[i]['startTime'].getDate();
    } else {
      if (data[i]['startTime'].getDate() != date) {
        data[i]['separator'] = true;
        date = data[i]['startTime'].getDate();
      } else {
        data[i]['separator'] = false;
      }
    }
  }
};


/**
 * The time zone offset on the client machine.
 * @type {number}
 * @private
 */
_.timeZoneOffset_ = (new Date()).getTimezoneOffset() * 60 * 1000 * -1;


/**
 * Adjusts records to match the time zone of the client as the timeing of the
 * epg is received in GMT 0.
 *
 * @param {Object} item The EPG record.
 * @param {number} index The index of the record.
 * @param {Array.<Object>} arr The data record list.
 * @private
 */
_.adjustForTimeZone_ = function(item, index, arr) {
  if (_.timeZoneOffset_ != 0) {
    item['startTime'] = new Date((new Date(item['startTime'])).valueOf() +
        _.timeZoneOffset_);
    item['endTime'] = new Date((new Date(item['endTime'])).valueOf() +
        _.timeZoneOffset_);
  } else {
    item['startTime'] = new Date(item['startTime']);
    item['endTime'] = new Date(item['endTime']);
  }
  item['id'] = item['startTime'].valueOf();
};

});  // goog.scope

