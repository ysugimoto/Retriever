//= if node
var DataBind = require('../../DataBind');
//= end

var DataBind_View_Select = DataBind.View.extend({
    valueMode: 'value'
});

DataBind.View.Select = DataBind_View_Select;

DataBind_View_Select.prototype.addSubView = function(iterator) {
    var node = this.node,
        option;

    while ( node.firstChild ) {
        node.removeChild(node.firstChild);
    }

    if ( iterator instanceof Array ) {
        iterator.forEach(function(value, index) {
            option = document.createElement('option');
            option.value = index;
            option.appendChild(document.createTextNode(value));
            node.appendChild(option);
        });
    } else {
        Object.keys(iterator).forEach(function(key) {
            option = document.createElement('option');
            option.value = key;
            option.appendChild(document.createTextNode(iterator[key]));
            node.appendChild(option);
        });
    }
};

