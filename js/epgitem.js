goog.provide('mobiletv.EpgAddButtonRenderer');
goog.provide('mobiletv.EpgItem');
goog.provide('mobiletv.EpgItem.EventType');
goog.provide('mobiletv.EpgItemRenderer');

goog.require('goog.events');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.Control');
goog.require('mobiletv.template');
goog.require('pstj.configure');
goog.require('pstj.date.utils');
goog.require('pstj.ui.Button');
goog.require('pstj.ui.ControlRenderer');
goog.require('pstj.ui.EmbededButtonRenderer');
goog.require('smstb.ds.Epg.Property');



/**
 * Provides the default epg item renderer.
 * @constructor
 * @extends {pstj.ui.ControlRenderer}
 * */
mobiletv.EpgItemRenderer = function() {
  goog.base(this);
  /**
   * Used as reference format for the time label in EPG. Protected so inheriting
   * classes can access it.
   * @type {string}
   * @protected
   */
  this.timeFormat = goog.asserts.assertString(
      pstj.configure.getRuntimeValue('EPG_TIME_FORMAT',
      'HH:mm', 'SYSMASTER.APPS.MOBILETV'), 'Time format should be string');
  /**
   * Used as reference format for the date delimiter in EPG. Protected so
   * inheriting classess can still access it.
   * @type {string}
   * @protected
   */
  this.dateBorderFormat = goog.asserts.assertString(
      pstj.configure.getRuntimeValue('EPG_DATE_FORMAT',
      'E - (d MMM)', 'SYSMASTER.APPS.MOBILETV'),
      'Date format for borders should be string');
};
goog.inherits(mobiletv.EpgItemRenderer, pstj.ui.ControlRenderer);
goog.addSingletonGetter(mobiletv.EpgItemRenderer);


/**
 * The class name to use for the item.
 * @type {string}
 * @final
 */
mobiletv.EpgItemRenderer.CSS_CLASS = goog.getCssName('epg-list-item');


goog.scope(function() {

var _ = mobiletv.EpgItemRenderer.prototype;


/** @inheritDoc */
_.getTemplate = function(control) {
  return mobiletv.template.epgitem(this.generateTemplateData(control));
};


/** @inheritDoc */
_.getCssClass = function() {
  return mobiletv.EpgItemRenderer.CSS_CLASS;
};


/** @inheritDoc */
_.generateTemplateData = function(control) {
  goog.asserts.assertInstanceof(control.getModel(), pstj.ds.ListItem);
  var model = control.getModel();
  return {
    title: model.getProp(smstb.ds.Epg.Property.TITLE),
    description: model.getProp(smstb.ds.Epg.Property.DESCRIPTION),
    start: pstj.date.utils.renderTimeSafe(model.getProp(
        smstb.ds.Epg.Property.START_TIME), this.timeFormat),
    delimiter: (model.getProp(smstb.ds.Epg.Property.IS_DATE_DELIMITER)) ?
        pstj.date.utils.renderTimeSafe(model.getProp(
        smstb.ds.Epg.Property.START_TIME), this.dateBorderFormat) : ''
  };
};

});  // goog.scope



/**
 * @constructor
 * @extends {goog.ui.Control}
 * @param {goog.ui.ControlRenderer=} opt_renderer The optional renderer to use
 * for the component.
 * @param {pstj.ui.CustomButtonRenderer=} opt_button_renderer The renderer to
 * use for the button.
 */
mobiletv.EpgItem = function(opt_renderer, opt_button_renderer) {
  goog.base(this, '', opt_renderer ||
      mobiletv.EpgItemRenderer.getInstance());
  this.button = new pstj.ui.Button(opt_button_renderer ||
      /** @type {pstj.ui.CustomButtonRenderer} */(
      goog.ui.ControlRenderer.getCustomRenderer(
          pstj.ui.EmbededButtonRenderer,
          goog.getCssName('epg-add-button'))));
  this.addChild(this.button);
};
goog.inherits(mobiletv.EpgItem, goog.ui.Control);


/**
 * @enum {string}
 */
mobiletv.EpgItem.EventType = {
  ADD: goog.events.getUniqueId('add')
};


goog.scope(function() {

var _ = mobiletv.EpgItem.prototype;


/** @inheritDoc */
_.enterDocument = function() {
  goog.base(this, 'enterDocument');
  this.button.decorate(this.getElementByClass(
      this.button.getRenderer().getCssClass()));
  this.getHandler().listen(this.button, goog.ui.Component.EventType.ACTION,
      this.handleButtonAction);
};


/**
 * We want to have the button action handled here and emit different type of
 * event so that we know when to add something to the EPG queue and when to
 * simply open the item.
 * @param {goog.events.Event} e The ACTION event from the button.
 * */
_.handleButtonAction = function(e) {
  e.stopPropagation();
  this.dispatchEvent(mobiletv.EpgItem.EventType.ADD);
};

});  // goog.scope
