//= if node
var DataBind = require('../DataBind');
//= end

DataBind.Observer.Object = DataBind_Observer_Object;

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

    this.trigger('update');
    DataBind.pubsubID++;
    this.chainView();
    DataBind.pubsubID--;
};

DataBind_Observer_Object.prototype.update = function(key) {
    this.key = key;
};

DataBind_Observer_Object.prototype.add = function(key, value) {
    this.data[key] = value;

    this.trigger('update');
    DataBind.pubsubID++;
    this.chainView();
    this.bindModel && this.bindModel.bindUpdate();
    DataBind.pubsubID--;
};

DataBind_Observer_Object.prototype.remove = function(key) {
    if ( key in this.data ) {
        delete this.data[key];
    }

    this.trigger('update');
    DataBind.pubsubID++;
    this.chainView();
    DataBind.pubsubID--;
};

DataBind_Observer_Object.prototype.each = function(callback) {
    var data = this.data;

    Object.keys.forEach(function(key) {
        callback.apply(data, [data[key], key]);
    });
    this.data = data;

    this.trigger('update');
    DataBind.pubsubID++;
    this.chainView();
    DataBind.pubsubID--;
};

DataBind_Observer_Object.prototype.map = function(callback) {
    var data = this.data;

    Object.keys.foreach(function(key) {
        data[key] = callback.apply(data, [data[key], key]);
    });
    this.data = data;

    this.trigger('update');
    DataBind.pubsubID++;
    this.chainView();
    DataBind.pubsubID--;
};

DataBind_Observer_Object.prototype.filter = function(callback) {
    var data = this.data,
        removed = [];

    Object.keys.foreach(function(key) {
        if ( callback.apply(data, [data[key], key]) === false ) {
            delete data[key];
            removed[removed.length] = key;
        }
    });
    this.data = data;

    this.trigger('update');
    DataBind.pubsubID++;
    this.removeView(removed);
    DataBind.pubsubID--;
};

DataBind_Observer_Object.prototype.removeView = function(removedIndex) {
    if ( this.__updated === true && DataBind.pubsubID === 1) {
        return;
    }
    this.__updated = true;

    this.bindViews && this.bindViews.forEach(function(view) {
        removedIndex.forEach(function(index) {
            view.removeSubView(index);
        });

        if ( view.expression !== null ) {
            view.expression(view.bindModel);
        }
        if ( view.bindModel ) {
            view.bindModel.bindUpdate();
        }
    });
};

DataBind_Observer_Object.prototype.chainView = function() {
    if ( this.__updated === true ) {
        return;
    }
    this.__updated = true;
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
        if ( view.bindModel ) {
            view.bindModel.bindUpdate();
        }
    });
};
