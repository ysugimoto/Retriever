//= if node
var DataBind = require('../DataBind');
var EventInterface = require('../event');
//= end

DataBind.Observer = DataBind_Observer;

function DataBind_Observer() {}

DataBind_Observer.prototype = new EventInterface();

DataBind_Observer.prototype.initialize = function(modelName, propName, model) {
    this.signature = [modelName, propName];
    this.model     = model;
    this.bindModel = null;

    EventInterface.call(this);

    var that = this;

    this.__updated = false;
    this.bindViews = [];

    this.on('update', function() {
        that.__updated = true;
    });

    DataBind.Event.on('updatefinish', function() {
        that.__updated = false;
    });
};

DataBind_Observer.prototype.attachViews = function(name, model, root) {
    var nodes = (root || document).querySelectorAll('[data-bind-name="' + name + '"]'),
        size  = nodes.length,
        i     = 0,
        view;

    this.bindViews = [];
    for ( ; i < size; ++i ) {
        view = DataBind.View.make(nodes[i], model);
        this.bindViews.push(view);
        view.bindModel = model;
    }
};

DataBind_Observer.prototype.get = function() {
    return this.data;
};

DataBind_Observer.prototype.set = function(data) {
    if ( data !== void 0 && this.type && typeof data !== this.type ) {
        throw new Error('TypeError: Observe value must be a ' + this.type);
    }

    DataBind.pubsubID++;
    this.data = data;

    this.chainView();
    DataBind.pubsubID--;
};

DataBind_Observer.prototype.update = function(data) {
    if ( data !== void 0 && this.type && typeof data !== this.type ) {
        throw new Error('TypeError: Observe value must be a ' + this.type);
    }
    this.data = data;
};

DataBind_Observer.prototype.chainView = function() {
    if ( this.__updated === true && DataBind.pubsubID === 1 ) {
        return;
    }
    this.__updated = true;

    var data = this.get();

    this.bindViews.forEach(function(view) {
        if ( typeof view.valueMode === 'function' ) {
            view.valueMode(data);
        } else {
            view.node[view.valueMode] = data;
        }

        if ( typeof view.expression === 'function' ) {
            view.expression(view.bindModel);
        }
        if ( view.bindModel ) {
            view.bindModel.bindUpdate();
        }
    });
};

//= require_tree databind-class/observers

