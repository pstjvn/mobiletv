goog.provide('app');

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
  if (!goog.global['cordova']) {
    document.addEventListener('deviceready', function() {
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
