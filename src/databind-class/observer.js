//= if node
var DataBind = require('../DataBind');
//= end

DataBind.Observer = DataBind_Observer;

function DataBind_Observer() {}

DataBind_Observer.prototype.initialize = function(modelName, propName, defaultData) {
    this.data      = defaultData;
    this.keep      = defaultData;
    this.signature = [modelName, propName];
}

DataBind_Observer.prototype.getChainViews = function(model, prop) {
    var modelViews  = DataBind.getView(model + '.' + prop),
        globalViews = DataBind.getView('*.' + prop);

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

    this.getChainViews(sig[0], sig[1]).forEach(function(view) {
        if ( 'value' in view.node ) {
            view.node.value = data;
        } else {
            view.node.innerHTML = data;
        }
    });
};

//= require_tree databind-class/observers

