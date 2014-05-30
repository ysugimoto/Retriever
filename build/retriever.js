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

/**
 * Interface constructor
 */
function EventInterface() {
    this.callbacks = {};
}

/**
 * Implement(extend) this class
 * @param  Function fn
 * @reutrn Function fn
 */
EventInterface.prototype.implement = function(fn) {
   fn.prototype = new EventInterface();

   return fn;
};

/**
 * listen event
 * @param String name : Event name
 * @param Function callback : Event handler
 */
EventInterface.prototype.on = function(name, callback) {
    if ( ! (name in this.callbacks) ) {
        this.callbacks[name] = [];
    }

    this.callbacks[name].push([callback, 0]);
};

/**
 * listen event once time 
 * @param String name : Event name
 * @param Function callback : Event handler
 */
EventInterface.prototype.once = function(name, callback) {
    if ( ! (name in this.callbacks) ) {
        this.callbacks[name] = [];
    }

    this.callbacks[name].push([callback, 1]);
};

/**
 * unlisten event
 * @param String name : Event name
 * @param Function callback : Event handler
 */
EventInterface.prototype.off = function(name, callback) {
    if ( ! (name in this.callbacks) ) {
        return;
    } else if ( ! callback ) {
        delete this.callbacks[name];
        return;
    }

    var size = this.callbacks[name].length,
        i    = 0;

    for ( ; i < size; ++i ) {
        if ( this.callbacks[name][i][0] === callback ) {
            this.callbacks[name].splice(i--, 1);
        }
    }
};

/**
 * trigger event
 * @param String name : Event name
 * @param mixed data : Transport data
 */
EventInterface.prototype.trigger = function(name, data) {
    if ( ! (name in this.callbacks) ) {
        return;
    }

    var size = this.callbacks[name].length,
        i    = 0;

    for ( ; i < size; ++i ) {
        this.callbacks[name][i][0]({data: data});
        if ( this.callbacks[name][i][1] > 0 ) {
            this.off(name, this.callbacks[i][0]);
        }
    }
};


DataBind.Event = new EventInterface();



DataBind.Model = DataBind_Model;

function DataBind_Model() {
}

DataBind_Model.extend = function(name, model) {
    var mainModel = model || {},
        fn = function() {
            if ( typeof model === 'function' ) {
                mainModel.apply(this, arguments);
            } else {
                Object.keys(mainModel).forEach(function(key) {
                    this[key] = mainModel[key];
                }.bind(this));
            }
            this.name = name;
            this._observe();
        };

    fn.prototype = new DataBind_Model();

    if ( typeof mainModel === 'function' ) {
        Object.keys(mainModel).forEach(function(prop) {
            fn.prototype[prop] = mainModel.prototype[prop];
        });
    }

    return fn;
};

DataBind_Model.prototype._observe = function(node) {
    DataBind();

    var observes = Object.keys(this).filter(function(k) { return k.indexOf('-') !== 0; }),
        that = this;

    observes.forEach(function(prop) {
        if ( that[prop] instanceof DataBind.Observer ) {
            that[prop].initialize(that.name, prop, that);
            that[prop].attachViews(prop, that, node);
        } else if ( typeof that[prop] === 'function' ) {
            DataBind.View.search(node, that.name, prop).forEach(function(view) {
                view.bindModel = that;
            });
        }
    });

    observes.forEach(function(prop) {
        that[prop].chainView && that[prop].chainView();
    });
};

DataBind_Model.prototype.getName = function() {
    return this.name;
};

DataBind_Model.prototype.update = function(view, evt) {
    var prop = view.handler || view.name,
        value = view.getValue(),
        that = this;

    if ( ! this.hasOwnProperty(prop) ) {
        return;
    }

    if ( this[prop] instanceof DataBind.Observer ) {
        this[prop].set(value);
    } else if ( typeof this[prop] === 'function' ) {
        this[prop](value, evt);
        DataBind.View.get(this.name + '.' + prop, '*.' + prop).forEach(function(view) {
            if ( view.bindModel === that ) {
                if ( view.expression !== null ) {
                    view.expression(that);
                }
            }
        });
    }

    this.bindUpdate(prop);

    if ( --DataBind.pubsubID <= 0 ) {
        DataBind.Event.trigger('updatefinish');
    }
};

DataBind_Model.prototype.bindUpdate = function(prop) {
    Object.keys(this).forEach(function(key) {
        if ( key !== prop && this[key] instanceof DataBind.Observer.Computed ) {
            // Chained property call and set
            this[key].update();
        }
    }.bind(this));
};



DataBind.Observer = DataBind_Observer;

function DataBind_Observer() {}

DataBind_Observer.prototype = new EventInterface();

DataBind_Observer.prototype.initialize = function(modelName, propName, model) {
    this.signature = [modelName, propName];
    this.model     = model;
    this.bindModel = null;

    EventInterface.call(this);

    var that = this;

    this.__updated = false;
    this.bindViews = [];

    this.on('update', function() {
        that.__updated = true;
    });

    DataBind.Event.on('updatefinish', function() {
        that.__updated = false;
    });
};

DataBind_Observer.prototype.attachViews = function(name, model, root) {
    var nodes = (root || document).querySelectorAll('[data-bind-name="' + name + '"]'),
        size  = nodes.length,
        i     = 0,
        view;

    this.bindViews = [];
    for ( ; i < size; ++i ) {
        view = DataBind.View.make(nodes[i], model);
        this.bindViews.push(view);
        view.bindModel = model;
    }
};

DataBind_Observer.prototype.get = function() {
    return this.data;
};

DataBind_Observer.prototype.set = function(data) {
    if ( data !== void 0 && this.type && typeof data !== this.type ) {
        throw new Error('TypeError: Observe value must be a ' + this.type);
    }

    DataBind.pubsubID++;
    this.data = data;

    this.chainView();
    DataBind.pubsubID--;
};

DataBind_Observer.prototype.update = function(data) {
    if ( data !== void 0 && this.type && typeof data !== this.type ) {
        throw new Error('TypeError: Observe value must be a ' + this.type);
    }
    this.data = data;
};

DataBind_Observer.prototype.chainView = function() {
    if ( this.__updated === true && DataBind.pubsubID === 1 ) {
        return;
    }
    this.__updated = true;

    var data = this.get();

    this.bindViews.forEach(function(view) {
        if ( typeof view.valueMode === 'function' ) {
            view.valueMode(data);
        } else {
            view.node[view.valueMode] = data;
        }

        if ( typeof view.expression === 'function' ) {
            view.expression(view.bindModel);
        }
        if ( view.bindModel ) {
            view.bindModel.bindUpdate();
        }
    });
};



DataBind.Observer.Array = DataBind_Observer_Array;

DataBind_Observer_Array.prototype = new DataBind.Observer();

function DataBind_Observer_Array(data) {
    this.data = data;

    this.index  = 0;
    this.length = this.data.length || 0;
}

DataBind_Observer_Array.prototype.initialize = function(modelName, propName, model) {
    DataBind.Observer.prototype.initialize.call(this);
    this.signature = [modelName, propName];
    this.bindModel = model;
};

DataBind_Observer_Array.prototype.get = function() {
    return this.data[this.index];
};

DataBind_Observer_Array.prototype.getAll = function() {
    return this.data;
};

DataBind_Observer_Array.prototype.set = function(index) {
    this.index = index;

    this.trigger('update');
    DataBind.pubsubID++;
    this.chainView();
    DataBind.pubsubID--;
};

DataBind_Observer_Array.prototype.update = function(index) {
    this.index = index;
};

DataBind_Observer_Array.prototype.push = function() {
    Array.prototype.push.apply(this.data, arguments);
    this.length = this.data.length;

    this.trigger('update');
    DataBind.pubsubID++;
    this.chainView();
    this.bindModel && this.bindModel.bindUpdate();
    DataBind.pubsubID--;
    return this.length;
};

DataBind_Observer_Array.prototype.unshift = function() {
    Array.prototype.unshift.apply(this.data, arguments);
    this.length = this.data.length;

    this.trigger('update');
    DataBind.pubsubID++;
    this.chainView();
    DataBind.pubsubID--;
};

DataBind_Observer_Array.prototype.pop = function() {
    var pop = this.data.pop();

    this.length = this.data.length;

    this.chainView();
    return pop;
};

DataBind_Observer_Array.prototype.shift = function() {
    var shift = this.data.shift();

    this.length = this.data.length;
    this.chainView();

    return shift;
};

DataBind_Observer_Array.prototype.forEach = function(callback) {
    var data = this.data;

    data.forEach(callback);
    this.length = data.length;

    //this.trigger('update');
    //DataBind.pubsubID++;
    //this.chainView();
    //DataBind.pubsubID--;
};

DataBind_Observer_Array.prototype.map = function(callback) {
    var data = this.data;

    this.data   = data.map(callback);
    this.length = data.length;

    this.chainView();
    return this.data;
};

DataBind_Observer_Array.prototype.filter = function(callback) {
    var data = this.data;

    this.data   = data.filter(callback);
    this.length = data.length;

    this.chainView();
    return this.data;
};

DataBind_Observer_Array.prototype.chainView = function() {
    if ( this.__updated === true && DataBind.pubsubID === 1) {
        return;
    }
    this.__updated = true;

    var iterator = this.getAll();

    this.bindViews && this.bindViews.forEach(function(view) {
        if ( view.template !== null ) {
            iterator.forEach(function(dat, index) {
                view.addSubView(dat, index);
            });
        }
        if ( view.expression !== null ) {
            view.expression(view.bindModel);
        }
        if ( view.bindModel ) {
            view.bindModel.bindUpdate();
        }
    });
};


DataBind.Observer.Boolean = DataBind_Observer_Boolean;

DataBind_Observer_Boolean.prototype = new DataBind.Observer();

function DataBind_Observer_Boolean(value) {
    this.type = 'boolean';
    this.data = value;
}

DataBind_Observer_Boolean.prototype.initialize = function(modelName, propName) {
    this.signature = [modelName, propName];
    DataBind.Observer.prototype.initialize.call(this);
};


DataBind.Observer.Computed = DataBind_Observer_Computed;

DataBind_Observer_Computed.prototype = new DataBind.Observer();

function DataBind_Observer_Computed(fn) {
    this.func = fn;
}

DataBind_Observer_Computed.prototype.initialize = function(modelName, propName, model) {
    DataBind.Observer.prototype.initialize.call(this);
    this.signature = [modelName, propName];
    this.model     = model;
};

DataBind_Observer_Computed.prototype.get = function() {
    return this.func.call(this.model);
};

DataBind_Observer_Computed.prototype.call = function() {
    this.set();
};

DataBind_Observer_Computed.prototype.set =
DataBind_Observer_Computed.prototype.update = function() {
    var data = this.func.call(this.model);

    if ( data !== void 0 ) {
        this.data = data;

        DataBind.pubsubID++;
        this.chainView(data);
        DataBind.pubsubID--;
    }
};

DataBind_Observer_Computed.prototype.chainView = function() {
    var data = this.get();

    this.bindViews.forEach(function(view) {
        if ( typeof view.valueMode === 'function' ) {
            view.valueMode(data);
        } else {
            view.node[view.valueMode] = data;
        }

        if ( typeof view.expression === 'function' ) {
            view.expression(view.bindModel);
        }
    });
};


DataBind.Observer.Number = DataBind_Observer_Number;

DataBind_Observer_Number.prototype = new DataBind.Observer();

function DataBind_Observer_Number(value) {
    this.type = 'number';
    this.data = value;
}

DataBind_Observer_Number.prototype.initialize = function(modelName, propName, model) {
    DataBind.Observer.prototype.initialize.call(this);
    this.signature = [modelName, propName];
    this.model     = model;
};


DataBind.Observer.Object = DataBind_Observer_Object;

DataBind_Observer_Object.prototype = new DataBind.Observer();

function DataBind_Observer_Object(data) {
    this.data = data;
    this.key  = 0;
}

DataBind_Observer_Object.prototype.initialize = function(modelName, propName) {
    DataBind.Observer.prototype.initialize.call(this);
    this.signature = [modelName, propName];
}

DataBind_Observer_Object.prototype.get = function() {
    return this.data[this.key];
};

DataBind_Observer_Object.prototype.getAll = function() {
    return this.data;
};

DataBind_Observer_Object.prototype.set = function(key) {
    this.key = key;

    //DataBind.pubsubID++;
    this.chainView();
};

DataBind_Observer_Object.prototype.update = function(key) {
    this.key = key;
};

DataBind_Observer_Object.prototype.add = function(key, value) {
    this.data[key] = value;

    this.chainView();
};

DataBind_Observer_Object.prototype.remove = function(key) {
    if ( key in this.data ) {
        delete this.data[key];
    }

    this.chainView();
};

DataBind_Observer_Object.prototype.each = function(callback) {
    var data = this.data;

    Object.keys.forEach(function(key) {
        callback.apply(data, [data[key], key]);
    });
    this.data = data;

    this.chainView();
};

DataBind_Observer_Object.prototype.map = function(callback) {
    var data = this.data;

    Object.keys.foreach(function(key) {
        data[key] = callback.apply(data, [data[key], key]);
    });
    this.data = data;

    this.chainView();
};

DataBind_Observer_Object.prototype.filter = function(callback) {
    var data = this.data;

    Object.keys.foreach(function(key) {
        if ( callback.apply(data, [data[key], key]) === false ) {
            delete data[key];
        }
    });
    this.data = data;

    this.chainView();
};

DataBind_Observer_Object.prototype.chainView = function() {
    if ( this.__updated === true ) {
        return;
    }
    this.__updated = true;
    var iterator = this.getAll();

    this.bindViews.forEach(function(view) {
        if ( view.template !== null ) {
            Object.keys(iterator).forEach(function(key) {
                view.addSubView(iterator[key], key);
            });
        }
        if ( view.expression !== null ) {
            view.expression();
        }
        if ( view.bindModel ) {
            view.bindModel.bindUpdate();
        }
    });
};


DataBind.Observer.String = DataBind_Observer_String;

DataBind_Observer_String.prototype = new DataBind.Observer();

function DataBind_Observer_String(value) {
    this.type = 'string';
    this.data = value;
}

DataBind_Observer_String.prototype.initialize = function(modelName, propName) {
    DataBind.Observer.prototype.initialize.call(this);
    this.signature = [modelName, propName];
};




DataBind.View = DataBind_View;

function DataBind_View() {}

DataBind_View.ID = 0;
DataBind_View.factory = {
    signatures: {},
    ids:        {}
};

DataBind_View.prototype = new DataBind.Observer();

DataBind_View.make = function(node, model) {
    var view = DataBind_View.getByID(node.__rtvid || 0),
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

        if ( typeof view === 'function' ) {
            view.call(this);
        } else if ( Object.prototype.toString.call(view) === '[object Object]' ) {
            Object.keys(view).forEach(function(prop) {
                this[prop] = view[prop];
            }.bind(this));
        }
    };

    fn.prototype = new DataBind_View();

    return fn;
};

DataBind_View.search = function(node, prefix, name) {
    var selector = '[data-bind-name="' + prefix + '.' + name + '"], [data-bind-name="' + name + '"]',
        nodes    = (node || document).querySelectorAll(selector);

    return Array.prototype.slice.call(nodes);
};

DataBind_View.get = function(/* signature... */) {
    var views = [],
        i     = 0,
        size  = arguments.length;

    for ( ; i < size; ++i ) {
        views = views.concat(DataBind_View.factory.signatures[arguments[i]] || []);
    }

    return views;
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

DataBind_View.prototype.getValue = function() {
    if ( typeof this.valueMode === 'function' ) {
        return this.node.getAttribute('data-bind-attr');
    } else {
        return this.node[this.valueMode];
    }
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
    this.parentView = null;
    this.node       = node;
    this.subViews   = {};
    this.bindViews  = [];
    this.eventName  = eventName || 'change';
    this.eventOnly  = !!eventName;
    this.signature  = node.getAttribute('data-bind-name').split('.');
    this.__updated  = false;

    this.id = this.node.__rtvid = ++DataBind_View.ID;

    DataBind.listen(this.eventName);
    EventInterface.call(this);

    this.on('update', function(evt) {
        //if ( that.__updated === false ) {
            that.__updated = true;
            //that.set(evt.data);
        //}
    });

    DataBind.Event.on('updatefinish', function() {
        that.__updated = false;
    });

    if ( this.signature.length === 1 ) {
        this.signature.unshift('*');
    }

    this.name      = this.signature[this.signature.length - 1];
    this.handler   = this.node.getAttribute('data-bind-handler');
    this.valueMode = this.node.getAttribute('data-bind-prop') || this.valueMode ||'innerHTML';

    if ( this.node.hasAttribute('data-bind-attr') ) {
        this.valueMode = (function(attr) {
            return function(value) {
                that.node.setAttribute(attr, value);
            };
        })(this.node.getAttribute('data-bind-attr'));
    }

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
        this.node.innerHTML = '';
    }

    if ( this.node.hasAttribute('data-bind-show') ) {
        show = this.node.getAttribute('data-bind-show');
        expr = new Function('return ' + show + ';');
        this.expression = (function(view) {
            return function(model) {
                if ( model ) {
                    if ( expr.call(model) === true ) {
                        view.node.removeAttribute('data-bind-show');
                        return;
                    }
                }
                view.node.setAttribute('data-bind-show', show);
            };
        })(this);
    }

    if ( ! DataBind_View.exists(node) ) {
        signature = this.signature.join('.');
        if ( ! (signature in DataBind_View.factory.signatures) ) {
            DataBind_View.factory.signatures[signature] = [];
        }
        DataBind_View.factory.signatures[signature].push(this);
        DataBind_View.factory.ids[this.id] = this;
    }
};

DataBind_View.prototype.getNode = function() {
    return this.node;
};

DataBind_View.prototype.getSignature = function() {
    return this.signature.join('.');
};

DataBind_View.prototype.isEventHandler = function() {
    return this.eventOnly;
};

DataBind_View.prototype.addSubView = function(model, index) {
    var subview,
        template,
        node,
        fragment = document.createDocumentFragment();

    // existing
    if ( index in this.subViews ) {
        return;
    }

    node = document.createElement('div');
    node.innerHTML = this.template.parse(model);
    DataBind.factory(node, model);
    if ( model instanceof DataBind.Model ) {
        model._observe(node);
    }
    
    while ( node.firstChild ) {
        fragment.appendChild(node.firstChild);
    }
    this.subViews[index] = fragment;
    this.node.appendChild(fragment);
};



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


var DataBind_View_Select = DataBind.View.extend({
    valueMode: 'value'
});

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





global.Retriever = Parser;
global.DataBind  = DataBind;


})(this);
