/**
 * @fileoverview Provides the customized top panel specific for this
 * application. It allows the control of the back button to be set from the
 * controllers.
 *
 * @author regardingscot@gmail.com (Peter StJ)
 */

goog.provide('mobiletv.TopPanel');

goog.require('smstb.widget.ButtonPanel');



/**
 * Custmoized TOP panel for mobiletv app.
 *
 * @constructor
 * @extends {smstb.widget.ButtonPanel}
 * @param {number=} opt_delay Optionally the delay to use to call the
 * postHandler method.
 * @param {number=} opt_back_button_index The index of the child that represents
 * the back button.
 */
mobiletv.TopPanel = function(opt_delay, opt_back_button_index) {
  goog.base(this, opt_delay);
  /**
   * Reference to the index of the back button to use.
   * @type {number}
   * @private
   */
  this.backButtonIndex_ = opt_back_button_index || 0;
  /**
   * Reference to the back button element.
   * @type {?Element}
   * @private
   */
  this.backButton_ = null;
};
goog.inherits(mobiletv.TopPanel, smstb.widget.ButtonPanel);

goog.scope(function() {

var _ = mobiletv.TopPanel.prototype;


_.enterDocument = function() {
  goog.base(this, 'enterDocument');
  this.backButton_ = goog.asserts.assertInstanceof(
      this.getElement().querySelectorAll('[data-action]').item(
          this.backButtonIndex_), Element, 'Casts Node to Element');
}

/**
 * Controls the back button in the panel.
 * @param {boolean} visible If true the back button should be visible.
 */
_.setBackButtonVisibility = function(visible) {
  if (!goog.isNull(this.backButton_)) {
    this.backButton_.style.display = (visible) ? 'inline-block' : 'none';
  }
};

});  // goog.scope
