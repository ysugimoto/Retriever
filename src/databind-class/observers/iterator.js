//= if node
var DataBind = require('../DataBind');
//= end

DataBind.Observer.Iterator = DataBind_Observer_Iterator;

DataBind_Observer_Iterator.prototype = new DataBind.Observer();

function DataBind_Observer_Iterator(data) {
    this.data = data;

    this.index  = 0;
    this.length = this.data.length || 0;
}

DataBind_Observer_Iterator.prototype.initialize = function(modelName, propName, model) {
    this.signature = [modelName, propName];
    this.model     = model;

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

DataBind_Observer_Iterator.prototype.push = function() {
    if ( this.data instanceof Array ) {
        Array.prototype.push.apply(this.data, arguments);
        this.length = this.data.length;
    } else {
        this.data[arguments[0]] = arguments[1];
    }

    this.each(this.data);
};

DataBind_Observer_Iterator.prototype.unshift = function() {
    if ( this.data instanceof Array ) {
        Array.prototype.unshift.apply(this.data, arguments);
        this.length = this.data.length;
    } else {
        this.data[arguments[0]] = arguments[1];
    }

    this.each(this.data);
};

DataBind_Observer_Iterator.prototype.pop = function() {
    if ( this.data instanceof Array ) {
        this.data.pop();
        this.length = this.data.length;
    } else if ( arguments.length > 0 ) {
        delete this.data[arguments[0]];
    }

    this.each(this.data);
};

DataBind_Observer_Iterator.prototype.shift = function() {
    if ( this.data instanceof Array ) {
        this.data.shift();
        this.length = this.data.length;
    } else if ( arguments.length > 0 ) {
        delete this.data[arguments[0]];
    }

    this.each(this.data);
};

DataBind_Observer_Iterator.prototype.each = function(iterator) {

    this.getChainViews(this.signature[0], this.signature[1]).forEach(function(view) {
        if ( view.template !== null ) {
            view.addSubView(iterator);
        }
        if ( view.expression !== null ) {
            view.expression();
        }
    });
};
