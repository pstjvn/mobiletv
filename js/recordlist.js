/**
 * @fileoverview Provides the multi view wrapper for the record list.
 *
 * @author regardingscot@gmail.com (Peter StJ)
 */

goog.provide('mobiletv.RecordList');

goog.require('pstj.widget.MultiViewWrapper');



/**
 * Wrap the record list to be a multi view component.
 *
 * @constructor
 * @extends {pstj.widget.MultiViewWrapper}
 */
mobiletv.RecordList = function() {
  goog.base(this);
};
goog.inherits(mobiletv.RecordList, pstj.widget.MultiViewWrapper);
