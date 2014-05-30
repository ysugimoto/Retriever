//= if node
var DataBind = require('../DataBind');
//= end

DataBind.Observer.Computed = DataBind_Observer_Computed;

DataBind_Observer_Computed.prototype = new DataBind.Observer();

function DataBind_Observer_Computed(fn) {
    this.func = fn;
}

DataBind_Observer_Computed.prototype.initialize = function(modelName, propName, model) {
    DataBind.Observer.prototype.initialize.call(this);
    this.signature = [modelName, propName];
    this.model     = model;
};

DataBind_Observer_Computed.prototype.get = function() {
    return this.func.call(this.model);
};

DataBind_Observer_Computed.prototype.call = function() {
    this.set();
};

DataBind_Observer_Computed.prototype.set =
DataBind_Observer_Computed.prototype.update = function() {
    var data = this.func.call(this.model);

    if ( data !== void 0 ) {
        this.data = data;

        DataBind.pubsubID++;
        this.chainView(data);
        DataBind.pubsubID--;
    }
};

DataBind_Observer_Computed.prototype.chainView = function() {
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
    });
};
