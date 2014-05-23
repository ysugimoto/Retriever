//= if node
var DataBind = require('../DataBind');
//= end

DataBind.Observer = DataBind_Observer;

function DataBind_Observer() {}

DataBind_Observer.prototype.initialize = function(modelName, propName, model) {
    this.signature = [modelName, propName];
    this.model     = model;
}

DataBind_Observer.prototype.getChainViews = function(model, prop) {
    var modelViews  = DataBind.View.get(model + '.' + prop),
        globalViews = DataBind.View.get('*.' + prop);

    return modelViews.concat(globalViews);
};

DataBind_Observer.prototype.get = function() {
    return this.data;
};

DataBind_Observer.prototype.set = function(data) {
    this.data = data;

    DataBind.publish(this.signature, data);
    this.update(data);
};

DataBind_Observer.prototype.update = function(data) {
    var sig = this.signature;

    this.data = data;
    this.keep = data;

    this.chainView(data);
};

DataBind_Observer.prototype.chainView = function(data) {
    this.getChainViews(this.signature[0], this.signature[1]).forEach(function(view) {
        if ( 'value' in view.node ) {
            view.node.value = data;
        } else {
            view.node.innerHTML = data;
        }
        if ( typeof view.expression === 'function' ) {
            view.expression();
        }
    });
};

//= require_tree databind-class/observers

