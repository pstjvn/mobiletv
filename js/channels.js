goog.provide('mobiletv.Channels');
goog.provide('mobiletv.Channels.EventType');

goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('mobiletv.Bookmarks');
goog.require('mobiletv.loader');
goog.require('pstj.ds.List');
goog.require('pstj.error');
goog.require('pstj.error.ErrorHandler');



/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
mobiletv.Channels = function() {
  goog.base(this);
  /**
   * @type {pstj.ds.List}
   * @protected
   */
  this.data = null;
  this.loadData_();
};
goog.inherits(mobiletv.Channels, goog.events.EventTarget);
goog.addSingletonGetter(mobiletv.Channels);


/**
 * @enum {string}
 */
mobiletv.Channels.EventType = {
  LOAD: goog.events.getUniqueId('load')
};


goog.scope(function() {

var _ = mobiletv.Channels.prototype;


/**
 * Starts the data loading of the channel listing. It should also implement
 * directory loading in the future and notifies the listeners when everything is
 * loaded.
 * @private
 */
_.loadData_ = function() {
  mobiletv.loader.getList(goog.bind(this.handleDataLoad, this));
};


/**
 * Handles the initial data loading.
 * @param {?Error} err The error if one occured while loading.
 * @param {Object|Array} data The server response.
 * @protected
 */
_.handleDataLoad = function(err, data) {
  if (!goog.isNull(err)) {
    pstj.error.throwError(pstj.error.ErrorHandler.Error.SERVER, undefined,
        err.message);
  } else {
    if (goog.isArray(data)) {
      this.handleFavorites(data);
      this.data = new pstj.ds.List(data);
    } else {
      pstj.error.throwError(pstj.error.ErrorHandler.Error.NO_DATA, undefined,
          'No channel list received');
    }
  }
  this.dispatchEvent(mobiletv.Channels.EventType.LOAD);
};


/**
 * Handles the data loaded from server as s pure array and augment it with the
 * favorites from local storage.
 * The data is operated 'in place' so the function does not return anything.
 * @param {Array} list The list of IDs that are bookmarked.
 * @protected
 */
_.handleFavorites = function(list) {
  var cache = mobiletv.Bookmarks.getInstance().get();
  for (var i = 0, len = list.length; i < len; i++) {
    list[i]['isBookmarked'] = goog.array.contains(cache, list[i]['id']);
  }
};


/**
 * Getter for the data (channels).
 * @return {pstj.ds.List}
 */
_.getData = function() {
  return this.data;
};

});  // goog.scope
