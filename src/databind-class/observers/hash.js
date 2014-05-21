//= if node
var DataBind = require('../DataBind');
//= end

DataBind.Observer.Hash = DataBind_Observer_Hash;

DataBind_Observer_Hash.prototype = new DataBind.Observer();

function DataBind_Observer_Hash() {
    this.initialize.apply(this, arguments);
}
