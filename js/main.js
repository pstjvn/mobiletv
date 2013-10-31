/**
 * @fileoverview Provides the main entry point for the mobile TV application.
 * @author <regardingscot@gmail.com> (PeterStJ)
 */

goog.provide('mobiletv.Main');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.ViewportSizeMonitor');
goog.require('goog.dom.classlist');
goog.require('goog.events');
goog.require('goog.result.Result');
goog.require('goog.result.SimpleResult');
goog.require('goog.ui.Component');
goog.require('goog.ui.Component.EventType');
goog.require('mobiletv.Bookmarks');
goog.require('mobiletv.Channels');
goog.require('mobiletv.EpgList');
goog.require('mobiletv.EpgQueue');
goog.require('mobiletv.EpgScheduleList');
goog.require('mobiletv.ErrorHandler');
goog.require('mobiletv.Player');
goog.require('mobiletv.RecordList');
goog.require('mobiletv.SearchPanel');
goog.require('mobiletv.TopPanel');
goog.require('mobiletv.pubsub');
goog.require('mobiletv.strings');
goog.require('pstj.configure');
goog.require('pstj.ds.List');
goog.require('pstj.ds.ListItem');
goog.require('pstj.error.ErrorHandler.Error');
goog.require('pstj.error.throwError');
goog.require('pstj.ui.Button');
goog.require('pstj.ui.Strings');
goog.require('pstj.ui.TouchAgent');
goog.require('pstj.ui.Touchable.EventType');
goog.require('pstj.widget.MultiView');
goog.require('smstb.ds.Record');
goog.require('smstb.widget.ListItem');
goog.require('smstb.widget.ListItem.Action');
goog.require('smstb.widget.MobilePopup');
goog.require('smstb.widget.NSRecordView');



/**
 * This is the main entry point for our application. Using the singleton
 * pattern.
 *
 * @constructor
 */
mobiletv.Main = function() {
  /**
   * @type {pstj.ds.List}
   */
  this.data = null;
  /**
   * @type {goog.ui.Component}
   */
  this.listElement = null;
  /**
   * Points to the current simple result used to handle playback.
   * @type {goog.result.SimpleResult}
   * @private
   */
  this.result_ = null;
  /**
   * Points to the current JSONP instance request.
   * @type {goog.net.Jsonp}
   * @private
   */
  this.jsonp_ = null;
  /**
   * Points to the current key to cancel the JSONP request
   * @type {Object}
   * @private
   */
  this.jsonpKey_ = null;
  /**
   * @type {?function(Error): boolean}
   * @private
   */
  this.globalErrorHandler_ = function(err) {
    var el = document.querySelector('.loader');
    el.innerHTML = el.innerHTML + '<br>' + err.message;
    return true;
  };
  goog.events.listen(window, goog.events.EventType.ERROR,
      this.globalErrorHandler_);
  /**
   * The epg component. Note that it is very simple by default and needs lot of
   * manual work to work properly.
   * TODO: automate the epg component.
   * @type {mobiletv.EpgList}
   * @protected
   */
  this.epg = new mobiletv.EpgList();
  /**
   * Ference to the schdule view to be used.
   * @type {mobiletv.EpgScheduleList}
   * @protected
   */
  this.schedule = new mobiletv.EpgScheduleList();

  this.searchPanel = new mobiletv.SearchPanel();
  this.buttonPanel = new mobiletv.TopPanel();
  this.popup = new smstb.widget.MobilePopup();

  /**
   * Reference to the multi view used in the
   */
  this.multiView = new pstj.widget.MultiView();

  /**
   * Flag if we should use the native scroll for the lists or rely on
   * NGTableView like implementation. The implementation is very good on iOS but
   * not that great on Android.
   * @type {boolean}
   * @private
   */
  this.useNativeScroll_ = !(goog.asserts.assertBoolean(
      pstj.configure.getRuntimeValue('USE_NATIVE_SCROLL',
      false, 'SYSMASTER.APPS.MOBILETV')));

  var platform = pstj.configure.getRuntimeValue('PLATFORM', 'pc',
      'SYSMASTER.APPS.MOBILETV');
  if (platform == 'ios') {
    mobiletv.pubsub.channel.subscribe(mobiletv.pubsub.topic.OVERLAY,
        function(overlayed) {
          document.querySelector('video').style.display = (overlayed) ?
              'none' : 'block';
        });

  }
  this.isAdnroid_ = (platform == 'android');

};
goog.addSingletonGetter(mobiletv.Main);


/**
 * Filter generation helper. The filtering is done by partially applying this
 * function and then use the resulting function as filter.
 *
 * @param {string} text The search text entered in the input.
 * @param {string} language The selected language if any.
 * @param {string} type The selected video type.
 * @param {string} category The category selected in the UI. One of the
 * predefined category can be selected and it should be compared to the one of
 * the item, if none is selected an empty string will be passed.
 * @param {pstj.ds.ListItem} item The item to check if matches filter.
 * @return {boolean}
 * @protected
 */
mobiletv.Main.filterFn = function(text, language, type, category, item) {
  var name = item.getProp(smstb.ds.Record.Property.NAME).toLowerCase();
  if (name.indexOf(text.toLowerCase()) == -1) return true;
  if (language != '') {
    if (item.getProp(smstb.ds.Record.Property.LANGUAGE) != language) {
      return true;
    }
  }
  if (type != '') {
    if (type == 'fav') {
      if (!item.getProp(smstb.ds.Record.Property.BOOKMARKED)) {
        return true;
      }
    } else {
      if (item.getProp(smstb.ds.Record.Property.TYPE) != type) return true;
    }
  }
  if (category != '') {
    if (item.getProp(smstb.ds.Record.Property.GENRE) != category) return true;
  }
  return false;
};


/**
 * The suffix to use on the playURL to get the current price for current user
 * based on the play uri of the channel being queried.
 * @type {string}
 * @final
 */
mobiletv.Main.GET_CURRENT_PRICE = '&t=30';


/**
 * Initialize the app.
 */
mobiletv.Main.prototype.start = function() {

  // Disable native scroll when using nsview scrolling.
  if (!this.useNativeScroll_) {
    goog.events.listen(document.body, goog.events.EventType.TOUCHSTART,
        function(e) {
          e.stopPropagation();
          e.preventDefault();
        });
  }

  // Handle channel load ready event. When this happen we are ready to render
  // the record view.
  goog.events.listenOnce(mobiletv.Channels.getInstance(),
      mobiletv.Channels.EventType.LOAD, this.handleDataLoad, undefined,
      this);

  // Hack away the auto start problem in IOS
  goog.events.listenOnce(document.body, goog.events.EventType.TOUCHSTART,
      function(e) {
        document.querySelector('video').play();
      });

  // Setup default error handler. Our implementation is used to notify the
  // users visually as well.
  mobiletv.ErrorHandler.getInstance().setElement(goog.dom.getElementByClass(
      goog.getCssName('notifications')));

  // setup the epg queue from the stored local data.
  mobiletv.EpgQueue.getInstance();

  // Construct instances of components. Differentiate between native and NSView
  if (this.useNativeScroll_) {
    this.listElement = new mobiletv.RecordList();
  } else {
    this.listElement = new smstb.widget.NSRecordView();
    // window size monitor bind and resize.
    goog.events.listen(goog.dom.ViewportSizeMonitor.getInstanceForWindow(),
        goog.events.EventType.RESIZE,
        function(e) {
          this.listElement.getElement().style.height = (
              window.innerHeight - this.panelSize_) + 'px';
          this.listElement.recalculateSizes();
        }, undefined, this);
  }

  // Attach items to the multi view.
  this.multiView.addChild(this.listElement);
  this.multiView.addChild(this.epg);
  this.multiView.addChild(this.schedule);

  // Handle activation for items. Here we want to decide if we are to
  // play the item or show its EPG details.
  goog.events.listen(this.listElement, goog.ui.Component.EventType.ACTION,
      function(ev) {
        var item = /** @type {smstb.widget.ListItem} */ (ev.target);
        this.data.setCurrent(item.getModel());

        if (item.getActionType() == smstb.widget.ListItem.Action.EPG) {
          this.epg.setModel(this.data.getCurrent());
        } else if (item.getModel().getProp(smstb.ds.Record.Property.ISDIR)) {
          // show the dir using the gloabl channel list simply overwrite the
          // data in the list.
        } else {
          this.attemptPlayback();
        }
      }, undefined, this);

  goog.events.listen(this.listElement, pstj.ui.Touchable.EventType.LONG_PRESS,
      function(e) {
        var item = /** @type {smstb.widget.ListItem} */ (e.target);
        var model = item.getModel();
        if (!goog.isNull(model)) {
          var isbookmarked = model.getProp(smstb.ds.Record.Property.BOOKMARKED);
          model.mutate(smstb.ds.Record.Property.BOOKMARKED, !isbookmarked);
          if (isbookmarked) {
            mobiletv.Bookmarks.getInstance().remove(model.getId());
          } else {
            mobiletv.Bookmarks.getInstance().add(model.getId());
          }
          pstj.error.throwError(pstj.error.ErrorHandler.Error.RUNTIME, -1,
              ((isbookmarked) ?
              mobiletv.strings.get(mobiletv.strings.Symbol.BOOKMARK_REMOVED) :
              mobiletv.strings.get(mobiletv.strings.Symbol.BOOKMARK_ADDED)));
        }
      });


  // Start decoration.
  this.searchPanel.decorate(goog.dom.getElementByClass(
      goog.getCssName('search-panel')));

  goog.events.listen(this.searchPanel, goog.ui.Component.EventType.ACTION,
      this.filter_, undefined, this);

  this.buttonPanel.decorate(goog.dom.getElementByClass(
      goog.getCssName('panel')));

  this.panelSize_ = goog.style.getSize(this.buttonPanel.getElement()).height;

  goog.events.listen(this.buttonPanel, goog.ui.Component.EventType.ACTION,
      this.checkButtonAction_, undefined, this);

  this.popup.decorate(goog.dom.getElementByClass(goog.getCssName('overlay')));

  if (!this.useNativeScroll_) {
    var list = goog.dom.getElementByClass(goog.getCssName('list'));
    list.style.height = (window.innerHeight - this.panelSize_) + 'px';
  }

  this.listElement.decorate(goog.dom.getElementByClass(
      goog.getCssName('list')));

  if (!this.useNativeScroll_) {
    this.listElement.generateRows();
  }

  // Decorate and hide the EPG and SCHEDULE views
  this.epg.decorate(goog.dom.getElementByClass(goog.getCssName(
      'epg-container')));
  this.epg.setVisible(false, true);
  this.schedule.decorate(goog.dom.getElementByClass(goog.getCssName(
      'epg-schedule-list')));
  this.schedule.setModel(mobiletv.EpgQueue.getInstance().list);
  this.schedule.setVisible(false, true);


  // Finally - decorate the multiview
  this.multiView.decorate(goog.dom.getElementByClass(goog.getCssName('left')));
  // Handle the multiView events to control the back button and visibility
  goog.events.listen(this.multiView, goog.ui.Component.EventType.SHOW,
      function(e) {
        // check which is the component. it is is diffrent than the main one
        // show the back button.
        if (this.multiView.getVisibleChild() != this.listElement) {
          this.buttonPanel.setBackButtonVisibility(true);
        } else {
          this.buttonPanel.setBackButtonVisibility(false);
        }
      }, undefined, this);

  // Initial state for the back button.
  this.buttonPanel.setBackButtonVisibility(false);
};


/**
 * Checks the action of the top panel and trigger corresponding reaction.
 *
 * @param {goog.events.Event} e The ACTION UI event from the component.
 * @private
 */
mobiletv.Main.prototype.checkButtonAction_ = function(e) {
  var action = this.buttonPanel.getActionName();
  switch (action) {
    case 'back':
      this.listElement.setVisible(true);
      break;
    case 'search':
      this.searchPanel.enable(true);
      break;
    case 'logout':
      window.location.href = goog.asserts.assertString(
          pstj.configure.getRuntimeValue('LOGIN_URL',
          '/cgi-bin/if.cgi?run=mlog', 'SYSMASTER.APPS.MOBILETV'));
      break;
    case 'cart':
      window.location.href = goog.asserts.assertString(
          pstj.configure.getRuntimeValue('PAYMENT_URL',
              '/cgi-bin/if.cgi?run=mlog', 'SYSMASTER.APPS.MOBILETV'));
      break;
    case 'statement':
      window.location.href = goog.asserts.assertString(
          pstj.configure.getRuntimeValue('STATEMENT_URL',
              '/cgi-bin/if.cgi?run=mlog', 'SYSMASTER.APPS.MOBILETV'));
      break;
    case 'menu':
      this.buttonPanel.toggleDrawer();
      break;
    case 'schedule':
      this.buttonPanel.toggleDrawer();
      this.schedule.setVisible(true);
      break;
  }
};


/**
 * Retrieves the search pattern from the search panel and applies filter on
 * the channel list.
 *
 * @private
 */
mobiletv.Main.prototype.filter_ = function() {
  var pattern = this.searchPanel.getSearchPattern();
  // always perform search on the 'this-> data' reference, while the list view
  // (either TableView subclass or a regular component) should use their
  // version.
  this.data.setFilter(
      /** @type {function(pstj.ds.ListItem): boolean} */ (
      goog.partial(mobiletv.Main.filterFn, pattern[0], pattern[1],
      pattern[2], pattern[3])));
};


/**
 * Handles the load ready of the data. The method is passed to the loader.
 * Bite that this only works for single data load pass.
 * FIXME: make this work with nested data models (i.e. folders).
 *
 * @param {goog.events.Event} e The LOAD event from the channels provider.
 * @protected
 */
mobiletv.Main.prototype.handleDataLoad = function(e) {
  this.data = mobiletv.Channels.getInstance().getData();
  if (!goog.isNull(this.data)) {
    this.onDataLoad();
    this.setupPlayback();
    setTimeout(goog.bind(function() {
      goog.events.listen(this.data, pstj.ds.List.EventType.FILTERED,
          this.handleFilterReady_, undefined, this);
    }, this), 1000);
  }
  this.showUI();
};


/**
 * Handle the event from data list that filtering has been completed.
 * @param {goog.events.Event} e The filtered event.
 * @private
 */
mobiletv.Main.prototype.handleFilterReady_ = function(e) {
  var to_hide = this.data.getFilteredIndexes();
  // TODO: fix this for all type of lists!
  if (this.useNativeScroll_) {
    this.listElement.forEachChild(function(item, index) {
      if (to_hide.indexOf(index) == -1) {
        item.setEnabled(true);
      } else {
        item.setEnabled(false);
      }
    });
    if (to_hide.length == this.data.getCount()) {
      // all items are hidden
      pstj.error.throwError(pstj.error.ErrorHandler.Error.RUNTIME, -1,
          mobiletv.strings.get(mobiletv.strings.Symbol.FILTER_NO_MATCHES));
    }
  } else {
    var data = new pstj.ds.List();
    this.data.forEach(function(item, index) {
      if (to_hide.indexOf(index) == -1) {
        data.add(goog.asserts.assertInstanceof(
            this.data.getByIndex(index), pstj.ds.ListItem));
      }
    }, this);
    this.listElement.setModel(data);
  }
};


/**
 * Method to call when data is available.
 * @protected
 */
mobiletv.Main.prototype.onDataLoad = function() {
  if (this.useNativeScroll_) {
    this.data.forEach(function(item) {
      var listitem = new smstb.widget.ListItem();
      listitem.setModel(item);
      this.listElement.addChild(listitem, true);
      pstj.ui.TouchAgent.getInstance().attach(listitem);
    }, this);
  } else {
    this.listElement.setModel(this.data);
  }
};


/**
 * Organizes the activities on starting playback.
 * @protected
 */
mobiletv.Main.prototype.setupPlayback = function() {
  mobiletv.Player.getInstance().decorate(
      goog.dom.getElementByClass(goog.getCssName('right')));
};


/**
 * Assuming data is ready start showing the UI.
 * The method should only be called internally.
 * @protected
 */
mobiletv.Main.prototype.showUI = function() {
  // Finally remove loader
  if (pstj.configure.getRuntimeValue('PLATFORM', 'ios',
      'SYSMASTER.APPS.MOBILETV') == 'android') {

    goog.dom.classlist.add(document.querySelector('html'),
        goog.getCssName('android'));
  }
  // Remove global handler, we now have app error handler.
  goog.events.unlisten(window, goog.events.EventType.ERROR,
      this.globalErrorHandler_);
  this.globalErrorHandler_ = null;
  goog.dom.removeNode(document.querySelector('.loader'));
};


/**
 * Handles the errors while loading.
 * @param {Error} err The error that occurred.
 * @protected
 */
mobiletv.Main.prototype.handleLoadError = function(err) {
  document.querySelector('.loader').innerHTML =
      'Error loading app, please try again.';
};


/**
 * Handles the receiving of the current price from the server.
 * @private
 */
mobiletv.Main.prototype.handlePriceValue_ = function() {
  var val = this.result_.getValue();
  if (goog.isNumber(val)) {
    if (val == 0) {
      this.startPlayback();
    } else if (val > 0) {
      this.askConfirmation_(val);
    }
  } else {
    pstj.error.throwError(pstj.error.ErrorHandler.Error.STRUCTURE, -1,
        mobiletv.strings.get(mobiletv.strings.Symbol.SERVER_ERROR));
  }
};


/**
 * Initiates pop-up for payment confirmation. The payment itself will be
 *  registered only after playback is started on the player.
 * @private
 * @param {number} price The asked price for the payment.
 */
mobiletv.Main.prototype.askConfirmation_ = function(price) {
  this.popup.setModel(new pstj.ds.ListItem({
    'id': 1,
    'price': price,
    'currency': this.data.getCurrent().getProp(
        smstb.ds.Record.Property.CURRENCY)
  }));
  this.popup.enable(true, goog.bind(function(start) {
    mobiletv.pubsub.channel.publish(mobiletv.pubsub.topic.OVERLAY, false);
    if (start) {
      this.startPlayback();
    } else {
      pstj.error.throwError(pstj.error.ErrorHandler.Error.RUNTIME, -1,
          mobiletv.strings.get(
          mobiletv.strings.Symbol.PAYMENT_CANCELED));
      //this.notifications.setModel(this.strings_.get(0));
    }
  }, this));
  mobiletv.pubsub.channel.publish(mobiletv.pubsub.topic.OVERLAY, true);
};


/**
 * This method is to be called when a payment is to be required for playing
 *  the stream.
 * @protected
 */
mobiletv.Main.prototype.attemptPlayback = function() {
  if (!goog.isNull(this.jsonp_)) {
    this.jsonp_.cancel(this.jsonpKey_);
  }

  if (!goog.isNull(this.result_) &&
      this.result_.getState() == goog.result.Result.State.PENDING) {

    this.result_.setValue(-1);
  }

  if (this.data.getCurrent().getProp(smstb.ds.Record.Property.COST) > 0) {

    this.result_ = new goog.result.SimpleResult();
    this.result_.wait(this.handlePriceValue_, this);

    this.jsonp_ = new goog.net.Jsonp(this.data.getCurrent()
        .getProp(smstb.ds.Record.Property.PLAYURL) +
        mobiletv.Main.GET_CURRENT_PRICE);

    this.jsonpKey_ = this.jsonp_.send(null, goog.bind(function(response) {
      this.result_.setValue(response);
    }, this));

  } else {
    this.startPlayback();
  }
};


/**
 * Starts the playback.
 * @protected
 */
mobiletv.Main.prototype.startPlayback = function() {
  mobiletv.Player.getInstance().setModel(this.data.getCurrent());
  if (this.isAdnroid_) {
    pstj.error.throwError(pstj.error.ErrorHandler.Error.RUNTIME, 10000,
        mobiletv.strings.get(mobiletv.strings.Symbol.ANDROID_PLAYER));
  }
};
