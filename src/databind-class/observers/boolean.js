//= if node
var DataBind = require('../DataBind');
//= end

DataBind.Observer.Boolean = DataBind_Observer_Boolean;

DataBind_Observer_Boolean.prototype = new DataBind.Observer();

function DataBind_Observer_Boolean(value) {
    this.type = 'boolean';
    this.data = value;
}

DataBind_Observer_Boolean.prototype.initialize = function(modelName, propName) {
    this.signature = [modelName, propName];
    DataBind.Observer.prototype.initialize.call(this);
};
