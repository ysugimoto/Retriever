//= if node
var DataBind = require('../DataBind');
//= end

DataBind.Observer = DataBind_Observer;

function DataBind_Observer() {}

DataBind_Observer.prototype.initialize = function(modelName, propName, model) {
    this.signature = [modelName, propName];
    this.model     = model;
    this.bindModel = null;
}

DataBind_Observer.prototype.attachViews = function(name, model) {
    var nodes = document.querySelectorAll('[data-bind-name="' + name + '"]'),
        size  = nodes.length,
        i     = 0;

    this.bindViews = [];
    for ( ; i < size; ++i ) {
        this.bindViews.push(DataBind.View.make(nodes[i], model));
    }
};

DataBind_Observer.prototype.get = function() {
    return this.data;
};

DataBind_Observer.prototype.set = function(data) {
    if ( this.type && typeof data !== this.type ) {
        throw new Error('TypeError: Observe value must be a ' + this.type);
    }
    this.data = data;

    //DataBind.publish(this.signature, data, this.bindModel);
    DataBind.pubsubID++;
    this.chainView();
};

DataBind_Observer.prototype.update = function(data) {
    if ( this.type && typeof data !== this.type ) {
        throw new Error('TypeError: Observe value must be a ' + this.type);
    }
    this.data = data;
};

DataBind_Observer.prototype.chainView = function() {
    var data = this.get();

    this.bindViews.forEach(function(view) {
        if ( 'value' in view.node ) {
            view.node.value = data;
        } else {
            view.node.innerHTML = data;
        }
        if ( typeof view.expression === 'function' ) {
            view.expression();
        }
        if ( view.bindModel ) {
            view.bindModel.update();
        }
    });
};

//= require_tree databind-class/observers

