//= if node
var DataBind = require('../DataBind');
//= end

DataBind.View  = DataBind_View;

function DataBind_View(node) {
    var eventName = node.getAttribute('data-bind-event');

    this.node      = node;
    this.eventName = eventName || 'change';
    this.eventOnly = !!eventName;
    this.signature = node.getAttribute('data-bind-name').split('.');

    this.node.__rtvid = ++DataBind_View.idx;

    this.initialize();
}

DataBind_View.idx = 0;

DataBind_View.make = function(node) {
    return new DataBind_View(node);
};

DataBind_View.prototype.initialize = function() {
    if ( this.signature.length === 1 ) {
        this.signature.unshift('*');
    }

    this.node.addEventListener(this.eventName, this);
}

DataBind_View.prototype.getNode = function() {
    return this.node;
};

DataBind_View.prototype.getSignature = function() {
    return this.signature.join('.');
};

DataBind_View.prototype.isEventHandler = function() {
    return this.eventOnly;
};

DataBind_View.prototype.handleEvent = function(evt) {
    DataBind.publish(this.signature, this.node.value || this.node.innerHTML);
};
