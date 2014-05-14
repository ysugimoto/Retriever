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
    this.tpl = template.split('');

    /**
     * Template string length
     *
     * @property size
     * @type Number
     */
    this.size = template.length;

    /**
     * Template string index
     *
     * @property idx
     * @type Number
     */
    this.idx = 0;

    /**
     * Template lines
     *
     * @property line
     * @type Number
     */
    this.line = 1;

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
     * Compiled JS function parser
     *
     * @property compiledTemplate
     * @type Function
     */
    this.compiledTemplate = null;
}

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
 * Remove helper
 *
 * @method remoeHelper
 * @static
 * @param {String} name Helper name
 */
Parser.removeHelper = function(name) {
    if ( name in Parser.Helpers ) {
        delete Parser.Helpers[name];
    }
};

/**
 * Escape html tag/quote map
 *
 * @property escapeMap
 * @type Object
 */
Parser.prototype.escapeMap = {
    '<': '&lt;',
    '>': '&gt:',
    '"': '&quot;',
    "'": '&apos;'
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

    var map = this.escapeMap,
        sed = function(m) {
            return map[m];
        };

    return str.toString().replace(/([<>"'])/g, sed);
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
        this.compiledTemplate = this._compile();
    }

    return this.compiledTemplate.apply(this, [param || {}, Parser.Helpers]);
};

/**
 * Compile template string to JavaScript function
 *
 * @method _compile
 * @private
 * @return {Fucntion}
 */
Parser.prototype._compile = function() {
    var compile = ['var b = [];'],
        syntax  = ['obj'],
        parsing = false,
        stack   = "",
        cc      = "",
        n       = 0,
        i       = 0,
        size,
        helper,
        args,
        value,
        p,
        m,
        f,
        v,
        c;

    while ( this.idx < this.size ) {
        // get next char
        c = this.tpl[this.idx];

        if ( c === '' || c === void 0 ) {
            this.idx++;
            continue;
        }

        // matched left delimiter
        if ( c + this.tpl[this.idx + 1] === this.leftDelimiter ) {
            stack   = '';
            parsing = true;

            if ( cc !== '' ) {
                compile[compile.length] = 'b[b.length]=' + this.quote(cc) + ';';
            }
            cc = '';
            this.idx++;
        }

        // matched right delimiter
        else if ( c + this.tpl[this.idx + 1] === this.rightDelimiter ) {
            switch ( stack.charAt(0) ) {

                // helper call
                case '#':
                    stack  = stack.slice(1);
                    helper = stack.split(/\s+/);
                    args   = helper.slice(1);
                    if ( typeof Parser.Helpers[helper[0]] === 'function' ) {
                        size = args.length;
                        for ( i = 0; i < size; ++i ) {
                            args[i] = this.getPrimitiveType(args[i]);
                            if ( args[i] === null ) {
                                args[i] = syntax.join('.') + '.' + args[i];
                            } else if ( typeof p === 'string' ) {
                                args[i] = this.quote(args[i]);
                            }
                        }
                        compile[compile.length] = 'b[b.length]=Helper.' + Parser.Helpers[helper[0]] + '(' + args.join(',') + ');';
                    } else {
                        throw new Error('Parse Error: Helper "' + helper[0] + '" is not a function.');
                    }
                    break;

                // reserved variable
                case '@':
                    stack = stack.slice(1);
                    f = true;
                    if ( stack.charAt(0) === '%' ) {
                        stack = stack.slice(1);
                        f = false;
                    }
                    switch ( stack ) {
                        // current value
                        case 'data':
                                v = syntax.join('.');
                                break;

                        // parent object
                        case 'parent':
                                v = syntax.slice(0, -1).join('.');
                                break;
                    }
                    compile[compile.length] = ( f ) ? 'b[b.length]=this._escape(' + v + ');'
                                                    : 'b[b.length]=' + v + ';';
                    break;

                // no-escape value
                case '%':
                    stack = stack.slice(1);
                    compile[compile.length] = 'b[b.length]=' + syntax.join('.') + '.' + stack + ';';
                    break;

                // control end
                case '/':
                    stack = stack.slice(1);
                    if ( stack === 'loop' ) {
                        syntax.pop();
                        n--;
                    }
                    compile[compile.length] = '}';
                    break;

                // builtin control
                default:
                    m = /^(if|else\sif|else|for|loop)(?:\s(.+))?/.exec(stack);
                    if ( m !== null ) {
                        switch ( m[1] ) {

                            case 'if':
                                compile[compile.length] = 'if(' + this._parseCondition(m[2], syntax) + '){';
                                break;

                            case 'else if':
                                compile[compile.length] = '}else if(' + this._parseCondition(m[2], syntax) + '){';
                                break;

                            case 'else':
                                compile[compile.length] = '}else{';
                                break;

                            case 'loop':
                            case 'for':
                                compile[compile.length] = 'for(var i' + n + '=0,size' + n + '=' + syntax.join('.') + '.' + m[2] + '.length; i' + n + '<size' + n + '; ++i' + n + '){';
                                syntax.push(m[2] + '[i' + n++ + ']');
                                break;
                        }
                    } else {
                        compile[compile.length] = 'b[b.length]=this._esacpe(' + syntax.join('.') + '.' + stack + ');';
                    }
                    break;
            }
            parsing = false;
            this.idx++;
        }

        else if ( parsing ) {
            stack += c;
        } else {
            cc += c;
        }

        if ( c === "\n" ) {
            ++this.line;
        }

        ++this.idx;
    }

    compile[compile.length] = 'return b.join(\'\');';

    return new Function('obj', 'Helpers', compile.join(''));
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
    str = str.replace("\n", '\\n')
             .replace("\t", '\\t')
             .replace("\r", '\\r')
             .replace("'", "\'");

    return "'" + str + "'";
};

/**
 * Parse If condition string
 *
 * @method _parseCondition
 * @private
 * @param {String} condition Condition string
 * @param {Array} syntax Current syntax scope
 * @return {String}
 */
Parser.prototype._parseCondition = function(condition, syntax) {
    var token  = condition.replace(/([><=!&\|\/\-\+\*]{,3}?)/g, ' $1 '),
        tokens = token.split(' '),
        size   = tokens.length,
        i      = 0,
        cond   = [],
        t,
        p;

    // filter and format conditions
    for ( ; i < size; ++i ) {
        if ( tokens[i] === '' ) {
            continue;
        }
        t = tokens[i].trim();
        if ( /^[><=!&\|\/\-\+\*]{1,3}$/.test(t) ) {
            cond[cond.length] = t;
        } else {
            p = this.getPrimitiveType(t);
            if ( p === null ) {
                cond[cond.length] = syntax.join('.') + '.' + t;
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




global.Retriever = Parser;

})(this);
