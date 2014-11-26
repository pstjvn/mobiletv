/**
 * @fileoverview Provides global access to the player to allow both UI and
 * scheduler to access the playback.
 *
 * @author regardingscot@gmail.com (PeterStJ)
 */

goog.provide('mobiletv.Player');

goog.require('smstb.widget.TVPlayer');

goog.scope(function() {


/**
 * Implements the mobileTV customized player. Supports casting.
 */
mobiletv.Player = goog.defineClass(smstb.widget.TVPlayer, {
  /**
   * @constructor
   * @extends {smstb.widget.TVPlayer}
   * @suppress {checkStructDictInheritance}
   */
  constructor: function() {
    goog.base(this);
  }

});
goog.addSingletonGetter(mobiletv.Player);

});  // goog.scope
