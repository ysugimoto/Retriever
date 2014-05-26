//= if node
var DataBind = require('../DataBind');
//= end

DataBind.Observer.Computed = DataBind_Observer_Computed;

DataBind_Observer_Computed.prototype = new DataBind.Observer();

function DataBind_Observer_Computed(fn) {
    this.func = fn;

}

DataBind_Observer_Computed.prototype.initialize = function(modelName, propName, model) {
    this.signature = [modelName, propName];
    this.model     = model;
};

DataBind_Observer_Computed.prototype.get = function() {
    return this.func.call(this.model);
};

DataBind_Observer_Computed.prototype.set = function() {
    var data = this.func.call(this.model);

    if ( data !== void 0 ) {
        this.data = data;

        DataBind.pubsubID++;
        this.chainView(data);
    }
};

DataBind_Observer_Computed.prototype.update = function() {
    var data = this.func.call(this.model);

    if ( data !== void 0 ) {
        this.data = data;

        this.chainView(data);
    }
};
