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
goog.require('goog.ui.Component.EventType');
goog.require('pstj.ds.List');
goog.require('pstj.ui.Button');
goog.require('pstj.ui.Template');
goog.require('pstj.ui.Templated');
goog.require('smstb.widget.MultiViewWrapper');



/**
 * Provides the template for the list item in the epg schedule view.
 *
 * @constructor
 * @extends {pstj.ui.Template}
 */
mobiletv.EpgScheduleItemTemplate = function() {
  goog.base(this);
};
goog.inherits(mobiletv.EpgScheduleItemTemplate, pstj.ui.Template);


/** @inheritDoc */
mobiletv.EpgScheduleItemTemplate.prototype.getTemplate = function(model) {
  return mobiletv.template.EpgScheduleItem(model);
};


/** @inheritDoc */
mobiletv.EpgScheduleItemTemplate.prototype.generateTemplateData = function(comp) {
  return comp.getModel().getRawData();
};



/**
 * Provides the component used as list item view in the epg schedule listing.
 *
 * @constructor
 * @extends {pstj.ui.Templated}
 */
mobiletv.EpgScheduleItem = function() {
  goog.base(this, mobiletv.EpgScheduleItemTemplate.getInstance());
  this.deleteButton_ = new pstj.ui.Button();
  this.addChild(this.deleteButton_);
};
goog.inherits(mobiletv.EpgScheduleItem, pstj.ui.Templated);



/**
 * Provides the component used as EPG schedule listing.
 * @constructor
 * @extends {smstb.widget.MultiViewWrapper}
 */
mobiletv.EpgScheduleList = function() {
  goog.base(this);
};
goog.inherits(mobiletv.EpgScheduleList, smstb.widget.MultiViewWrapper);


goog.scope(function() {

var item = mobiletv.EpgScheduleItem.prototype;
var list = mobiletv.EpgScheduleList.prototype;


/** @inheritDoc */
list.setModel = function(model) {
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
        pstj.ds.List, 'Model should be ds.List'), pstj.ds.List.EventType.ADD,
        this.handleModelChange);
  }
};


/**
 * Handles the creation of the children for the view. It iterates over the
 * model items and create a child for each item.
 * @protected
 */
list.createChildren = function() {
  this.removeChildren(true);
  if (!goog.isNull(this.getModel())) {
    if ((this.getModel()).getCount() > 0) {
      for (var i = 0, len = this.getModel().getCount(); i < len; i++) {
        var child = new mobiletv.EpgScheduleItem();
        child.setModel(this.getModel().getByIndex(i));
        this.addChild(child, true);
      }
    }
  }
};


/**
 * Handles the ADD change in the currrent model.
 * @param {goog.events.Event} e The ADD datastructire list event.
 * @protected
 */
list.handleModelChange = function(e) {
  this.createChildren();
};


/** @inheritDoc */
list.enterDocument = function() {
  goog.base(this, 'enterDocument');
  this.getHandler().listen(this, goog.ui.Component.EventType.ACTION,
      this.handleChildAction);
};


/**
 * Handles the ACTION ui event coming from one of the children (and their
 * children).
 * @param {goog.events.Event} e The ACTION UI event.
 * @protected
 */
list.handleChildAction = function(e) {
  if (e.target == this) return;
  var target = e.target.getParent();
  if (goog.DEBUG) {
    if (goog.isNull(target)) throw new Error('This should not happen');
  }
  this.getModel().deleteNode(target.getModel());
};

});  // goog.scope
