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

   // ['change', 'click', 'focus', 'blur'].forEach(function(type) {
   //     root.addEventListener(type, DataBind.handleEvent);
   // });

    DataBind.rootNode = root;
};

DataBind.factory = function(rootNode, bindObject) {
    var nodes = rootNode.querySelectorAll('[data-bind-name]'),
        size  = nodes.length,
        i     = 0,
        view;

    for ( ; i < size; ++i ) {
        view = DataBind.View.make(nodes[i], bindObject);
    }

    DataBind.View.filter();
};

DataBind.subscribers    = {};
DataBind.rootNode       = null;
DataBind.pubsubID       = 0;
DataBind.customEventMap = {
    'keyenter': 'keydown'
};

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

        if ( eventName in DataBind.customEventMap ) {
            eventName = DataBind.customEventMap[eventName];
            console.log(eventName + ' mapped');
        }
        document.addEventListener(eventName, DataBind.handleEvent);
        listenEvents.push(eventName);
    };
})();

DataBind.observe = function(bindData) {
    if ( bindData instanceof Array ) {
        return new DataBind.Observer.Array(bindData);
    } else if ( Object.prototype.toString.call(bindData) === '[object Object]' ) {
        return new DataBind.Observer.Object(bindData);
    } else if ( typeof bindData === 'function' ) {
        return new DataBind.Observer.Computed(bindData);
    } else if ( typeof bindData === 'string' ) {
        return new DataBind.Observer.String(bindData);
    } else if ( typeof bindData === 'number' ) {
        return new DataBind.Observer.Number(bindData);
    } else if ( typeof bindData === 'boolean' ) {
        return new DataBind.Observer.Boolean(bindData);
    }

    // Other types (e.g. RegExp,null,undefined)
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
        type = node.getAttribute('data-bind-event') || '';
        id   = node.__rtvid;

        if ( id && null !== (view = DataBind.View.getByID(id)) ) {
            if ( "handleEvent" in view ) {
                if ( view.handleEvent(evt) === true ) {
                    break;
                }
            } else if ( (',' + type + ',').indexOf(',' + evt.type + ',') !== -1 ) {
                break;
            }
            view = void 0;
        }
        node = node.parentNode;
    }

    if ( view && view.bindModel ) {
        DataBind.pubsubID++;
        view.bindModel.update(view, evt);
        //view.bindModel.handleUpdate(view, evt);
    }
};

//= require event.js
//= require_tree databind-class

