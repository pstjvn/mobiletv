goog.provide('mobiletv.ErrorHandler');

goog.require('mobiletv.Notification');
goog.require('pstj.error.ErrorHandler');



/**
 * The default error handler for the mobiletv app. Use the singletton getter!
 * @constructor
 * @extends {pstj.error.ErrorHandler}
 */
mobiletv.ErrorHandler = function() {
  goog.base(this);
  this.notification = new mobiletv.Notification();
};
goog.inherits(mobiletv.ErrorHandler, pstj.error.ErrorHandler);
goog.addSingletonGetter(mobiletv.ErrorHandler);

goog.scope(function() {

var _ = mobiletv.ErrorHandler.prototype;


/**
 * Sets the element to decorate and thus allow to visualize the errors.
 * @param {Element} el The DOM node to decorate.
 */
_.setElement = function(el) {
  this.notification.decorate(el);
};


/** @inheritDoc */
_.handleError = function(error_index, opt_status_id, opt_message) {
  var msg = '';
  if (goog.DEBUG) {
    if (goog.isNumber(opt_status_id)) {
      msg += opt_status_id;
      msg += ': ';
    }
  }
  if (goog.isString(opt_message)) {
    msg += opt_message;
  }
  if (msg != '') {
    this.notification.setModel(msg,
        (opt_status_id != -1) ? opt_status_id : undefined);
  }
};

});  // goog.scope
