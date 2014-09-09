//= if node
var DataBind = require('../DataBind');
//= end

DataBind.Observer.Array = DataBind_Observer_Array;

DataBind_Observer_Array.prototype = new DataBind.Observer();

function DataBind_Observer_Array(data) {
    this.data = data;

    this.index  = 0;
    this.length = this.data.length || 0;
}

DataBind_Observer_Array.prototype.initialize = function(modelName, propName, model) {
    DataBind.Observer.prototype.initialize.call(this);
    this.signature = [modelName, propName];
    this.bindModel = model;
};

DataBind_Observer_Array.prototype.get = function() {
    return this.data[this.index];
};

DataBind_Observer_Array.prototype.getAll = function() {
    return this.data;
};

DataBind_Observer_Array.prototype.set = function(index) {
    this.index = index;

    this.trigger('update');
    DataBind.pubsubID++;
    this.chainView();
    DataBind.pubsubID--;
};

DataBind_Observer_Array.prototype.update = function(index) {
    this.index = index;
};

DataBind_Observer_Array.prototype.push = function() {
    Array.prototype.push.apply(this.data, arguments);
    this.length = this.data.length;

    this.trigger('update');
    DataBind.pubsubID++;
    this.chainView();
    this.bindModel && this.bindModel.bindUpdate();
    DataBind.pubsubID--;
    return this.length;
};

DataBind_Observer_Array.prototype.unshift = function(value) {
    var update = [];

    this.data.forEach(function(data, index) {
        update[update.index] = index + 1;
    });

    this.data.unshift(value);
    this.length = this.data.length;

    this.trigger('update');
    DataBind.pubsubID++;
    this.removeView([], update);
    DataBind.pubsubID--;

    return this;
};

DataBind_Observer_Array.prototype.pop = function() {
    var pop = this.data.pop(),
        removed = [this.data.length + 1],
        update = [];

    this.length = this.data.length;

    this.trigger('update');
    DataBind.pubsubID++;
    this.removeView(removed, update);
    DataBind.pubsubID--;

    return pop;
};

DataBind_Observer_Array.prototype.shift = function() {
    var shift = this.data.shift(),
        removed = [0],
        update = [];

    this.data.forEach(function(data, index) {
        update[update.length] = index + 1;
    });

    this.length = this.data.length;

    this.trigger('update');
    DataBind.pubsubID++;
    this.removeView(removed, update);
    DataBind.pubsubID--;

    return shift;
};

DataBind_Observer_Array.prototype.forEach = function(callback) {
    var data = this.data;

    data.forEach(callback);
    this.length = data.length;
};

DataBind_Observer_Array.prototype.map = function(callback) {
    var data = this.data;

    this.data   = data.map(callback);
    this.length = data.length;

    this.chainView();
    return this.data;
};

DataBind_Observer_Array.prototype.filter = function(callback) {
    var data = this.data,
        filtered = [],
        removed  = [],
        update   = [];

    data.forEach(function(dat, index) {
        if ( callback(dat, index) === false ) {
            removed[removed.length] = index;
        } else {
            update[update.length]     = index;
            filtered[filtered.length] = dat;
        }
    });

    this.data   = filtered;
    this.length = filtered.length;

    this.trigger('update');
    DataBind.pubsubID++;
    this.removeView(removed, update);
    DataBind.pubsubID--;

    return this;
};

DataBind_Observer_Array.prototype.removeView = function(removedIndex, updateIndex) {
    if ( this.__updated === true && DataBind.pubsubID === 1) {
        return;
    }
    this.__updated = true;

    this.bindViews && this.bindViews.forEach(function(view) {
        removedIndex.forEach(function(index) {
            view.removeSubView(index);
        });

        view.updateSubViewIndex(updateIndex);

        if ( view.expression !== null ) {
            view.expression(view.bindModel);
        }
        if ( view.bindModel ) {
            view.bindModel.bindUpdate();
        }
    });
};

DataBind_Observer_Array.prototype.chainView = function() {
    if ( this.__updated === true && DataBind.pubsubID === 1) {
        return;
    }
    this.__updated = true;

    var iterator = this.getAll();

    this.bindViews && this.bindViews.forEach(function(view) {
        if ( view.template !== null ) {
            iterator.forEach(function(dat, index) {
                view.addSubView(dat, index);
            });
        }
        if ( view.expression !== null ) {
            view.expression(view.bindModel);
        }
        if ( view.bindModel ) {
            view.bindModel.bindUpdate();
        }
    });
};
