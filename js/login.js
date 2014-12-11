goog.provide('mobiletv.login');

goog.require('goog.Uri');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.net.Jsonp');
goog.require('goog.storage.mechanism.mechanismfactory');
goog.require('mobiletv.Notification');

goog.scope(function() {
var _ = mobiletv.login;


/**
 * Hardocded the URL because closure library thinks it is a must to protect
 *   the users from bugs in webkit adn thus does not allow 'username' in URL
 *   and wrongly interprets the chrome-extension uris as ones having username
 *   in them.
 * @type {string}
 * @private
 */
_.submitUrl_ = '/cgi-bin/if.cgi';


/**
 * @type {goog.storage.mechanism.Mechanism}
 */
_.storage = null;


/**
 * The run parameter to use on the server.
 * @type {string}
 */
_.runValue = 'mtvlog';


/**
 * The key name for the storage of the pin.
 * @type {string}
 * @final
 */
_.PIN = 'pin';


/**
 * The key name for the storage of the domain.
 * @type {string}
 * @final
 */
_.DOMAIN = 'domain';


/**
 * Holds reference to the current value of the pin.
 * @type {string}
 */
_.currentPin = '';


/**
 * Holds reference to the current value of the domain.
 * @type {string}
 */
_.currentDomain = '';


/**
 * The notification to use.
 * @type {mobiletv.Notification}
 */
_.notification = new mobiletv.Notification();


/**
 * Function to call when initializing everything.
 * It will load the storage and check if there are items saved and if yes it
 * will use them to attempt login. If only partial information is available
 * it will update the form values.
 */
_.init = function() {
  _.notification.decorate(goog.dom.getElementByClass('notifications'));
  _.runValue = document.querySelector('[name="run"]').value;
  _.storage = goog.storage.mechanism.mechanismfactory.create('mtvlogin');
  if (goog.isNull(_.storage)) {
    if (goog.DEBUG) {
      console.log('No persistant storage is available');
    }
    return;
  } else {
    var pin = _.storage.get(_.PIN);
    var domain = _.storage.get(_.DOMAIN);
    if (!goog.isNull(pin) && !goog.isNull(domain)) {
      _.tryLogin(pin, domain);
    } else {
      _.updateForm(pin, domain);
    }
  }
};


/**
 * Updates the values in the form to match what was stored.
 * @param {?string} pin
 * @param {?string} domain
 */
_.updateForm = function(pin, domain) {
  if (!goog.isNull(pin)) {
    goog.dom.getElement('pin').value = pin;
  }
  if (!goog.isNull(domain)) {
    goog.dom.getElement('domain').value = domain;
  }
};


/**
 * Attempts login with the provided values. Note that neither should be empty
 * or null.
 * @param {string} pin
 * @param {string} domain
 */
_.tryLogin = function(pin, domain) {
  if (goog.string.isEmpty(pin)) {
    _.error('Pin cannot be empty');
    return;
  }
  if (goog.string.isEmpty(domain)) {
    _.error('Domain is required');
    return;
  }

  _.currentPin = pin;
  _.currentDomain = domain;

  var uri = new goog.Uri();
  uri.setScheme('http');
  uri.setDomain(domain);
  uri.setPath(_.submitUrl_);
  uri.setParameterValues(_.getPinName(), pin);
  uri.setParameterValues('run', _.runValue);

  var jsonp = new goog.net.Jsonp(uri);
  jsonp.setRequestTimeout(2000);
  jsonp.send(null, _.onSuccess, _.onError);
};


/**
 * Handles the succes callback of jsonp.
 * @param {Object.<string, string>} data
 */
_.onSuccess = function(data) {
  console.log('Data?', data);
  if (data && data['status'] && data['status'] == 'OK') {
    if (!goog.isNull(_.storage)) {
      _.storage.set(_.PIN, _.currentPin);
      _.storage.set(_.DOMAIN, _.currentDomain);
    }
    window.location.href = 'index.html';
  } else {
    if (data && data['msg']) {
      _.error(data['msg']);
    } else {
      _.error('Cannot authorize with this server: ' + _.currentDomain +
          '. Make sure the domain/ip and pin are correct.');
    }
  }
};


/**
 * Handles the errors in the jsonp.
 */
_.onError = function() {
  _.error('Cannot connect to destination: ' + _.currentDomain +
      '. Make sure you have entered it correctly and try again');
};


/**
 * @param {string} msg
 */
_.error = function(msg) {
  console.log(msg);
  _.notification.setModel(msg, 5000);
};


/**
 * Getter for the name to use in the url submit for the pin value.
 * @return {string}
 */
_.getPinName = function() {
  return goog.dom.getElement('pin').name;
};


/**
 * Getter for the form element.
 * @return {HTMLFormElement}
 */
_.getForm = function() {
  return /** @type {HTMLFormElement} */ (goog.dom.getElement('form'));
};

});  // goog.scope


(function() {
  goog.events.listen(
      mobiletv.login.getForm(),
      goog.events.EventType.SUBMIT,
      function(e) {
        e.preventDefault();
        var pin = goog.dom.getElement('pin').value;
        var domain = goog.dom.getElement('domain').value;
        mobiletv.login.tryLogin(pin, domain);
      });
  mobiletv.login.init();
})();
