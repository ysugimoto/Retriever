//= if node
var DataBind = require('../DataBind');
//= end

DataBind.Observer.Object = DataBind_Observer_Iterator;

DataBind_Observer_Object.prototype = new DataBind.Observer();

function DataBind_Observer_Object(data) {
    this.data = data;
    this.key  = 0;
}

DataBind_Observer_Object.prototype.initialize = function(modelName, propName) {
    DataBind.Observer.prototype.initialize.call(this);
    this.signature = [modelName, propName];
}

DataBind_Observer_Object.prototype.get = function() {
    return this.data[this.key];
};

DataBind_Observer_Object.prototype.getAll = function() {
    return this.data;
};

DataBind_Observer_Object.prototype.set = function(key) {
    this.key = key;

    DataBind.pubsubID++;
    this.chainView();
};

DataBind_Observer_Object.prototype.update = function(key) {
    this.key = key;
};

DataBind_Observer_Object.prototype.add = function(key, value) {
    this.data[key] = value;

    this.chainView();
};

DataBind_Observer_Object.prototype.remove = function(key) {
    if ( key in this.data ) {
        delete this.data[key];
    }

    this.chainView();
};

DataBind_Observer_Object.prototype.each = function(callback) {
    var data = this.data;

    Object.keys.forEach(function(key) {
        callback.apply(data, [data[key], key]);
    });
    this.data = data;

    this.chainView();
};

DataBind_Observer_Object.prototype.map = function(callback) {
    var data = this.data;

    Object.keys.foreach(function(key) {
        data[key] = callback.apply(data, [data[key], key]);
    });
    this.data = data;

    this.chainView();
};

DataBind_Observer_Object.prototype.filter = function(callback) {
    var data = this.data;

    Object.keys.foreach(function(key) {
        if ( callback.apply(data, [data[key], key]) === false ) {
            delete data[key];
        }
    });
    this.data = data;

    this.chainView();
};

DataBind_Observer_Object.prototype.chainView = function() {
    var iterator = this.getAll();

    this.bindViews.forEach(function(view) {
        if ( view.template !== null ) {
            Object.keys(iterator).forEach(function(key) {
                view.addSubView(iterator[key], key);
            });
        }
        if ( view.expression !== null ) {
            view.expression();
        }
        //if ( view.bindModel ) {
        //    view.bindModel.update();
        //}
    });
};
