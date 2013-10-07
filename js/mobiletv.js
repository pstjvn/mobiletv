goog.provide('app');
goog.require('mobiletv.Main');
goog.require('mobiletv.loader');
goog.require('mobiletv.template');


/**
 * Just starts the execution of the mobile TV app.
 */
(function() {
  // Preload some fake data for our tests
  if (goog.DEBUG) {
    mobiletv.loader.loadFakeData(goog.global['MOBILETV']);
  }
  // load the UI invisibly
  document.body.appendChild(goog.dom.htmlToDocumentFragment(
      mobiletv.template.mobiletv({
        embed: ((new goog.Uri(window.location.href)).getParameterValue(
            'embed') == 1)
      })));
  mobiletv.Main.getInstance().start();
}());
