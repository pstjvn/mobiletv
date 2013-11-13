goog.provide('mobiletv.Epg');

goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('goog.async.Delay');
goog.require('goog.async.nextTick');
goog.require('mobiletv.loader');
goog.require('pstj.ds.Cache');
goog.require('pstj.ds.List');
goog.require('smstb.ds.Epg.Property');



/**
 * Provides unified access to the EPG data. This class re-implements the
 * EpgStruct class with the same client structure but loading the data in
 * more optimized manner.
 * @constructor
 */
mobiletv.Epg = function() {
  this.ready_ = false;
  /**
   * The last time the struct was updated. Used to calculate the expiration
   * of the data for long running processes.
   * @type {number}
   * @private
   */
  this.lastUpdateTimestamp_ = -1;
  /**
   * The current time, used in processing of the expiration of the current
   * shows.
   * @type {Date}
   * @protected
   */
  this.updateTime = new Date();
  /**
   * Storage for the actual cache of epg data.
   * @type {pstj.ds.Cache}
   * @private
   */
  this.cache_ = new pstj.ds.Cache();
  /**
   * The delay used in shifting the current epg time.
   * @type {goog.async.Delay}
   * @private
   */
  this.epgUpdateDelay_ = new goog.async.Delay(this.epgUpdate, 60000, this);
  /**
   * Provides the deferred to be used to monitor the load progress.
   * @type {goog.async.Deferred}
   * @private
   */
  this.loadPromise_ = new goog.async.Deferred();
};
goog.addSingletonGetter(mobiletv.Epg);


goog.scope(function() {

var _ = mobiletv.Epg.prototype;


/**
 * Getter for the ready status. Because the data is loaded at once in this
 * implementation this is probably not that useful.
 * @return {boolean}
 */
_.isReady = function() {
  return this.ready_;
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
  if (this.isDataExpired()) {
    this.ready_ = false;
    this.setupTasks();
    this.load();
  } else {
    this.cache_.every(this.setCurrentShow, this);
    this.epgUpdateDelay_.start();
  }
};


/**
 * Checks if the data we have stored is older than 12 hours.
 * @return {boolean} True if the data is expired.
 */
_.isDataExpired = function() {
  return (goog.now() > (this.lastUpdateTimestamp_ + (1000 * 60 * 60 * 12)));
};


/**
 * Starts loading the data from the server (if needed).
 * @return {goog.async.Deferred} The deferred object for the load process.
 */
_.load = function() {
  if (this.isDataExpired()) {
    mobiletv.loader.getEpgBulk(goog.bind(this.handleLoad, this));
  } else {
    goog.async.nextTick(function() {
      this.loadPromise_.callback();
    }, this);
  }
  return this.loadPromise_;
};


/**
 * Tries to set the current item in the list based on the time.
 * @protected
 * @param {*} list The EPG list data structure to alter.
 * @param {string} id The ID of the channel as a string, not used.
 * @param {Object.<string,*>} cache The cache object, not used.
 * @return {boolean}
 */
_.setCurrentShow = function(list, id, cache) {
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
 * externalized in order to put the structure in the library and only link the
 * loader code on runtime.
 * @param {?Error} err The error is one occured or null.
 * @param {Object.<string, Array.<Object>>} epg The list of epg records as
 * received from the server (and wrapped in the loader logic).
 * @protected
 */
_.handleLoad = function(err, epg) {
  this.ready_ = true;
  if (goog.isNull(err)) {
    this.lastUpdateTimestamp_ = goog.now();
    for (var key in epg) {
      this.cache_.set(key, (new pstj.ds.List(epg[key])));
    }
    this.setupTasks();
  }
  this.loadPromise_.callback();
  // currently we ignore the error as there is nothing we can do that makes
  // sense.
};


/**
 * Getter for epg record list. This is used to match the interface of the
 * originally used Cache class.
 * @param {string} id The ID of the channel as a string.
 * @return {?pstj.ds.List}
 */
_.get = function(id) {
  if (!this.isReady()) {
    return null;
  }
  var result = this.cache_.get(id);
  if (!goog.isNull(result)) {
    return goog.asserts.assertInstanceof(result, pstj.ds.List,
        'Should always be list instance');
  } else {
    return null;
  }
};

});  // goog.scope
