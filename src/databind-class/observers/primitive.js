//= if node
var DataBind = require('../DataBind');
//= end

DataBind.Observer.Primitive = DataBind_Observer_Primitive;

DataBind_Observer_Primitive.prototype = new DataBind.Observer();

function DataBind_Observer_Primitive() {
    this.initialize.apply(this, arguments);

    this.update(this.data);
}
