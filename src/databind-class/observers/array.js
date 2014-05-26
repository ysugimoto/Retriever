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
    this.signature = [modelName, propName];
}

DataBind_Observer_Array.prototype.get = function() {
    return this.data[this.index];
};

DataBind_Observer_Array.prototype.getAll = function() {
    return this.data;
};

DataBind_Observer_Array.prototype.set = function(index) {
    this.index = index;

    DataBind.pubsubID++;
    this.chainView();
};

DataBind_Observer_Array.prototype.update = function(index) {
    this.index = index;
};

DataBind_Observer_Array.prototype.push = function() {
    Array.prototype.push.apply(this.data, arguments);
    this.length = this.data.length;

    this.chainView();
    return this.length;
};

DataBind_Observer_Array.prototype.unshift = function() {
    Array.prototype.unshift.apply(this.data, arguments);
    this.length = this.data.length;

    this.chainView();
};

DataBind_Observer_Array.prototype.pop = function() {
    var pop = this.data.pop();

    this.length = this.data.length;

    this.chainView();
    return pop;
};

DataBind_Observer_Array.prototype.shift = function() {
    var shift = this.data.shift();

    this.length = this.data.length;
    this.chainView();

    return shift;
};

DataBind_Observer_Array.prototype.forEach = function(callback) {
    var data = this.data;

    data.forEach(callback);
    this.length = data.length;

    this.chainView();
};

DataBind_Observer_Array.prototype.map = function(callback) {
    var data = this.data;

    this.data   = data.map(callback);
    this.length = data.length;

    this.chainView();
    return this.data;
};

DataBind_Observer_Array.prototype.filter = function(callback) {
    var data = this.data;

    this.data   = data.filter(callback);
    this.length = data.length;

    this.chainView();
    return this.data;
};

DataBind_Observer_Array.prototype.chainView = function() {
    var iterator = this.getAll();

    this.bindViews.forEach(function(view) {
        if ( view.template !== null ) {
            view.addSubView(iterator);
        }
        if ( view.expression !== null ) {
            view.expression();
        }
        if ( view.bindModel ) {
            view.bindModel.update();
        }
    });
};