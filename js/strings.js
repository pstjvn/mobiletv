/**
 * @fileoverview The incentive behind this is to make the strings globally
 * accessible.
 *
 * @author regardingscot@gmail.com (PeterStJ)
 */

goog.provide('mobiletv.strings');

goog.require('mobiletv.template');
goog.require('pstj.ui.Strings');


/**
 * @enum {number}
 */
mobiletv.strings.Symbol = {
  PAYMENT_CANCELED: 0,
  SERVER_ERROR: 1,
  EPG_START_TIME_PASSED: 2,
  EPG_TIME_DUPLICATE: 3,
  EPG_ITEM_ADDED: 4,
  SCHEDULED_SWITCH: 5,
  FILTER_NO_MATCHES: 6,
  ANDROID_PLAYER: 7,
  BOOKMARK_ADDED: 8,
  BOOKMARK_REMOVED: 9
};


/**
 * @type {pstj.ui.Strings}
 * @private
 */
mobiletv.strings.strings_ = new pstj.ui.Strings(
    mobiletv.template.mobiletvstrings({}).getContent());


/**
 * Provides convenience method to abstract string getters.
 * @param {mobiletv.strings.Symbol} symbol The symbol index to lookup.
 * @return {string}
 */
mobiletv.strings.get = function(symbol) {
  return mobiletv.strings.strings_.get(symbol);
};
