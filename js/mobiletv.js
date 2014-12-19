goog.provide('app');

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.storage.mechanism.mechanismfactory');
goog.require('mobiletv.Main');
goog.require('mobiletv.loader');
goog.require('mobiletv.template');
goog.require('smstb.widget.LoginForm');


/**
 * Just starts the execution of the mobile TV app.
 */
(function() {
  if (goog.global['DATASTREAM'] == 'local') {
    mobiletv.loader.loadFakeData(goog.global['MOBILETV']);
  }
  var embed = goog.global['SYSMASTER']['APPS']['MOBILETV']['EMBED'];
  if (!!goog.global['cordova']) {
    if (goog.DEBUG) {
      console.log('Using cordova environment');
    }
    document.addEventListener('deviceready', function() {
      // Cordova has a nasty bug - it cannot stop click events
      // from fireing no matter what we do to the touch events.
      // This is a temporary work around for it.
      goog.events.listen(document, [
        goog.events.EventType.CLICK,
        goog.events.EventType.MOUSEDOWN,
        goog.events.EventType.MOUSEUP,
        goog.events.EventType.MOUSEOVER,
        goog.events.EventType.MOUSEOUT],
      /** @param {goog.events.Event} e The wrapped click event.*/ (
          function(e) {
            e.getBrowserEvent().stopImmediatePropagation();
            e.preventDefault();
            return false;
          }), true);
      if (goog.DEBUG) {
        console.log('Device ready in cordova, call cast setup plugin');
      }
      goog.global['chrome']['cast']['_setup']();
      var lf = new smstb.widget.LoginForm();
      lf.authorize(function() {
        goog.global['SYSMASTER']['APPS']['MOBILETV']['DATA_URL'] = 'http://' +
            lf.domain + '/cgi-bin/if.cgi';
        lf.dispose();
        document.body.appendChild(goog.dom.htmlToDocumentFragment(
            mobiletv.template.mobiletv({embed: !!embed}).toString()));
        mobiletv.Main.getInstance().start();
      });
    });
  } else {
    document.body.appendChild(goog.dom.htmlToDocumentFragment(
        mobiletv.template.mobiletv({embed: !!embed}).toString()));
    mobiletv.Main.getInstance().start();
  }
}());
