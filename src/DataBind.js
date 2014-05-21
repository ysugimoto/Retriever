function DataBind() {
    if ( DataBind.rootNode === null ) {
        DataBind.setRoot();
    }
}

DataBind.setRoot = function(_doc) {
    var root = _doc || document;

    DataBind.factory(root);

    ['change', 'click', 'focus', 'blur'].forEach(function(type) {
        root.addEventListener(type, DataBind.handleEvent);
    });

    DataBind.rootNode = root;
};

DataBind.factory = function(rootNode) {
    var nodes = rootNode.querySelectorAll('[data-bind-name]'),
        size  = nodes.length,
        i     = 0,
        views = [];

    for ( ; i < size; ++i ) {
        views.push(DataBind.View.make(nodes[i]));
    }

    views.forEach(function(view) {
        if ( ! DataBind.exists(view.node) ) {
            DataBind.addView(view.getSignature(), view);
        }
    });

    console.log(DataBind.viewFactory);
    DataBind.filter();
    console.log(DataBind.viewFactory);
};

DataBind.filter = function() {
    Object.keys(DataBind.viewFactory.signatures).forEach(function(signature) {
        var list = DataBind.viewFactory.signatures[signature],
            size = list.length,
            i    = 0,
            update = [];

        for ( ; i < size; ++i ) {
            if ( list[i].node.parentNode !== null ) {
                update[update.length] = list[i];
            }
        }

        DataBind.viewFactory.signatures[signature] = update;
    });

    var ids  = DataBind.viewFactory.ids,
        size = ids.length,
        i    = 1;

    for ( ; i < size; ++i ) {
        if ( ids[i].node.parentNode == null ) {
            ids[i] = null;
        }
    }

    DataBind.viewFactory.ids = ids;
};


DataBind.subscribers = {};
DataBind.viewFactory = {signatures: {}, ids: []};
DataBind.viewID      = 0;
DataBind.rootNode    = null;

DataBind.pubsubID    = 0;

DataBind.publish = function(signature, data) {
    DataBind.pubsubID++;

    Object.keys(this.subscribers).forEach(function(name) {
        if ( signature[0] === name || signature[0] === '*' ) {
            DataBind.subscribers[name].update(signature[1], data);
        }
    });
};

DataBind.subscribe = function(model) {
    DataBind.subscribers[model.getName()] = model;
};

DataBind.unsubscribe = function(name) {
    if ( name in DataBind.subscribers ) {
        delete DataBind.subscribers[name];
    }
};

DataBind.handleEvent = function(evt) {
    var node = evt.target,
        type,
        id,
        view;

    if ( node.nodeType !== 1 ) {
        node = node.parentNode;
    }

    while ( node && node !== document ) {
        type = node.getAttribute('data-bind-event');
        id   = node.__rtvid;

        if ( id && type && type.indexOf(evt.type) !== -1 && null !== (view = DataBind.getViewByID(id)) ) {
            break;
        }
        node = node.parentNode;
    }

    if ( view ) {
        DataBind.publish(view.signature, node.value || node.innerHTML);
    }
};

DataBind.addView = function(signature, view) {
    if ( ! (signature in DataBind.viewFactory.signatures) ) {
        DataBind.viewFactory.signatures[signature] = [];
    }
    DataBind.viewFactory.signatures[signature].push(view);
    DataBind.viewFactory.ids[view.id] = view;
};

DataBind.getView = function(signature) {
    return DataBind.viewFactory.signatures[signature] || [];
};

DataBind.exists = function(node) {
    var views = DataBind.viewFactory.ids,
        size  = views.length,
        i     = 1;

    for ( ; i < size; ++i ) {
        if ( ! views[i] ) {
            continue;
        }
        if ( views[i].node === node ) {
            return true;
        }
    }

    return false;
};

DataBind.getViewByID = function(id) {
    return DataBind.viewFactory.ids[id] || null;
}

//= require_tree databind-class
