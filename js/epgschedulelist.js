/**
 * @fileoverview Provides the default implementation for epg view. In it a
 * regular template compilation is used to display the whole list. The
 * implementation is not compatible with NSview but is used when native scroll
 * is required.
 *
 * @author regardingscot@gmail.com (Peter StJ)
 */

goog.provide('mobiletv.EpgScheduleItem');
goog.provide('mobiletv.EpgScheduleItemTemplate');
goog.provide('mobiletv.EpgScheduleList');

goog.require('goog.asserts');
goog.require('goog.ui.Control');
goog.require('mobiletv.EpgItem');
goog.require('mobiletv.EpgItem.EventType');
goog.require('pstj.ds.List');
goog.require('pstj.ds.List.EventType');
goog.require('pstj.ui.Button');
goog.require('pstj.widget.MultiViewWrapper');



/**
 * Provides the component used as EPG schedule listing.
 * @constructor
 * @extends {pstj.widget.MultiViewWrapper}
 */
mobiletv.EpgScheduleList = function() {
  goog.base(this);
  this.emptyNode_ = new goog.ui.Control('No scheduled items');
};
goog.inherits(mobiletv.EpgScheduleList, pstj.widget.MultiViewWrapper);


goog.scope(function() {

var _ = mobiletv.EpgScheduleList.prototype;


/** @inheritDoc */
_.setModel = function(model) {
  // Remove old listeners
  if (!goog.isNull(this.getModel())) {
    this.getHandler().unlisten(goog.asserts.assertInstanceof(this.getModel(),
        pstj.ds.List, 'Model should be ds.List'), pstj.ds.List.EventType.ADD,
        this.handleModelChange);
  }
  // Assign new model
  goog.base(this, 'setModel', model);
  this.createChildren();
  if (!goog.isNull(this.getModel())) {
    this.getHandler().listen(goog.asserts.assertInstanceof(this.getModel(),
        pstj.ds.List, 'Model should be ds.List'), [pstj.ds.List.EventType.ADD,
          pstj.ds.List.EventType.DELETE], this.handleModelChange);
  }
};


/**
 * Handles the creation of the children for the view. It iterates over the
 * model items and create a child for each item.
 * @protected
 */
_.createChildren = function() {
  this.removeChildren(true);
  if (!goog.isNull(this.getModel()) && this.getModel().getCount() > 0) {
    for (var i = 0, len = this.getModel().getCount(); i < len; i++) {
      var child = new mobiletv.EpgItem();
      child.setModel(this.getModel().getByIndex(i));
      child.setScheduledState(true);
      this.addChild(child, true);
    }
  } else {
    this.addChild(this.emptyNode_, true);
  }
};


/**
 * Handles the ADD change in the currrent model.
 * @param {goog.events.Event} e The ADD datastructire list event.
 * @protected
 */
_.handleModelChange = function(e) {
  this.createChildren();
};


/** @inheritDoc */
_.enterDocument = function() {
  goog.base(this, 'enterDocument');
  this.getHandler().listen(this, mobiletv.EpgItem.EventType.REMOVE,
      this.handleRemove);
};


/**
 * Handles the ACTION ui event coming from one of the children (and their
 * children).
 * @param {goog.events.Event} e The ACTION UI event.
 * @protected
 */
_.handleRemove = function(e) {
  if (e.target == this) return;
  var target = e.target;
  if (goog.DEBUG) {
    if (goog.isNull(target)) throw new Error('This should not happen');
  }
  this.getModel().deleteNode(target.getModel());
};

});  // goog.scope
