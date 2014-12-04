goog.provide('app');

goog.require('goog.storage.mechanism.mechanismfactory');
goog.require('mobiletv.Main');
goog.require('mobiletv.loader');
goog.require('mobiletv.template');


/**
 * Just starts the execution of the mobile TV app.
 */
(function() {
  // Preload some fake data for our tests if it is said so in the config.
  if (goog.global['DATASTREAM'] == 'local') {
    mobiletv.loader.loadFakeData(goog.global['MOBILETV']);
  }

  // Check if we are in an enmbeded env.
  var embed = goog.global['SYSMASTER']['APPS']['MOBILETV']['EMBED'];

  // reate the document structure.
  document.body.appendChild(goog.dom.htmlToDocumentFragment(
      mobiletv.template.mobiletv({embed: !!embed}).toString()));

  // handle cordova env
  if (!!goog.global['CORDOVA']) {
    // Delay until device is ready.
    document.addEventListener('deviceready', function() {
      // Work around issue in the cordova cast plugin.
      goog.global['chrome']['cast']['_setup']();

      // check if we have the domain to talk to.
      var storage = goog.storage.mechanism.mechanismfactory.create('mtvlogin');
      if (!storage) {
        // Oops, we cannot work without local storage.
        mobiletv.Main.getInstance().start('Cannot access storage');
      } else {
        // Load the domain
        var domain = storage.get('domain');

        // If no domain is configured we cannot coninue, redirect to login.
        if (goog.isNull(domain)) {
          window.location.href = (
              goog.global['SYSMASTER']['APPS']['MOBILETV']['LOGIN_URL']);
        } else {
          // Alter the data url to match the domain and go as usual.
          goog.global['SYSMASTER']['APPS']['MOBILETV']['DATA_URL'] = 'http://' +
              domain + '/cgi-bin/if.cgi';
          mobiletv.Main.getInstance().start();
        }
      }
    });
  } else {
    // Start from web.
    mobiletv.Main.getInstance().start();
  }
}());
