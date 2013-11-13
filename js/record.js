goog.provide('mobiletv.Record');

goog.require('mobiletv.Epg');
goog.require('mobiletv.EpgLive');
goog.require('smstb.ds.Record');
goog.require('smstb.widget.ListItem');



/**
 * Augments the standard list item with live epg info.
 * @constructor
 * @extends {smstb.widget.ListItem}
 * @param {goog.ui.ControlRenderer=} opt_renderer The renderer instance to use.
 */
mobiletv.Record = function(opt_renderer) {
  goog.base(this, opt_renderer);
  this.liveWidget = new mobiletv.EpgLive();
};
goog.inherits(mobiletv.Record, smstb.widget.ListItem);


goog.scope(function() {

var _ = mobiletv.Record.prototype;


/** @inheritDoc */
_.enterDocument = function() {
  goog.base(this, 'enterDocument');
  if (this.getModel().getProp(smstb.ds.Record.Property.TYPE) == 'iptv') {
    this.liveWidget.setModel(mobiletv.Epg.getInstance().get(
        this.getModel().getId().toString()));
    this.liveWidget.decorate(this.getElementByClass(
        goog.getCssName('playable-list-item-epg-widget')));
  }
};

});  // goog.scope
