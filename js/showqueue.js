/**
 * @fileoverview For the EPG queue a list that is always guaranteed to be
 * ordered was needed (all shows has to be ordered by time stamp in the queue),
 * this is a probable implementation for this requirement and is built on top of
 * the default data structure 'list'.
 *
 * @author regardingscot@gmail.com (PeterStJ)
 */

goog.provide('mobiletv.ShowQueue');

goog.require('goog.array');
goog.require('pstj.ds.List');



/**
 * Provides indexed list implementation that always keep the items in order,
 * Order is kept based on the ID value.
 *
 * @constructor
 * @extends {pstj.ds.List}
 * @param {Array.<pstj.ds.ListItem>|Array.<Object>=} opt_nodes Optionally,
 * array of list items to initialize the list with or array of literal
 * record objects to convert to list items.
 */
mobiletv.ShowQueue = function(opt_nodes) {
  goog.base(this, opt_nodes);
};
goog.inherits(mobiletv.ShowQueue, pstj.ds.List);


/**
 * Overrides the default behaviour and instead inserts the new node always in
 * the order based on the id of the node.
 * @param {!pstj.ds.ListItem} node The node to add to the list.
 */
mobiletv.ShowQueue.prototype.add = function(node) {
  var id = node.getId();
  var i = 0;
  var len = this.getCount();

  for (; i < len; i++) {
    if (id < this.getByIndex(i)) {
      break;
    }
  }

  if (i >= len) {
    goog.base(this, 'add', node);
  } else if (i == 0) {
    goog.base(this, 'add', node, true);
  } else {
    goog.array.insertAt(this.list, node, i);
    this.map[node.getId()] = node;
    len++;
    i++;
    for (; i < len; i++) {
      this.indexMap[this.getByIndex(i).getId()]++;
    }
  }
};
