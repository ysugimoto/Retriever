//= if node
var DataBind = require('../DataBind');
//= end

DataBind.Observer.Iterator = DataBind_Observer_Iterator;

DataBind_Observer_Iterator.prototype = new DataBind.Observer();

function DataBind_Observer_Iterator() {
    this.initialize.apply(this, arguments);

    this.index = 0;
    this.each(this.data);
}

DataBind_Observer_Iterator.prototype.get = function() {
    return this.data[this.index];
};

DataBind_Observer_Iterator.prototype.set = function(index) {
    this.index = index;

    DataBind.publish(this.signature, index);
};

DataBind_Observer_Iterator.prototype.update = function(index) {
    this.index = index;
    this.chainView(index);
};

DataBind_Observer_Iterator.prototype.append = function() {
    if ( arguments.length > 1 ) {
        this.data[arguments[0]] = arguments[1];
    } else {
        this.data.push(arguments[0]);
    }

    this.each(this.data);
};

DataBind_Observer_Iterator.prototype.each = function(iterator) {

    this.getChainViews(this.signature[0], this.signature[1]).forEach(function(view) {
        view.addSubView(iterator);
    });
};
