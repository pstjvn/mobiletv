goog.provide('test');

goog.require('pstj.ds.List');
goog.require('pstj.ui.ScrollView');

var data = [];
for (var i = 0; i < 15; i++) {
  data.push({id: i});
}

var list = new pstj.ds.List(data);

test = function() {
  var c = new pstj.ui.ScrollView();
  c.setModel(list);
  c.decorate(document.querySelector('.main'));
  c.generateCells();
};

test();
