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

//= if node
module.exports = Parser;
//= end
