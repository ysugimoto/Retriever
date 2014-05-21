//= if node
var DataBind = require('../DataBind');
//= end

DataBind.Observer.Computed = DataBind_Observer_Computed;

DataBind_Observer_Computed.prototype = new DataBind.Observer();

function DataBind_Observer_Computed() {
    this.func  = arguments[2];
    this.model = arguments[3];

    this.initialize(arguments[0], arguments[1]);
}

DataBind_Observer_Computed.prototype.set = function() {
    var data = this.func.call(this.model);

    if ( data !== void 0 ) {
        this.data = data;

        DataBind.publish(this.signature, data);
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
