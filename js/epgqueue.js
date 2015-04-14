/**
 * @fileoverview Provides the epg queue functionality. It is supposed to work
 * like this: when a new item is added to the queue first the list is checked if
 * there are items that should not be there anymore (start time is smalled than
 * current time), then the item is inserted in the correct order and the global
 * timeout is reset to the first item in the queue. If exit (unload) is detected
 * and there are items in the queue notification should be shown to the user.
 *
 * @author regardingscot@gmail.com (PeterStJ)
 */

goog.provide('mobiletv.EpgQueue');

goog.require('mobiletv.Channels');
goog.require('mobiletv.Player');
goog.require('mobiletv.ShowQueue');
goog.require('mobiletv.strings');
goog.require('pstj.ds.List.EventType');
goog.require('pstj.ds.ListItem');
goog.require('pstj.error');
goog.require('pstj.error.ErrorHandler');
goog.require('smstb.ds.Epg.Property');
goog.require('smstb.persistence.TypedList');



/**
 * Provides the queue and related functionality (like auto play).
 * @constructor
 */
mobiletv.EpgQueue = function() {
  this.storage = new smstb.persistence.TypedList(mobiletv.EpgQueue.NAME);
  this.list = new mobiletv.ShowQueue();
  this.nextPlayTimeout_ = 0;
  var list = this.storage.get();
  if (goog.isDef(list)) {
    if (goog.isArray(list)) {
      goog.array.forEach(list, function(item) {
        this.list.add(new pstj.ds.ListItem(item));
      }, this);
    }
  }
  this.boundPlaybackStart_ = goog.bind(this.playbackStart, this);
  this.cleanForOldEntries();
  this.setupPlaybackQueue();
  this.storage.set(this.list);
  goog.events.listen(this.list, pstj.ds.List.EventType.DELETE,
      this.handleListDelete, undefined, this);
  goog.events.listen(this.list, pstj.ds.List.EventType.ADD,
      this.handleAddItem, undefined, this);
};
goog.addSingletonGetter(mobiletv.EpgQueue);


/**
 * Reference to the name used to store the cache in storage.
 * @type {string}
 * @protected
 */
mobiletv.EpgQueue.NAME = 'epgqueue';

goog.scope(function() {

var _ = mobiletv.EpgQueue.prototype;


/**
 * Sttempts to play back the first item in the queue.
 * @protected
 */
_.playbackStart = function() {
  var item = this.list.getByIndex(0);
  if (!goog.isNull(item)) {
    mobiletv.Player.getInstance().setModel(
        mobiletv.Channels.getInstance().getData().getById(
        goog.asserts.assertNumber(item.getProp(
        smstb.ds.Epg.Property.CHANNEL_ID))));
  }
  this.list.deleteNode(item);
  pstj.error.throwError(pstj.error.ErrorHandler.Error.RUNTIME, 0,
      mobiletv.strings.get(mobiletv.strings.Symbol.SCHEDULED_SWITCH));
};


/**
 * Setup for the playback, based on the current queue.
 * @protected
 */
_.setupPlaybackQueue = function() {
  clearTimeout(this.nextPlayTimeout_);
  if (this.list.getCount() > 0) {
    this.nextPlayTimeout_ = setTimeout(this.boundPlaybackStart_,
        this.list.getByIndex(0).getId() - goog.now());
  }
};


/**
 * Handles the deletion of an item from the list. Note that deletion may occur
 * even when an item is removed by clean up. In case the list is loaded from
 * storage, the cleaning should be done before attaching listeners. When
 * playback is started/switched (by timeout), it should set flag to suppress
 * removing the item.
 * @protected
 * @param {goog.events.Event} e The DELETE event from the list.
 */
_.handleListDelete = function(e) {
  this.setupPlaybackQueue();
  this.storage.set(this.list);
};


/**
 * Handles the addition of an item. When initially loading from storage events
 * are not attached, thus it is not needed to filter them out.
 * @param {goog.events.Event} e The ADD event from the list.
 * @protected
 */
_.handleAddItem = function(e) {
  this.setupPlaybackQueue();
  this.storage.set(this.list);
};


/**
 * Serialize the object data as the object data is serialized by goog.json and
 * breaks.
 * @return {string}
 * @protected
 */
_.stringify = function() {
  return JSON.stringify(this.list);
};


/**
 * Adds an item to the list of shows to switch to when time comes.
 * @param {pstj.ds.ListItem} show The show to add.
 */
_.add = function(show) {
  // no op if start time has passed already
  if (show.getId() < goog.now()) {
    pstj.error.throwError(pstj.error.ErrorHandler.Error.RUNTIME, -1,
        mobiletv.strings.get(
        mobiletv.strings.Symbol.EPG_START_TIME_PASSED));
  } else if (!goog.isNull(this.list.getById(show.getId()))) {
    // no op if there is another item starting at the same time.
    pstj.error.throwError(pstj.error.ErrorHandler.Error.RUNTIME, -1,
        mobiletv.strings.get(
        mobiletv.strings.Symbol.EPG_TIME_DUPLICATE) +
        '(' + this.list.getById(show.getId()).getProp(
        smstb.ds.Epg.Property.TITLE) + ')');
  } else {
    this.cleanForOldEntries();
    // the add method is overridden to support error catching and insert in the
    // correct position based on id.
    this.list.add(show);
    pstj.error.throwError(pstj.error.ErrorHandler.Error.RUNTIME, 0,
        mobiletv.strings.get(
        mobiletv.strings.Symbol.EPG_ITEM_ADDED));
  }
};


/**
 * Cleans the queue from old entries.
 * TODO: make sure the node removal is correctly working out the indexes and
 * mappings.
 * @protected
 */
_.cleanForOldEntries = function() {
  var now = goog.now();
  var to_remove = 0;
  for (var i = 0, len = this.list.getCount(); i < len; i++) {
    if (now > this.list.getByIndex(i).getId()) {
      to_remove++;
    } else {
      break;
    }
  }
  if (to_remove > 0) {
    var i = 0;
    while (to_remove > 0) {
      this.list.deleteNode(this.list.getByIndex(i));
      i++;
      to_remove--;
    }
  }
};

});  // goog.scope

