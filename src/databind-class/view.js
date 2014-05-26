//= if node
var DataBind = require('../DataBind');
//= end

DataBind.View = DataBind_View;

function DataBind_View() {}

DataBind_View.ID = 0;
DataBind_View.factory = {
    signatures: {},
    ids:        {}
};

DataBind_View.prototype = new DataBind.Observer();

DataBind_View.make = function(node, model) {
    var view = DataBind_View.getByID(node),
        tag,
        klass;

    if ( view ) {
        return view;
    }

    tag   = node.tagName;
    klass = tag.charAt(0) + tag.slice(1).toLowerCase();
    view  = ( klass in DataBind.View ) ? new DataBind.View[klass]() : new DataBind.View();

    view.initialize(node, model);

    return view;
};

DataBind_View.extend = function(view) {
    var fn = function(node) {
        DataBind_View.call(this, node);

        if ( typeof view === 'function' ) {
            view.call(this);
        }
    };

    fn.prototype = new DataBind_View();

    return fn;
};

DataBind_View.get = function(signature) {
    return DataBind_View.factory.signatures[signature] || [];
};

DataBind_View.getByID = function(id) {
    return DataBind_View.factory.ids[id] || null;
};

DataBind_View.exists = function(node) {
    var id = node.__rtvid || 0;

    return DataBind_View.factory.ids[id] && DataBind_View.ids[id].node === node;
};

DataBind_View.filter = function() {
    Object.keys(DataBind_View.factory.signatures).forEach(function(signature) {
        var list = DataBind_View.factory.signatures[signature],
            size = list.length,
            i    = 0,
            update = [];

        for ( ; i < size; ++i ) {
            if ( list[i].node.parentNode !== null ) {
                update[update.length] = list[i];
            }
        }

        DataBind_View.factory.signatures[signature] = update;
    });

    Object.keys(DataBind_View.factory.ids).forEach(function(id) {
        var view = DataBind_View.factory.ids[id];

        if ( view.node.parentNode === null ) {
            delete DataBind_View.factory.ids[id];
        }
    });
};


DataBind_View.prototype.initialize = function(node, model) {
    var eventName = node.getAttribute('data-bind-event'),
        that      = this,
        i         = -1,
        expr,
        show,
        signature,
        subscribers;

    this.expression = null;
    this.template   = null;
    this.node       = node;
    this.eventName  = eventName || 'change';
    this.eventOnly  = !!eventName;
    this.signature  = node.getAttribute('data-bind-name').split('.');

    this.id = this.node.__rtvid = ++DataBind_View.ID;

    DataBind.listen(this.eventName);

    if ( this.signature.length === 1 ) {
        this.signature.unshift('*');
    }

    this.name = this.signature[this.signature.length - 1];

    if ( ! model ) {
        // If model is not binded, create binding
        subscribers = Object.keys(DataBind.subscribers);
        while ( subscribers[++i] ) {
            if ( this.signature[0] === subscribers[i] || this.signature[0] === '*' ) {
                this.bindModel = DataBind.subscribers[subscribers[i]];
                break;
            }
        }
    } else {
        this.bindModel = model;
    }

    if ( this.eventOnly === false ) {
        this.node.setAttribute('data-bind-event', this.eventName);
    }

    if ( this.node.hasAttribute('data-bind-each') ) {
        this.template = Parser.make(this.node.innerHTML).compile();
    }

    if ( this.node.hasAttribute('data-bind-show') ) {
        show = this.node.getAttribute('data-bind-show');
        expr = new Function('return ' + show + ';');
        this.expression = (function(model, view) {
            return function() {
                if ( model ) {
                    if ( expr.call(model) === true ) {
                        view.node.removeAttribute('data-bind-show');
                        return;
                    }
                }
                view.node.setAttribute('data-bind-show', show);
            }
        })(this.bindModel, this);
    }

    if ( ! DataBind_View.exists(node) ) {
        signature = this.signature.join('.');
        if ( ! (signature in DataBind_View.factory.signatures) ) {
            DataBind_View.factory.signatures[signature] = [];
        }
        DataBind_View.factory.signatures[signature].push(this);
        DataBind_View.factory.ids[this.id] = this;
    }
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

DataBind_View.prototype.addSubView = function(iterator) {
    var subview,
        template,
        node,
        fragment = document.createDocumentFragment();

    if ( iterator instanceof Array ) {
        template = this.template;
        iterator.forEach(function(value, index) {
            node = document.createElement('div');
            value.__INDEX__ = index;
            value.__DATA__  = value;
            subview = template.parse(value);
            node.innerHTML = subview;
            DataBind.factory(node, value);
            while ( node.firstChild ) {
                fragment.appendChild(node.firstChild);
            }
        });
        while ( this.node.firstChild ) {
            this.node.removeChild(this.node.firstChild);
        }
        this.node.appendChild(fragment);
    } else {
        template = this.template;
        subview = template.parse(iterator);
        node = document.createElement('div');
        node.innerHTML = subview;
        DataBind.factory(node, value);
        while ( node.firstChild ) {
            fragment.appendChild(node.firstChild);
        }
        while ( this.node.firstChild ) {
            this.node.removeChild(this.node.firstChild);
        }
        this.node.appendChild(fragment);
    }
};

//= require_tree databind-class/views
