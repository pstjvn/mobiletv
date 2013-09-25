/**
 * @fileoverview Provides global access to the player to allow both UI and
 * scheduler to access the playback.
 *
 * @author regardingscot@gmail.com (PeterStJ)
 */

goog.provide('mobiletv.Player');

goog.require('smstb.widget.TVPlayer');



/**
 * @constructor
 * @extends {smstb.widget.TVPlayer}
 */
mobiletv.Player = function() {
  goog.base(this);
};
goog.inherits(mobiletv.Player, smstb.widget.TVPlayer);
goog.addSingletonGetter(mobiletv.Player);
