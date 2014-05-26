(function(head) {
    var style = document.createElement('style');

    style.type = 'text/css';
    style.innerText = '@chatset "UTF-8";[data-bind-show] {display: none !important;}';

    head.insertBefore(style, head.firstChild);
})(document.head || document.getElementsByTagName('head')[0]);

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

DataBind.factory = function(rootNode, bindObject) {
    var nodes = rootNode.querySelectorAll('[data-bind-name]'),
        size  = nodes.length,
        i     = 0;

    for ( ; i < size; ++i ) {
        DataBind.View.make(nodes[i], bindObject);
    }

    DataBind.View.filter();
};

DataBind.subscribers = {};
DataBind.rootNode    = null;
DataBind.pubsubID    = 0;

DataBind.subscribe = function(model) {
    if ( DataBind.Model.prototype.__observe === model.__observe ) {
        DataBind.subscribers[model.getName()] = model;
    }
};

DataBind.listen = (function() {
    var listenEvents = [];

    return function(eventName) {
        if ( listenEvents.indexOf(eventName) !== -1 ) {
            return;
        }

        document.addEventListener(eventName, DataBind.handleEvent);
        listenEvents.push(eventName);
    };
})();

DataBind.observe = function(bindData) {
    if ( bindData instanceof Array || Object.prototype.toString.call(bindData) === '[object Object]' ) {
        return new DataBind.Observer.Iterator(bindData);
    } else if ( typeof bindData === 'function' ) {
        return new DataBind.Observer.Computed(bindData);
    }

    return new DataBind.Observer.Primitive(bindData);
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
        type = ',' + node.getAttribute('data-bind-event') + ',';
        id   = node.__rtvid;

        if ( id && type && type.indexOf(',' + evt.type + ',') !== -1 && null !== (view = DataBind.View.getByID(id)) ) {
            break;
        }
        node = node.parentNode;
    }

    if ( view && view.bindModel ) {
        DataBind.pubsubID++;
        view.bindModel.update(view.name, node.value || node.innerHTML);
    }
};

//= require_tree databind-class

