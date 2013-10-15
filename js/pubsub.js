/**
 * @fileoverview Provides channel to communicate overlay changes. This is
 * erquired as a workaround for the iOS video tag swallowing event issue.
 * See https://github.com/pstjvn/mobiletv/issues/11 for description.
 *
 * @author regardingscot@gmail.com (Peter StJ)
 */

goog.provide('mobiletv.pubsub');

goog.require('goog.pubsub.PubSub');


goog.scope(function() {

var _ = mobiletv.pubsub;


/**
 * @enum {string}
 */
_.topic = {
  OVERLAY: 'overlay'
};


/**
 * The pub sub channel for the app.
 * @type {goog.pubsub.PubSub}
 */
_.channel = new goog.pubsub.PubSub();

});  // goog.scope
