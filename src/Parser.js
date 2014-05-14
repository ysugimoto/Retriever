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

    this.compiled = [];
    this.syntax   = ['obj'];
    this.counter  = 0;

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
        parsing = false,
        stack   = "",
        cc      = "",
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
                    compile[compile.length] = this._compileHelper(stack.slice(1));
                    break;

                // reserved variable
                case '@':
                    v = this._compileReservedVars(stack.slice(1));
                    if ( v ) {
                        compile[compile.length] = v;
                    }
                    break;

                // no-escape value
                case '%':
                    compile[compile.length] = 'b[b.length]=' + this.syntax.join('.') + '.' + stack.slice(1) + ';';
                    break;

                // control end
                case '/':
                    if ( stack.slice(1) === 'loop' ) {
                        this.syntax.pop();
                        this.counter--;
                    }
                    compile[compile.length] = '}';
                    break;

                // builtin control
                default:
                    v = this._compileBuiltIn(stack);
                    if ( v ) {
                        compile[compile.length] = v;
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

    compile[compile.length] = 'return b.join("");';

    return new Function('obj', 'Helpers', compile.join(''));
};

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
        i      = 0;

    if ( typeof Parser.Helpers[helper] !== 'function' ) {
        throw new Error('Parse Error: Helper "' + helper + '" is undefined or not a function.');
    }

    for ( i = 0; i < size; ++i ) {
        args[i] = this.getPrimitiveType(args[i]);
        if ( args[i] === null ) {
            args[i] = this.syntax.join('.') + '.' + args[i];
        } else if ( typeof p === 'string' ) {
            args[i] = this.quote(args[i]);
        }
    }
    return 'b[b.length]=Helper.' + Parser.Helpers[helper] + '(' + args.join(',') + ');';
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

    if ( sentence.charAt(0) === '%' ) {
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
            value    = this.counter - 1;
        default:
            return;
    }

    return ( isEscape ) ? 'b[b.length]=this._escape(' + value + ');' : 'b[b.length]=' + value + ';';
};

/**
 * Compile built-in control
 *
 * @method _compileBuiltIn
 * @private
 * @param {String} sentence built-in control senetence ( e.g if/else if/else/loop )
 * @return {String} Compile String
 */
Parser.prototype._compileBuiltIn = function(sentence) {
    var match = /^(if|else\sif|else|for|loop)(?:\s(.+))?/.exec(sentence),
        n;

    if ( match === null ) {
        return 'b[b.length]=this._escape(' + this.syntax.join('.') + '.' + sentence + ');';
    }

    switch ( match[1] ) {

        case 'if':
            return 'if(' + this._parseCondition(match[2]) + '){';

        case 'else if':
            return '}else if(' + this._parseCondition(match[2]) + '){';

        case 'else':
            return '}else{';

        case 'loop':
        case 'for':
            n = 'for(var i' + this.counter + '=0,size' + this.counter + '=(' + this.syntax.join('.') + '.' + match[2] + '||[]).length; i' + this.counter + '<size' + this.counter + '; ++i' + this.counter + '){';
            this.syntax.push(match[2] + '[i' + this.counter++ + ']');
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
    str = str.replace(/\n/g, '\\n')
             .replace(/\t/g, '\\t')
             .replace(/\r/g, '\\r')
             .replace(/"/g, '\"');

    return '"' + str + '"';
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

//= if node
module.exports = Parser;
//= end
