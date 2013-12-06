goog.provide('mobiletv.ScrollView');

goog.require('pstj.ui.ScrollView');
goog.require('smstb.widget.NSRecordItem');
goog.require('smstb.widget.RecordRenderer');



/**
 * Extends and tweaks the scroll view to fit our app.
 * @constructor
 * @extends {pstj.ui.ScrollView}
 * @param {goog.ui.ControlRenderer=} opt_renderer Renderer used to render or
 * decorate the component; defaults to {@link goog.ui.ControlRenderer}.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper, used for
 * document interaction.
 */
mobiletv.ScrollView = function(opt_renderer, opt_domHelper) {
  goog.base(this, opt_renderer, opt_domHelper);
  this.setCellHeight(117);
};
goog.inherits(mobiletv.ScrollView, pstj.ui.ScrollView);


goog.scope(function() {
var _ = mobiletv.ScrollView.prototype;


/** @inheritDoc */
_.createRowCell = function() {
  return new smstb.widget.NSRecordItem(
      smstb.widget.RecordRenderer.getInstance(), this.getDomHelper());
};


/** @inheritDoc */
_.onDrawReady = function() {
  this.forEachChild(function(child) {
    child.showImages();
  });
};

});  // goog.scope
