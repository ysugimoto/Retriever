//= if node
var DataBind = require('../../DataBind');
//= end

var DataBind_View_Textarea = DataBind.View.extend({
    valueMode: 'value'
});

DataBind.View.Textarea = DataBind_View_Textarea;

DataBind_View_Textarea.prototype.handleEvent = function(evt) {
    if ( this.eventType === 'keyenter' ) {
        return evt.keyCode == 13;
    }
    return true;
};
