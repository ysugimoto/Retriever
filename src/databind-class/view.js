//= if node
var DataBind = require('../DataBind');
//= end

DataBind.View = DataBind_View;

function DataBind_View() {}

DataBind_View.ID = 0;
DataBind_View.factory = {
    signatures: {},
    ids:        []
};

DataBind_View.prototype = new DataBind.Observer();

DataBind_View.make = function(node) {
    var view;

    switch ( node.tagName ) {
        case 'SELECT':
            view = new DataBind.View.Select();
            break;

        default:
            view = new DataBind.View();
            break;
    }

    if ( view instanceof DataBind.View ) {
        view.initialize(node);
    }

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
    var views = DataBind_View.factory.ids,
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

    var ids  = DataBind_View.factory.ids,
        size = ids.length,
        i    = 1;

    for ( ; i < size; ++i ) {
        if ( ids[i].node.parentNode == null ) {
            ids[i] = null;
        }
    }

    DataBind_View.factory.ids = ids;
};


DataBind_View.prototype.initialize = function(node) {
    var eventName = node.getAttribute('data-bind-event'),
        that      = this,
        expr,
        show,
        signature;

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

    if ( this.eventOnly === false ) {
        this.node.setAttribute('data-bind-event', this.eventName);
    }

    if ( this.node.hasAttribute('data-bind-each') ) {
        this.template = this.node.innerHTML;
        this.node.innerHTML = '';
    }

    if ( this.node.hasAttribute('data-bind-show') ) {
        show = this.node.getAttribute('data-bind-show');
        expr = new Function('return ' + show + ';');
        this.expression = function() {
            var model;

            Object.keys(DataBind.subscribers).forEach(function(name) {
                if ( that.signature[0] === name || that.signature[0] === '*' ) {
                    model = DataBind.subscribers[name];
                }
            });

            if ( model ) {
                if ( expr.call(model) === true ) {
                    this.node.removeAttribute('data-bind-show');
                    return;
                }
            }
            this.node.setAttribute('data-bind-show', show);
        };
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

DataBind_View.prototype.handleEvent = function(evt) {
    DataBind.publish(this.signature, this.node.value || this.node.innerHTML, evt.type);
};

DataBind_View.prototype.addSubView = function(iterator) {
    var subview,
        template;

    if ( iterator instanceof Array ) {
        template = Parser.make('{{loop iterator}}' + this.template + '{{/loop}}').compile();
        subView = template.parse({iterator: iterator});
        this.node.innerHTML = subView;
    } else {
        template = Parser.make(this.template).compile();
        subView = template.parse({iterator: iterator});
        this.node.innerHTML = subView;
    }

    DataBind.factory(this.node);
};

//= require_tree databind-class/views
