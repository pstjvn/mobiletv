/**
 * @fileoverview Provides abstraction for the EPG storage. The class is designed
 * to be single instance and handles the loading and serving of the epg records.
 * The goal is to have centrilized storage for the epg records for all
 * channels server for the cirrent user. This will allowto rnu tasks on the
 * data. One forseeable taks is to move the 'current' pointer in the list in
 * order to always be in sync with the local time and thus sghow relevant and
 * corrent information for the currently running show.
 *
 * @author regardingscot@gmail.com (Peter StJ)
 */

goog.provide('mobiletv.EpgStruct');

goog.require('goog.array');
goog.require('goog.async.Delay');
goog.require('pstj.ds.Cache');
goog.require('pstj.ds.List');



/**
 * Provides meaningful abstraction for loading and handling the epg data
 * for all the channels in the application.
 * @constructor
 */
mobiletv.EpgStruct = function() {
  /**
   * List of channel IDS that are loadaed OR loading currently.
   * This is not nessesarily needed and the object cache can be populated with
   * null values by default.
   * TODO: migrate this to the object cache with null defaults.
   * @type {Array.<pstj.ds.RecordID>}
   * @private
   */
  this.ids_ = [];
  /**
   * The list of URLs to load for EPG.
   * @type {Array.<string>}
   * @private
   */
  this.urls_ = [];
  /**
   * Pointer to the currently pending retrieval (from the list).
   * @type {number}
   * @private
   */
  this.pointer_ = -1;
  /**
   * Flag if we are currently wating for a new result from server query.
   * @type {boolean}
   * @private
   */
  this.running_ = false;
  /**
   * Flag if the queue was finished. Note that the queue can be started many
   * times.
   * @type {boolean}
   * @private
   */
  this.ready_ = false;
  /**
   * The last time the struct was updated. Used to calculate the expiration
   * of the data for long running processes.
   * @type {number}
   * @private
   */
  this.lastUpdateTimestamp_ = goog.now();
  /**
   * The current time, used in processing.
   * @type {Date}
   * @protected
   */
  this.updateTime = new Date();
  /**
   * @type {pstj.ds.Cache}
   * @private
   */
  this.cache_ = new pstj.ds.Cache();
  /**
   * @private
   * @type {function(this: mobiletv.EpgStruct, ?Error, ?Array.<Object>)}
   */
  this.handlerCache_ = goog.bind(this.handleLoad, this);
  /**
   * The delay used in shifting the current epg time.
   * @type {goog.async.Delay}
   * @private
   */
  this.epgUpdateDelay_ = new goog.async.Delay(this.epgUpdate, 60000, this);
};
goog.addSingletonGetter(mobiletv.EpgStruct);


goog.scope(function() {

var _ = mobiletv.EpgStruct.prototype;


/**
 * Checks if the data is ready. It is based on the assumption that the
 * loading of the channels is linked to the loading of the EPG, so if
 * the channels are loaded partially (i.e. paged loading or lazy folder
 * loading) the data can be ready many times and will become 'not'-ready
 * once a new batch is being loaded.
 * @return {boolean}
 */
_.isReady = function() {
  return this.ready_;
};


/**
 * Adds a new record as potential epg source.
 * @param {pstj.ds.ListItem} record The record item.
 */
_.add = function(record) {
  if (!goog.array.contains(this.ids_, record.getId())) {
    this.enqueue(record);
    this.start_();
  }
};


/**
 * Enqueues a new load source.
 * @param {pstj.ds.ListItem} record The channel item.
 * @protected
 */
_.enqueue = function(record) {
  this.ids_.push(record.getId());
  this.urls_.push(record.getProp(smstb.ds.Record.Property.PLAYURL));
};


/**
 * Starts a new load. If epg is already loading for an item ignores the request.
 * All loads are queued so all ids will be loaded sooner or later. Currently it
 * is not possible to prioritize a particular record. In the future this will
 * be possible.
 * @private
 */
_.start_ = function() {
  if (!this.running_) {
    this.pointer_++;
    if (this.pointer_ < this.ids_.length) {
      this.running_ = true;
      mobiletv.loader.getEpg(this.urls_[this.pointer_], this.handlerCache_);
    } else {
      this.ready_ = true;
      this.lastUpdateTimestamp_ = goog.now();
    }
  }
  this.setupTasks();
};


/**
 * Wrapper for the task performing methods. We use to be able to extend the
 * functionality and to use more than one task.
 * @protected
 */
_.setupTasks = function() {
  if (this.isReady()) {
    this.epgUpdateDelay_.start();
  } else {
    this.epgUpdateDelay_.stop();
  }
};


/**
 * Wraps the call for update to iterate over each entry.
 * @protected
 */
_.epgUpdate = function() {
  if (goog.now() > (this.lastUpdateTimestamp_ + (1000 * 60 * 60 * 12))) {
    this.pointer_ = -1;
    this.ready_ = false;
    this.start_();
  } else {
    this.cache_.every(this.shiftCurrentShow, this);
  }
};


/**
 * Tries to set the current item in the list based on the time.
 * @protected
 * @param {*} list The EPG list data structure to alter.
 * @param {string} id The ID of the channel as a string, not used.
 * @param {Object.<string,*>} cache The cache object, not used.
 * @return {boolean}
 */
_.shiftCurrentShow = function(list, id, cache) {
  goog.asserts.assertInstanceof(list, pstj.ds.List, 'Compiler hack');
  if (list.getCurrent().getProp(
      smstb.ds.Epg.Property.END_TIME) <= this.updateTime) {
    while (true) {
      var next = list.getNext();
      if (goog.isNull(next)) {
        return false;
      }
      list.setCurrent(next);
      if (next.getProp(smstb.ds.Epg.Property.END_TIME) > this.updateTime) {
        break;
      }
    }
    return true;
  } else {
    return false;
  }
};


/**
 * Handles the load ready from the app loader. Note that this should have been
 * externalized in order to put the structure in the library and only
 * link the loadewr code on runtime.
 * @param {?Error} err The error is one occured or null.
 * @param {Array.<Object>} epg The list of epg records as received from
 * the server (and wrapped in the loader logic).
 * @protected
 */
_.handleLoad = function(err, epg) {
  this.running_ = false;
  if (err) {
    // we actually do NOT want to process this error becasue we are
    // serially loading lots of data, so we go and ignore the
    // error.
    // pstj.error.throwError(pstj.error.ErrorHandler.Error.SERVER, undefined,
    //     err.message);
  } else {
    var list = new pstj.ds.List(epg);
    this.cache_.set(this.ids_[this.pointer_].toString(), list);
  }
  this.start_();
};


/**
 * Getter for epg record list. This is used to match the interface of the
 * originally used Cache class.
 * @param {string} id The ID of the channel as a string.
 * @return {?pstj.ds.List}
 */
_.get = function(id) {
  var result = this.cache_.get(id);
  if (!goog.isNull(result)) {
    return goog.asserts.assertInstanceof(result, pstj.ds.List,
        'Should always be list instance');
  } else {
    return null;
  }
};

});  // goog.scope
