/**
 * @fileoverview Provides the regular epg list widget. It is designed simply
 * over the idea of hiding/showing the element and updating the content
 * accordingly.
 *
 * @author regardingscot@gmail.com (PeterStJ)
 */

goog.provide('mobiletv.EpgList');

goog.require('goog.array');
goog.require('goog.ui.Component');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.Control');
goog.require('goog.ui.ControlRenderer');
goog.require('mobiletv.EpgItem');
goog.require('mobiletv.EpgItem.EventType');
goog.require('mobiletv.EpgQueue');
goog.require('mobiletv.loader');
goog.require('pstj.error.ErrorHandler.Error');
goog.require('pstj.error.throwError');
goog.require('pstj.ui.Button');
goog.require('pstj.ui.CustomButtonRenderer');
goog.require('smstb.ds.Epg.Cache');
goog.require('smstb.ds.Record');



/**
 * Provides the simple epg list (as opposed to NSView based implementation).
 * @constructor
 * @extends {goog.ui.Component}
 */
mobiletv.EpgList = function() {
  goog.base(this);
  this.cache_ = smstb.ds.Epg.Cache.getInstance();
  this.epgList = new goog.ui.Component();
  this.backButton = new pstj.ui.Button(
      /** @type {pstj.ui.CustomButtonRenderer} */(
      goog.ui.ControlRenderer.getCustomRenderer(pstj.ui.CustomButtonRenderer,
      goog.getCssName('epg-button'))));
  this.titleLabel = new goog.ui.Component();
  this.addChild(this.backButton);
  this.addChild(this.titleLabel);
  this.addChild(this.epgList);
};
goog.inherits(mobiletv.EpgList, goog.ui.Component);


/** @inheritDoc */
mobiletv.EpgList.prototype.decorateInternal = function(el) {
  goog.base(this, 'decorateInternal', el);
  this.backButton.decorate(this.getElementByClass(goog.getCssName(
      'epg-button')));
  this.titleLabel.decorate(this.getElementByClass(goog.getCssName(
      'epg-title')));
  this.epgList.decorate(this.getElementByClass(goog.getCssName('epg-list')));
};


/** @inheritDoc */
mobiletv.EpgList.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  this.getHandler().listen(this.backButton,
      goog.ui.Component.EventType.ACTION, this.handleBackButton);
  this.getHandler().listen(this, mobiletv.EpgItem.EventType.ADD,
      this.handleEpgAdd);
};


/**
 * Handles the ADD event from a child epg item.
 * @param {goog.events.Event} e The wrapped ADD event.
 * @protected
 */
mobiletv.EpgList.prototype.handleEpgAdd = function(e) {
  e.stopPropagation();
  mobiletv.EpgQueue.getInstance().add(e.target.getModel());
};


/**
 * Handles the back button activation
 * @param {goog.events.Event} e The component's ACTION event.
 * @protected
 */
mobiletv.EpgList.prototype.handleBackButton = function(e) {
  e.stopPropagation();
  this.setVisible(false);
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
      'The model should be LIst instance');
  goog.base(this, 'setModel', model);
  this.onModelChange();
  //this.updateList();
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
      if (this.cache_.has(this.getModel().getId().toString())) {
        this.displayEpg();
      } else {
        this.displayInlineMessage('Loading...');
        mobiletv.loader.getEpg(goog.asserts.assertString(this.getModel()
            .getProp(smstb.ds.Record.Property.PLAYURL)), goog.bind(
            this.handleEpgLoad, this, this.getModel())
        );
      }
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
 * Handles the loading of a new epg list for a particular record.
 * @param {pstj.ds.ListItem} record The record for which the epg is.
 * @param {?Error} err The error if one occured.
 * @param {Array.<Object>} epg The epg listing as an Array.
 * @protected
 */
mobiletv.EpgList.prototype.handleEpgLoad = function(record, err, epg) {
  if (err) {
    pstj.error.throwError(pstj.error.ErrorHandler.Error.SERVER, undefined,
        err.message);
    this.displayInlineMessage('');
  } else {
    var list = new pstj.ds.List(epg);
    this.cache_.set(record.getId().toString(), list);
    if (this.getModel() == record) {
      this.displayEpg();
    }
  }
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


/**
 * Shows/hides the widget.
 * @param {boolean} visible If true - show the widget.
 */
mobiletv.EpgList.prototype.setVisible = function(visible) {
  goog.dom.classlist.enable(this.getElement(), goog.getCssName('mtv-hidden'),
      !visible);
  this.dispatchEvent(visible ? goog.ui.Component.EventType.SHOW :
      goog.ui.Component.EventType.HIDE);
};
