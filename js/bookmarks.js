goog.provide('mobiletv.Bookmarks');

goog.require('goog.async.nextTick');
goog.require('smstb.persistence.TypedList');



/**
 * Provides abstaction for the bookmarks storage.
 * Use the instance getter.
 * @constructor
 */
mobiletv.Bookmarks = function() {
  /**
   * @type {?Array.<number>}
   * @private
   */
  this.cache_ = null;
  /**
   * @type {smstb.persistence.TypedList}
   * @private
   */
  this.storage_ = new smstb.persistence.TypedList(mobiletv.Bookmarks.KEY);
};
goog.addSingletonGetter(mobiletv.Bookmarks);


/**
 * The key used in storage.
 * @final
 * @type {string}
 * @protected
 */
mobiletv.Bookmarks.KEY = 'bookmarks';


goog.scope(function() {
var _ = mobiletv.Bookmarks.prototype;


/**
 * Gets the list of ids that are bookmarked.
 * @return {Array.<number>}
 */
_.get = function() {
  if (goog.isNull(this.cache_)) {
    this.cache_ = this.storage_.get();
  }
  return this.cache_;
};


/**
 * Sets the list of IDs of bookmarked objects. This will actually postpone the
 * local storage write action to avoid delays (i.e. wait until the call stack
 * is empty).
 */
_.set = function() {
  goog.async.nextTick(this.save, this);
};


/**
 * Saves the data in the local storage.
 */
_.save = function() {
  this.storage_.set(this.cache_);
};


/**
 * Adds a new ID to the list of bookmarked items.
 * @param {pstj.ds.RecordID} id The id to add.
 */
_.add = function(id) {
  var cache = this.get();
  if (!goog.array.contains(cache, id)) {
    goog.array.insert(cache, id);
    this.set();
  }
};


/**
 * Remove a bookmark from the list of bookmarked IDs.
 * @param {pstj.ds.RecordID} id The to remove.
 */
_.remove = function(id) {
  if (goog.array.remove(this.get(), id)) {
    this.set();
  }
};

});  // goog.scope
