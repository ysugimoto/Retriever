//= if node
var DataBind = require('../DataBind');
//= end

DataBind.Observer.Primitive = DataBind_Observer_Primitive;

DataBind_Observer_Primitive.prototype = new DataBind.Observer();

function DataBind_Observer_Primitive(value) {
    this.data = value;
    DataBind.Observer.call(this);
}

DataBind_Observer_Primitive.prototype.initialize = function(modelName, propName, model) {
    this.signature = [modelName, propName];
    this.model     = model;
};
