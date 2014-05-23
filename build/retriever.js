(function(global) {

/**
 * Retriever Component
 *
 * @module Retriever
 */

/**
 * Parser class
 *
 * @class Parser
 * @constructor
 * @param {String} template Template string
 * @author Yoshiaki Sugimoto <sugimoto@wnotes.net>
 */
function Parser(template) {
    /**
     * Template string
     *
     * @property tpl
     * @type String
     */
    this.template = template;

    /**
     * Parser recognize left delimiter
     *
     * @property leftDelimiter
     * @type String
     */
    this.leftDelimiter = '{{';

    /**
     * Parser recognize right delimiter
     *
     * @property rightDelimiter
     * @type String
     */
    this.rightDelimiter = '}}';

    /**
     * Anonymous compiled function syntax list
     *
     * @property syntax
     * @type Array
     */
    this.syntax = ['obj'];

    /**
     * Loop counter index
     *
     * @property counter
     * @type Number
     */
    this.counter = 0;

    /**
     * Compiled JS function parser
     *
     * @property compiledTemplate
     * @type Function
     */
    this.compiledTemplate = null;

    /**
     * Variable division
     *
     * @property devision
     * @type {Booelan}
     */
    this.division = true;
}

/**
 * Left delimiter string
 *
 * @property leftDelimiter
 * @static
 * @type String
 */
Parser.leftDelimiter = '{{';

/**
 * Right delimiter string
 *
 * @property rightDelimiter
 * @static
 * @type String
 */
Parser.rightDelimiter = '}}';

/**
 * Set delimiter
 *
 * @method setDelimiter
 * @static
 * @param {String} left Left delimiter
 * @param {String} right Right delimiter
 */
Parser.setDelimiter = function(left, right) {
    Parser.leftDelimiter  = left  || '{{';
    Parser.rightDelimiter = right || '}}';
};

/**
 * Helpers stack
 *
 * @property Helpers
 * @static
 * @type Object
 */
Parser.Helpers = {};

/**
 * Static instanciate
 *
 * @method make
 * @static
 * @param {String} template Template string
 * @return {Object Parser} parser Parser instance
 */
Parser.make = function(template) {
    return new Parser(template);
};

/**
 * Add helper
 *
 * @method addHelper
 * @static
 * @param {String} name Helper name
 * @param {Function} helper Helper implementation
 */
Parser.addHelper = function(name, helper) {
    Parser.Helpers[name] = helper;
};

/**
 * Add helper from Object
 *
 * @method addHelperObject
 * @static
 * @param {Object} helpers Helper definitions hash
 */
Parser.addHelperObject = function(helpers) {
    var i;

    for ( i in helpers ) {
        if ( helpers.hasOwnProperty(i) ) {
            Parser.Helpers[i] = helpers[i];
        }
    }
};

/**
 * Escape html tag/quote
 *
 * @method _escape
 * @private
 * @param {String} str
 * @return {String}
 */
Parser.prototype._escape = function(str) {
    if ( str === null || str === void 0 ) {
        return '';
    }

    return (str+'').replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;')
                   .replace(/"/g, '&quot;')
                   .replace(/'/g, '&apos;');
};

/**
 * Parse template with supplied paramter
 *
 * @method parse
 * @public
 * @param {Object} param Parsing paramter object
 * @return {String}
 */
Parser.prototype.parse = function(param) {
    if ( typeof this.compiledTemplate !== 'function' ) {
        this.compile();
    }

    return this.compiledTemplate(param || {}, Parser.Helpers, this._escape, '');
};

/**
 * Compile template string to JavaScript function
 *
 * @method compile
 * @public
 * @return {Parser} this
 */
Parser.prototype.compile = function() {
    var regex   = new RegExp(Parser.leftDelimiter + '([\/#@%])?(.+?)' + Parser.rightDelimiter, 'g'),
        compile = [],
        index   = 0,
        nest    = 0,
        context,
        match;

    while ( null !== (match = regex.exec(this.template)) ) {
        context = this.template.slice(index, match.index);
        if ( context && !/^[\r\n\s]+$/.test(context) ) {
            if ( nest > 0 ) {
                compile[compile.length] = this.getPrefix() + this.quote(context.replace(/^[\n|\r|\s|\t]+|[\n|\r|\t|\s]+$/g, ''));
            } else {
                compile[compile.length] = this.getPrefix() + this.quote(context);
            }
        }
        index = regex.lastIndex;

        switch ( match[1] ) {

            // helper call
            case '#':
                compile[compile.length] = this.getPrefix() + this._compileHelper(match[2]);
                break;

            // reserved variable
            case '@':
                v = this._compileReservedVars(match[2]);
                if ( v ) {
                    compile[compile.length] = this.getPrefix() + v;
                }
                break;

            // no-escape value
            case '%':
                compile[compile.length] = this.getPrefix() + this.syntax.join('.') + '.' + match[2];
                break;

            // control end
            case '/':
                if ( match[2] === 'loop' ) {
                    this.syntax.pop();
                    this.counter--;
                }
                compile[compile.length] = '}';
                this.division = true;
                nest--;
                break;

            // builtin control
            default:
                v = this._compileBuiltInControl(match[2]);
                if ( v ) {
                    compile[compile.length] = v;
                }
                if ( /^(loop|if)/.test(match[2]) ) {
                    nest++;
                }
                break;
        }
    }

    if ( index < this.template.length ) {
        compile[compile.length] = this.getPrefix() + this.quote(this.template.slice(index));
    }

    compile[compile.length] = ';return b;';
    this.compiledTemplate = new Function('obj', 'Helper', '_e', 'b', compile.join(''));

    return this;
}

/**
 * Compile helper call sentence
 *
 * @method _compileHelper
 * @private
 * @param {String} sentence Helper call senetence ( e.g #someHelper arg1 arg2 arg3 )
 * @return {String} Compile String
 */
Parser.prototype._compileHelper = function(sentence) {
    var args   = sentence.split(/\s+/),
        helper = args.shift(),
        size   = args.length,
        i      = 0,
        p;

    if ( typeof Parser.Helpers[helper] !== 'function' ) {
        throw new Error('Parse Error: Helper "' + helper + '" is undefined or not a function.');
    }

    for ( i = 0; i < size; ++i ) {
        p = this.getPrimitiveType(args[i]);
        if ( p === null ) {
            args[i] = this.syntax.join('.') + '.' + args[i];
        } else if ( typeof p === 'string' ) {
            args[i] = this.quote(p);
        } else if ( typeof p === 'number' ) {
            args[i] = p;
        }
    }
    return 'Helper.' + helper + '(' + args.join(',') + ')';
};

/**
 * Compile reserved word sentence
 *
 * @method _compileReservedVars
 * @private
 * @param {String} sentence reserved work senetence ( e.g @word )
 * @return {String} Compile String
 */
Parser.prototype._compileReservedVars = function(sentence) {
    var isEscape = true,
        value,
        match;

    //if ( sentence.charAt(0) === '%' ) {
    if ( sentence[0] === '%' ) {
        sentence = sentence.slice(1);
        isEscape = false;
    }

    match = /^(data|index|parent)(.+)?/.exec(sentence);
    if ( match === null ) {
        return;
    }

    switch ( match[1] ) {
        // current value
        case 'data':
            value = this.syntax.join('.') + (match[2] || '');
            break;

        // parent object
        case 'parent':
            value = this.syntax.slice(0, -1).join('.') + (match[2] || '');
            break;

        // loop counter
        case 'index':
            isEscape = false;
            value    = 'i' + (this.counter - 1);
            break;
        default:
            return;
    }

    return ( isEscape ) ? '_e(' + value + ')' : value;
};

/**
 * Compile built-in control
 *
 * @method _compileBuiltInControl
 * @private
 * @param {String} sentence built-in control senetence ( e.g if/else if/else/loop )
 * @param {Boolean} prefixVar variable prefix is needed
 * @return {String} Compile String
 */
Parser.prototype._compileBuiltInControl = function(sentence, prefixVar) {
    var match = /^(if|else\sif|else|for|loop)(?:\s(.+))?/.exec(sentence),
        n,
        c;

    if ( match === null ) {
        return this.getPrefix() + '_e(' + this.syntax.join('.') + '.' + sentence + ')';
    }

    this.division = true;
    switch ( match[1] ) {

        case 'if':
            return ';if(' + this._parseCondition(match[2]) + '){';

        case 'else if':
            return '}else if(' + this._parseCondition(match[2]) + '){';

        case 'else':
            return '}else{';

        case 'loop':
        case 'for':
            c = this.counter;
            n = ';for(var i' + c + '=0,size' + c + '=(' + this.syntax.join('.') + '.' + match[2] + '||[]).length; i' + c + '<size' + c + '; ++i' + c + '){';
            this.syntax[this.syntax.length] = match[2] + '[i' + this.counter++ + ']';
            return n;
    }
};

/**
 * Quote Inner function string
 *
 * @method quote
 * @private
 * @param {String} str quote string
 * @return {String} quoted string
 */
Parser.prototype.quote = function(str) {
    str = str.replace(/\\/g, '\\\\\\')
             .replace(/\n/g, '\\n')
             .replace(/\r/g, '\\r')
             .replace(/[']/g, "\\'");

    return "'" + str + "'";
};

/**
 * Parse If condition string
 *
 * @method _parseCondition
 * @private
 * @param {String} condition Condition string
 * @return {String}
 */
Parser.prototype._parseCondition = function(condition) {
    var token  = condition.replace(/(!|>=?|<=?|={2,3}|[^\+]\+|[^\-]\-|\*|&{2}|\|{2})/g, ' $1 '),
        tokens = token.split(/\s+/),
        size   = tokens.length,
        i      = 0,
        cond   = [],
        t,
        p;

    // filter and format conditions
    for ( ; i < size; ++i ) {
        t = tokens[i];
        if ( /^(!|>=?|<=?|={1,3}|\+|\-|\*|&{2}|\|{2})$/.test(t) ) {
            cond[cond.length] = t;
        } else {
            p = this.getPrimitiveType(t);
            if ( p === null ) {
                cond[cond.length] = this.syntax.join('.') + '.' + t;
            } else if ( typeof p === 'number' ) {
                cond[cond.length] = p;
            } else if ( typeof p === 'string' ) {
                cond[cond.length] = this.quote(p);
            }
        }
    }
    return cond.join(' ');
};

/**
 * Try to get value as JavaScript primitive type
 *
 * @method getPrimitiveType
 * @private
 * @param {String} val Variable string
 * @return {Mixed}
 */
Parser.prototype.getPrimitiveType = function(val) {
    var m;

    if ( null !== (m = /^['"](.+?)['"]$/.exec(val)) ) {
        return m[1];
    } else if ( null !== (m = /^([0-9\.]+)$/.exec(val)) ) {
        return ( m[1].indexOf('.') !== -1 ) ? parseFloat(m[1]) : parseInt(m[1], 10);
    }

    return null;
};

Parser.prototype.getPrefix = function() {
    var prefix = '+';

    if ( this.division === true ) {
        prefix = 'b+=';
        this.division = false;
    }

    return prefix;
};



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

DataBind.factory = function(rootNode) {
    var nodes = rootNode.querySelectorAll('[data-bind-name]'),
        size  = nodes.length,
        i     = 0;

    for ( ; i < size; ++i ) {
        DataBind.View.make(nodes[i]);
    }

    DataBind.View.filter();
};

DataBind.subscribers = {};
DataBind.rootNode    = null;
DataBind.pubsubID    = 0;

DataBind.publish = function(signature, data) {
    var modelCalled = false;

    DataBind.pubsubID++;

    Object.keys(this.subscribers).forEach(function(name) {
        if ( signature[0] === name || signature[0] === '*' ) {
            DataBind.subscribers[name].update(signature[1], data);
            modelCalled = true;
        }
    });

    if ( ! modelCalled ) {
        DataBind.pubsubID = 1;
    }
};

DataBind.subscribe = function(model) {
    if ( DataBind.Model.prototype.__observe === model.__observe ) {
        DataBind.subscribers[model.getName()] = model;
        model.__observe();
    }
};

DataBind.unsubscribe = function(name) {
    if ( name in DataBind.subscribers ) {
        delete DataBind.subscribers[name];
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
        type = node.getAttribute('data-bind-event');
        id   = node.__rtvid;

        if ( id && type && type.indexOf(evt.type) !== -1 && null !== (view = DataBind.View.getByID(id)) ) {
            break;
        }
        node = node.parentNode;
    }

    if ( view ) {
        DataBind.publish(view.signature, node.value || node.innerHTML);
    }
};



DataBind.Model = DataBind_Model;

function DataBind_Model(name, model) {
    var fn = function DataBindModel() {
        if ( typeof model === 'function' ) {
            model.call(this);
        } else {
            Object.keys(model).forEach(function(key) {
                this[key] = model[key];
            }.bind(this));
        }
        this.name = name;
    };

    if ( typeof model === 'function' ) {
        fn.prototype = model.prototype;
    }

    Object.keys(DataBind_Model.prototype).forEach(function(p) {
        fn.prototype[p] = DataBind_Model.prototype[p];
    });

    return fn;
}

DataBind_Model.extend = function(name, model) {
    return new DataBind_Model(name, model || {});
};

DataBind_Model.prototype.__observe = function() {
    DataBind();

    var observes = Object.keys(this).filter(function(k) { return k.indexOf('-') !== 0; });

    this._updated = {};

    observes.forEach(function(prop) {
        if ( this[prop] instanceof DataBind.Observer ) {
            this[prop].initialize(name, prop, this);
        }

        this._updated[prop] = false;
    }.bind(this));

};

DataBind_Model.prototype.getName = function() {
    return this.name;
};

DataBind_Model.prototype.update = function(prop, data) {
    if ( ! this.hasOwnProperty(prop) ) {
        return;
    }

    if ( this._updated[prop] === false ) {
        this._updated[prop] = true;
        if ( this[prop] instanceof DataBind.Observer ) {
            this[prop].update(data);
        } else if ( typeof this[prop] === 'function' ) {
            this[prop]();
        }
    }

    Object.keys(this).forEach(function(key) {
        if ( key !== prop && this._updated[key] === false && this[key] instanceof DataBind.Observer.Computed ) {
            // Chained peorperty call and set
            this._updated[key] = true;
            this[key].set();
        }
    }.bind(this));

    if ( --DataBind.pubsubID === 0 ) {
        Object.keys(this._updated).forEach(function(key) {
            this._updated[key] = false;
        }.bind(this));
    }
};



DataBind.Observer = DataBind_Observer;

function DataBind_Observer() {}

DataBind_Observer.prototype.initialize = function(modelName, propName, model) {
    this.signature = [modelName, propName];
    this.model     = model;
}

DataBind_Observer.prototype.getChainViews = function(model, prop) {
    var modelViews  = DataBind.View.get(model + '.' + prop),
        globalViews = DataBind.View.get('*.' + prop);

    return modelViews.concat(globalViews);
};

DataBind_Observer.prototype.get = function() {
    return this.data;
};

DataBind_Observer.prototype.set = function(data) {
    this.data = data;

    DataBind.publish(this.signature, data);
    this.update(data);
};

DataBind_Observer.prototype.update = function(data) {
    var sig = this.signature;

    this.data = data;
    this.keep = data;

    this.chainView(data);
};

DataBind_Observer.prototype.chainView = function(data) {
    this.getChainViews(this.signature[0], this.signature[1]).forEach(function(view) {
        if ( 'value' in view.node ) {
            view.node.value = data;
        } else {
            view.node.innerHTML = data;
        }
        if ( typeof view.expression === 'function' ) {
            view.expression();
        }
    });
};



DataBind.Observer.Computed = DataBind_Observer_Computed;

DataBind_Observer_Computed.prototype = new DataBind.Observer();

function DataBind_Observer_Computed(fn) {
    this.func = fn;

}

DataBind_Observer_Computed.prototype.initialize = function(modelName, propName, model) {
    this.signature = [modelName, propName];
    this.model     = model;

    this.update();
};

DataBind_Observer_Computed.prototype.set = function() {
    var data = this.func.call(this.model);

    if ( data !== void 0 ) {
        this.data = data;

        DataBind.publish(this.signature, data);
        this.chainView(data);
    }
};

DataBind_Observer_Computed.prototype.update = function() {
    var data = this.func.call(this.model);

    if ( data !== void 0 ) {
        this.data = data;

        this.chainView(data);
    }
};

DataBind_Observer_Computed.prototype.chainView = function(data) {
    this.getChainViews(this.signature[0], this.signature[1]).forEach(function(view) {
         if ( 'value' in view.node ) {
             view.node.value = data;
         } else {
             view.node.innerHTML = data;
         }
         if ( typeof view.expression === 'function' ) {
             view.expression();
         }
    });
};


DataBind.Observer.Iterator = DataBind_Observer_Iterator;

DataBind_Observer_Iterator.prototype = new DataBind.Observer();

function DataBind_Observer_Iterator(data) {
    this.data = data;

    this.index  = 0;
    this.length = this.data.length || 0;
}

DataBind_Observer_Iterator.prototype.initialize = function(modelName, propName, model) {
    this.signature = [modelName, propName];
    this.model     = model;

    this.each(this.data);
}

DataBind_Observer_Iterator.prototype.get = function() {
    return this.data[this.index];
};

DataBind_Observer_Iterator.prototype.set = function(index) {
    this.index = index;

    DataBind.publish(this.signature, index);
};

DataBind_Observer_Iterator.prototype.update = function(index) {
    this.index = index;
    this.chainView(index);
};

DataBind_Observer_Iterator.prototype.push = function() {
    if ( this.data instanceof Array ) {
        Array.prototype.push.apply(this.data, arguments);
        this.length = this.data.length;
    } else {
        this.data[arguments[0]] = arguments[1];
    }

    this.each(this.data);
};

DataBind_Observer_Iterator.prototype.unshift = function() {
    if ( this.data instanceof Array ) {
        Array.prototype.unshift.apply(this.data, arguments);
        this.length = this.data.length;
    } else {
        this.data[arguments[0]] = arguments[1];
    }

    this.each(this.data);
};

DataBind_Observer_Iterator.prototype.pop = function() {
    if ( this.data instanceof Array ) {
        this.data.pop();
        this.length = this.data.length;
    } else if ( arguments.length > 0 ) {
        delete this.data[arguments[0]];
    }

    this.each(this.data);
};

DataBind_Observer_Iterator.prototype.shift = function() {
    if ( this.data instanceof Array ) {
        this.data.shift();
        this.length = this.data.length;
    } else if ( arguments.length > 0 ) {
        delete this.data[arguments[0]];
    }

    this.each(this.data);
};

DataBind_Observer_Iterator.prototype.each = function(iterator) {

    this.getChainViews(this.signature[0], this.signature[1]).forEach(function(view) {
        if ( view.template !== null ) {
            view.addSubView(iterator);
        }
        if ( view.expression !== null ) {
            view.expression();
        }
    });
};


DataBind.Observer.Primitive = DataBind_Observer_Primitive;

DataBind_Observer_Primitive.prototype = new DataBind.Observer();

function DataBind_Observer_Primitive(value) {
    this.data = value

}

DataBind_Observer_Primitive.prototype.initialize = function(modelName, propName, model) {
    this.signature = [modelName, propName];
    this.model     = model;

    this.chainView(this.data);
};




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



var DataBind_View_Select = DataBind.View.extend();

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






global.Retriever = Parser;
global.DataBind  = DataBind;


})(this);
