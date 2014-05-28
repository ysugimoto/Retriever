//= if node
var DataBind = require('../../DataBind');
//= end

var DataBind_View_Input = DataBind.View.extend({
    valueMode: 'value'
});

DataBind.View.Input = DataBind_View_Input;

DataBind_View_Input.prototype.handleEvent = function(evt) {
    if ( this.eventName === 'keyenter' ) {
        if ( evt.keyCode == 13 ) {
            return true;
        }
        return false;
    }
    return (',' + this.eventName + ',').indexOf(',' + evt.type + ',') !== -1;
};
