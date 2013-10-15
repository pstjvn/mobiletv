/**
 * @fileoverview Overrides the enable method of the widget so we can signal
 * the change to the overlay control channel and act in accordance for the
 * video tag. See https://github.com/pstjvn/mobiletv/issues/11 for details.
 *
 * @author regardingscot@gmail.com (Peter StJ)
 */

goog.provide('mobiletv.SearchPanel');

goog.require('mobiletv.pubsub');
goog.require('smstb.widget.SearchPanel');



/**
 * @constructor
 * @extends {smstb.widget.SearchPanel}
 */
mobiletv.SearchPanel = function() {
  goog.base(this);
};
goog.inherits(mobiletv.SearchPanel, smstb.widget.SearchPanel);


/** @inheritDoc */
mobiletv.SearchPanel.prototype.enable = function(enable) {
  console.log('1');
  goog.base(this, 'enable', enable);
  mobiletv.pubsub.channel.publish(mobiletv.pubsub.topic.OVERLAY, enable);
};
