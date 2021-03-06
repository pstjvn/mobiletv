goog.provide('mobiletv.EpgLive');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom.classlist');
goog.require('goog.events.EventType');
goog.require('goog.ui.Component');
goog.require('pstj.ds.List.EventType');
goog.require('pstj.ui.ngAgent');



/**
 * Provides the 'live epg' widget for the channel list item. It displays the
 * information about the current show and the next one.
 * @constructor
 * @extends {goog.ui.Component}
 */
mobiletv.EpgLive = function() {
  goog.base(this);
};
goog.inherits(mobiletv.EpgLive, goog.ui.Component);


goog.scope(function() {
var _ = mobiletv.EpgLive.prototype;


/** @inheritDoc */
_.setModel = function(model) {
  goog.base(this, 'setModel', model);
  if (!goog.isNull(this.getModel())) {
    this.getHandler().listen(goog.asserts.assertInstanceof(
        this.getModel(), pstj.ds.List, 'Should be list if it is not null'),
        pstj.ds.List.EventType.SELECTED,
        this.handleEpgCurrentUpdate);
  }
};


/**
 * @override
 * @return {?pstj.ds.List} The model as List or null.
 */
_.getModel = function() {
  var model = goog.base(this, 'getModel');
  if (goog.isNull(model)) return model;
  return (goog.asserts.assertInstanceof(model, pstj.ds.List));
};


/** @inheritDoc */
_.decorateInternal = function(el) {
  goog.base(this, 'decorateInternal', el);
  var model = this.getModel();
  var els = this.getElementsByClass(goog.getCssName('epg-widget-item'));
  for (var i = 0, len = els.length; i < len; i++) {
    this.addChild(new goog.ui.Component());
  }
  goog.array.forEach(els, function(el, idx) {
    this.getChildAt(idx).decorate(el);
    if (!goog.isNull(model)) {
      this.getChildAt(idx).setModel(model.getByIndex(
          model.getCurrentIndex() + idx));
    } else {
      this.getChildAt(idx).setModel(null);
    }
    pstj.ui.ngAgent.getInstance().apply(this.getChildAt(idx));

  }, this);
};


/** @inheritDoc */
_.enterDocument = function() {
  goog.base(this, 'enterDocument');
  this.getHandler().listen(this.getElement(),
      goog.events.EventType.TRANSITIONEND, this.handleTransitionEnd);
};


/**
 * Handles the SELECTED event from the epg pstj.ds.List instance.
 * @param {goog.events.Event} e The SELECTED event as generated by the list.
 * @protected
 */
_.handleEpgCurrentUpdate = function(e) {
  goog.dom.classlist.add(this.getElement(), goog.getCssName('translate'));
};


/**
 * Handles the end of the transition started by the handler of the selection
 * event.
 * @param {goog.events.Event} e The wrapped browser event.
 * @protected
 */
_.handleTransitionEnd = function(e) {
  var child = this.getChildAt(0);
  this.removeChild(child);
  goog.dom.classlist.remove(this.getElement(), goog.getCssName('translate'));
  this.addChild(child);
  child.setModel(this.getModel().getByIndex(
      this.getModel().getCurrentIndex() + this.indexOfChild(child)));
  pstj.ui.ngAgent.getInstance().apply(child);
};

});  // goog.scope
