goog.provide('mobiletv.Notification');

goog.require('goog.async.Delay');
goog.require('smstb.widget.Notification');



/**
 * Provides customized version of the notification widget to support custom
 * delay for hiding the notices.
 * @constructor
 * @extends {smstb.widget.Notification}
 */
mobiletv.Notification = function() {
  goog.base(this);
  /**
   * Optional custom timeout to use for the hiding.
   * @type {number}
   * @private
   */
  this.customTimeout_ = 0;
  /**
   * Provides reference to any used custom delay.
   * @type {goog.async.Delay}
   * @private
   */
  this.customDelay_ = null;
};
goog.inherits(mobiletv.Notification, smstb.widget.Notification);


goog.scope(function() {
var _ = mobiletv.Notification.prototype;


/**
 * @override
 * @param {*} model The model to set.
 * @param {number=} opt_timeout Optional delay to use when hiding the new model.
 */
_.setModel = function(model, opt_timeout) {
  if (goog.isNumber(opt_timeout)) {
    this.customTimeout_ = opt_timeout;
  } else {
    this.customTimeout_ = 0;
  }
  goog.base(this, 'setModel', model);
};


/** @inheritDoc */
_.handleClick = function(e) {
  if (this.customTimeout_ == 0) {
    goog.base(this, 'handleClick', e);
  }
};


/** @inheritDoc */
_.enableHideDelay = function(enable) {
  if (!goog.isNull(this.customDelay_) && this.customDelay_.isActive()) {
    this.customDelay_.stop();
    goog.dispose(this.customDelay_);
    this.customDelay_ = null;
  }
  if (enable) {
    if (this.customTimeout_ != 0) {
      this.customDelay_ = new goog.async.Delay(function() {
        this.enable(false);
      }, this.customTimeout_, this);
      this.customDelay_.start();
    } else {
      goog.base(this, 'enableHideDelay', enable);
    }
  } else {
    goog.base(this, 'enableHideDelay', enable);
  }
};

});  // goog.scope
