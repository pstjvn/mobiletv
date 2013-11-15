goog.provide('test');

goog.require('goog.ui.Control');
goog.require('pstj.lab.style.css');
goog.require('pstj.ui.gestureAgent');
goog.require('pstj.ui.gestureAgent.EventType');

/**
 * @constructor
 * @extends {goog.ui.Control}
 */
var comp = function() {
  goog.base(this);
};
goog.inherits(comp, goog.ui.Control);

var currentY = 0;

function myhandler(e) {
  console.log(e.type);
  if (e.type == pstj.ui.gestureAgent.EventType.MOVE) {
    currentY = currentY - pstj.ui.gestureAgent.getInstance().getMoveDifferenceY();
    this.setY(currentY);
  }
};

comp.prototype.setY = function(y) {
  pstj.lab.style.css.setTranslation(this.getElement(), 0, y);
};

/** @inheritDoc */
comp.prototype.decorateInternal = function(el) {
  goog.base(this, 'decorateInternal', el);
  console.log('deco')
  this.getHandler().listen(this, [
    pstj.ui.gestureAgent.EventType.PRESS,
    pstj.ui.gestureAgent.EventType.MOVE,
    pstj.ui.gestureAgent.EventType.RELEASE], myhandler);
};

test = function() {
  var c = new comp();
  c.decorate(document.querySelector('.main'));
  pstj.ui.gestureAgent.getInstance().attach(c);
};

test();
