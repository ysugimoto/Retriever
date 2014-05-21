//= if node
var DataBind = require('../DataBind');
//= end

DataBind.Observer.Array = DataBind_Observer_Array;

DataBind_Observer_Array.prototype = new DataBind.Observer();

function DataBind_Observer_Array() {
    this.initialize.apply(this, arguments);

    this.each(this.data);
}

DataBind_Observer_Array.prototype.each = function(list) {

    this.getChainViews(this.signature[0], this.signature[1]).forEach(function(view) {
        var node = view.getNode();

        while ( node.firstChild ) {
            node.removeChild(node.firstChild);
        }

        list.forEach(function(value, index) {
            var option = document.createElement('option');

            option.value     = index;
            option.innerText = value;

            node.appendChild(option);
        });
    });
};
