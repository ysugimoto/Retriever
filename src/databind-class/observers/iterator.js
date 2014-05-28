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
}

DataBind_Observer_Iterator.prototype.get = function() {
    return this.data[this.index];
};

DataBind_Observer_Iterator.prototype.getAll = function() {
    return this.data;
};

DataBind_Observer_Iterator.prototype.set = function(index) {
    this.index = index;

    DataBind.pubsubID++;
    this.chainView();
};

DataBind_Observer_Iterator.prototype.update = function(index) {
    this.index = index;
};

DataBind_Observer_Iterator.prototype.push = function() {
    if ( this.data instanceof Array ) {
        Array.prototype.push.apply(this.data, arguments);
        this.length = this.data.length;
    } else {
        this.data[arguments[0]] = arguments[1];
    }

    this.chainView();
};

DataBind_Observer_Iterator.prototype.unshift = function() {
    if ( this.data instanceof Array ) {
        Array.prototype.unshift.apply(this.data, arguments);
        this.length = this.data.length;
    } else {
        this.data[arguments[0]] = arguments[1];
    }

    this.chainView();
};

DataBind_Observer_Iterator.prototype.pop = function() {
    if ( this.data instanceof Array ) {
        this.data.pop();
        this.length = this.data.length;
    } else if ( arguments.length > 0 ) {
        delete this.data[arguments[0]];
    }

    this.chainView();
};

DataBind_Observer_Iterator.prototype.shift = function() {
    if ( this.data instanceof Array ) {
        this.data.shift();
        this.length = this.data.length;
    } else if ( arguments.length > 0 ) {
        delete this.data[arguments[0]];
    }

    this.chainView();
};

DataBind_Observer_Iterator.prototype.forEach = function(callback) {
    var data = this.data;

    if (data instanceof Array ) {
        data.forEach(callback);
        this.length = data.length;
    } else {

        Object.keys.forEach(function(key) {
            callback.apply(data, [data[key], key]);
        });
    }

    this.chainView();
};

DataBind_Observer_Iterator.prototype.map = function(callback) {
    var data = this.data;

    if (data instanceof Array ) {
        this.data   = data.map(callback);
        this.length = data.length;
    } else {

        Object.keys.foreach(function(key) {
            data[key] = callback.apply(data, [data[key], key]);
        });
        this.data = data;
    }

    this.chainView();
};

DataBind_Observer_Iterator.prototype.filter = function(callback) {
    var data = this.data;

    if (data instanceof Array ) {
        this.data   = data.filter(callback);
        this.length = data.length;
    } else {
        Object.keys.foreach(function(key) {
            if ( callback.apply(data, [data[key], key]) === false ) {
                delete data[key];
            }
        });
        this.data = data;
    }

    this.chainView();
};

DataBind_Observer_Iterator.prototype.chainView = function() {
    var iterator = this.getAll();

    this.bindViews.forEach(function(view) {
        if ( view.template !== null ) {
            view.addSubView(iterator);
        }
        if ( view.expression !== null ) {
            view.expression();
        }
        //if ( view.bindModel ) {
        //    view.bindModel.update();
        //}
    });
}

