function DataBind(_doc) {
    if ( DataBind.intialized === true ) {
        return;
    }

    var doc   = _doc || document,
        nodes = doc.querySelectorAll('[data-bind-name]'),
        size  = nodes.length,
        i     = 0,
        views = [],
        view,
        parentView;

    for ( ; i < size; ++i ) {
        views.push(DataBind.View.make(nodes[i]));
    }

    views.forEach(function(view) {
        DataBind.addView(view.getSignature(), view);
    });

    DataBind.initalized = true;
};

DataBind.subscribers = {};
DataBind.viewFactory = {};
DataBind.initalized  = false;

DataBind.pubsubID    = 0;

DataBind.publish = function(signature, data) {
    DataBind.pubsubID++;

    Object.keys(this.subscribers).forEach(function(name) {
        if ( signature[0] === name || signature[0] === '*' ) {
            DataBind.subscribers[name].update(signature[1], data);
        }
    });
};

DataBind.subscribe = function(name, model) {
    DataBind.subscribers[name] = model;
};

DataBind.unsubscribe = function(name) {
    if ( name in DataBind.subscribers ) {
        delete DataBind.subscribers[name];
    }
};


DataBind.addView = function(signature, view) {
    if ( ! (signature in DataBind.viewFactory) ) {
        DataBind.viewFactory[signature] = [];
    }
    DataBind.viewFactory[signature].push(view);
};

DataBind.getView = function(signature) {
    return DataBind.viewFactory[signature] || [];
};

//= require_tree databind-class
