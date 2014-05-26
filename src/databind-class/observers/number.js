//= if node
var DataBind = require('../DataBind');
//= end

DataBind.Observer.Number = DataBind_Observer_Primitive;

DataBind_Observer_Number.prototype = new DataBind.Observer();

function DataBind_Observer_Number(value) {
    this.type = 'number';
    this.data = value;
}

DataBind_Observer_Number.prototype.initialize = function(modelName, propName, model) {
    this.signature = [modelName, propName];
    this.model     = model;
};
