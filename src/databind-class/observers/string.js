//= if node
var DataBind = require('../DataBind');
//= end

DataBind.Observer.String = DataBind_Observer_String;

DataBind_Observer_String.prototype = new DataBind.Observer();

function DataBind_Observer_String(value) {
    this.type = 'string';
    this.data = value;
}

DataBind_Observer_String.prototype.initialize = function(modelName, propName) {
    DataBind.Observer.prototype.initialize.call(this);
    this.signature = [modelName, propName];
};
