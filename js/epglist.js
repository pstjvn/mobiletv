/**
 * @fileoverview Provides the regular epg list widget. It is designed simply
 * over the idea of hiding/showing the element and updating the content
 * accordingly.
 *
 * @author regardingscot@gmail.com (PeterStJ)
 */

goog.provide('mobiletv.EpgList');

goog.require('goog.array');
goog.require('goog.async.nextTick');
goog.require('goog.style');
goog.require('goog.ui.Component');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.Control');
goog.require('goog.ui.ControlRenderer');
goog.require('mobiletv.Epg');
goog.require('mobiletv.EpgItem');
goog.require('mobiletv.EpgItem.EventType');
goog.require('mobiletv.EpgQueue');
goog.require('pstj.configure');
goog.require('pstj.error');
goog.require('pstj.error.ErrorHandler');
goog.require('pstj.ui.Button');
goog.require('pstj.ui.CustomButtonRenderer');
goog.require('pstj.widget.MultiViewWrapper');
goog.require('smstb.ds.Epg.Cache');
goog.require('smstb.ds.Record');



/**
 * Provides the simple epg list (as opposed to NSView based implementation).
 * @constructor
 * @extends {pstj.widget.MultiViewWrapper}
 */
mobiletv.EpgList = function() {
  goog.base(this);
  /**
   * Cache for the visual size of the epg record item in the view.
   * It is used to calculate the scroll offset when displaying epg for a
   * channel.
   * @type {number}
   * @private
   */
  this.listItemHeight_ = -1;
  this.cache_ = mobiletv.Epg.getInstance();
  this.epgList = new goog.ui.Component();
  this.titleLabel = new goog.ui.Component();
  this.addChild(this.titleLabel);
  this.addChild(this.epgList);
};
goog.inherits(mobiletv.EpgList, pstj.widget.MultiViewWrapper);


/** @inheritDoc */
mobiletv.EpgList.prototype.decorateInternal = function(el) {
  goog.base(this, 'decorateInternal', el);
  this.titleLabel.decorate(this.getElementByClass(goog.getCssName(
      'epg-title')));
  this.epgList.decorate(this.getElementByClass(goog.getCssName('epg-list')));
};


/** @inheritDoc */
mobiletv.EpgList.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  if (!goog.asserts.assertBoolean(pstj.configure.getRuntimeValue(
      'NO_LOCAL_STORAGE', false, 'SYSMASTER.APPS.MOBILETV'))) {

    this.getHandler().listen(this, mobiletv.EpgItem.EventType.ADD,
        this.handleEpgAdd);
  }
};


/**
 * Handles the ADD event from a child epg item.
 * @param {goog.events.Event} e The wrapped ADD event.
 * @protected
 */
mobiletv.EpgList.prototype.handleEpgAdd = function(e) {
  e.stopPropagation();
  mobiletv.EpgQueue.getInstance().add(e.target.getModel().clone());
};


/**
 * Sets the title of the EPG (the program name).
 * @param {string} title THe program name.
 */
mobiletv.EpgList.prototype.setTitle = function(title) {
  this.titleLabel.getElement().innerHTML = title;
};


/** @inheritDoc */
mobiletv.EpgList.prototype.setModel = function(model) {
  // should accept the record item as model and load the epg for it.
  goog.asserts.assertInstanceof(model, pstj.ds.ListItem,
      'The model should be List instance');
  goog.base(this, 'setModel', model);
  this.onModelChange();
};


/**
 * Handle the change of the model with a new record.
 * @protected
 */
mobiletv.EpgList.prototype.onModelChange = function() {
  if (!goog.isNull(this.getModel())) {
    if (this.getModel().getProp(smstb.ds.Record.Property.ISDIR)) {
      this.setVisible(false);
    } else {
      // show the widget and start loading the data
      this.setTitle(goog.asserts.assertString(this.getModel().getProp(
          smstb.ds.Record.Property.NAME)));

      this.clearContent();
      var data = this.cache_.get(this.getModel().getId().toString());
      if (goog.isNull(data)) {
        pstj.error.throwError(pstj.error.ErrorHandler.Error.SERVER, undefined,
            'No records found for this channel');
        this.displayInlineMessage('');
      } else {
        this.displayEpg();
      }
      // if (this.cache_.has(this.getModel().getId().toString())) {
      //   this.displayEpg();
      // } else {
      //   this.displayInlineMessage('Loading...');
      //   mobiletv.loader.getEpg(goog.asserts.assertString(this.getModel()
      //       .getProp(smstb.ds.Record.Property.PLAYURL)), goog.bind(
      //       this.handleEpgLoad, this, this.getModel())
      //   );
      // }
      this.setVisible(true);
    }
  } else {
    this.setVisible(false);
  }
};


/**
 * Displays the 'loading now' message.
 * TODO: find a more elegant way to display messages.
 * @protected
 * @param {string} msg The message to display inline.
 */
mobiletv.EpgList.prototype.displayInlineMessage = function(msg) {
  this.epgList.getElement().innerHTML = msg;
};


/**
 * Updates the list representation.
 * FIXME: check for 0 length is redundant as it is made in the epg processing on
 * the loader side.
 * @protected
 */
mobiletv.EpgList.prototype.displayEpg = function() {
  var list = this.cache_.get(this.getModel().getId().toString());
  if (list.getCount() == 0) {
    pstj.error.throwError(pstj.error.ErrorHandler.Error.STRUCTURE, -1,
        'No information found for this channel');
  } else {
    this.displayInlineMessage('');
    list.forEach(function(listitem) {
      var item = new mobiletv.EpgItem();
      item.setModel(listitem);
      this.epgList.addChild(item, true);
    }, this);
    var idx = list.getCurrentIndex();
    goog.async.nextTick(function() {
      if (this.listItemHeight_ == -1) {
        this.listItemHeight_ = goog.style.getSize(
            this.epgList.getChildAt(0).getElement()).height;
      }
      window['scrollTo'](0, this.listItemHeight_ * idx);
    }, this);
  }
};


/**
 * Clears the content of the listing.
 * @protected
 */
mobiletv.EpgList.prototype.clearContent = function() {
  goog.array.forEach(this.epgList.removeChildren(true), function(item) {
    goog.dispose(item);
  });
};
