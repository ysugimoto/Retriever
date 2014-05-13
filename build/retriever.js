(function(global) {

/**
 * Retriever Component
 *
 * @module Retriever
 */

/**
 * Backus Naur Form Calculator
 *
 * @class BNF
 * @constructor
 * @author Yoshiaki Sugimoto <sugimoto@wnotes.net>
 */
function BNF(token) {
    /**
     * BNF token
     *
     * @property token
     * @type Array
     */
    this.token = token;

    /**
     * Token size
     *
     * @property size
     * @type Number
     */
    this.size = token.length;

    /**
     * Token index
     *
     * @property idx
     * @type Number
     */
    this.idx = 0;
}

/**
 * Static instantiate
 *
 * @method make
 * @static
 * @param {Array} token BNF parse token array
 * @return {Object BNF} BNF instance
 */
BNF.make = function(token) {
    return new BNF(token);
};

/**
 * Parse and calculate token
 *
 * @method calculate
 * @public
 * @return {Mixed} Number/String
 */
BNF.prototype.calculate = function() {
    this.idx = 0;

    return this.addSub();
};

/**
 * Add or Sub process
 *
 * @method addSub
 * @private
 * @return {Mixed}
 */
BNF.prototype.addSub = function() {
    var value = this.mulDiv();

    while ( this.idx < this.size && /[\+\-]/.test(this.token[this.idx]) ) {
        if ( this.token[this.idx++] === '+' ) {
            value += this.mulDiv();
        } else {
            value -= this.mulDiv();
        }
    }

    return value;
};

/**
 * Multiple or Division process
 *
 * @method mulDiv
 * @private
 * @return {Mixed}
 */
BNF.prototype.mulDiv = function() {
    var value = this.factor();

    while ( this.idx < this.size && /[\*\/]/.test(this.token[this.idx]) ) {
        if ( this.token[this.idx++] === '*' ) {
            value *= this.factor();
        } else {
            value /= this.factor();
        }
    }

    return value;
};

/**
 * Factor ( consider calculate priority ) process
 *
 * @method factor
 * @private
 * @return {Mixed}
 */
BNF.prototype.factor = function() {
    var value;

    if ( this.token[this.idx] === '(' ) {
        this.idx++;
        value = this.addSub();

        if ( this.token[this.idx] !== ')' ) {
            throw new Error('Syntax Error: Invalid factor of "(".');
        }

        this.idx++;
    } else {
        value = this.token[this.idx++];
        if ( /^[0-9\.]+$/.test(value) ) {
            value = parseFloat(value);
        }
    }

    return value;
};



/**
 * Retriever Component
 *
 * @module Retriever
 */

/**
 * Condition parser
 *
 * @class Condition
 * @constructor
 * @param {String} cond Condition string
 * @author Yoshiaki Sugimoto <sugimoto@wnotes.net>
 */
function Condition(cond) {
    /**
     * Tokenized chars array
     *
     * @property cond
     * @type Array
     */
    this.cond = this.tokenize(cond);

    /**
     * Parsing index
     *
     * @property idx
     * @type Number
     */
    this.idx = 0;

    /**
     * Relational operator
     *
     * @property compare
     * @type String
     */
    this.compare = '';

    /**
     * BNF token array on left-hand
     *
     * @property leftValue
     * @type Array
     */
    this.leftValue  = [];

    /**
     * BNF token array on right-hand
     *
     * @property leftValue
     * @type Array
     */
    this.rightValue = [];
}

/**
 * Static instantiate
 *
 * @method make
 * @static
 * @param {String} token condition string
 * @return {Object Condition}
 */
Condition.make = function(token) {
    return new Condition(token);
};

/**
 * Convert tokenized array from Condition string
 *
 * @method tokenize
 * @private
 * @param {String} token Condtion string
 * @return {Array}
 */
Condition.prototype.tokenize = function(token) {
    token = token.replace(/([><=!&\|\/\-\+\*]{,3}?)/g, ' $1 ').replace('  ', ' ');

    return token.split(' ').map(function(t) {
        return t.trim();
    });
};

/**
 * Get deep ojbect value at dot syntaxed
 *
 * @method getRecursiveValue
 * @private
 * @param {String} key property key name
 * @param {Object} param Parameter Object
 * @return {Mixed} value/null
 */
Condition.prototype.getRecursiveValue = function(key, param) {
    var point = key.indexOf('.'),
        k;

    // key has not contain dot
    if ( point === -1 ) {
        return ( key in param ) ? param[key] : null;
    }

    k = key.slice(0, point);

    if ( ! ( k in param ) || typeof param[k] !== 'object' ) {
        return null;
    }

    return this.getRecursiveValue(key.slice(++point), param[k]);
};

/**
 * Judge Condition is acceptance ( to be true )
 *
 * @method acceptance
 * @private
 * @param {Object} value Condition paramter object
 * @param {Number} index token index
 * @return {Boolean}
 */
Condition.prototype.acceptance = function(value, index) {
    var idx   = index || 0,
        token = this.cond[idx++],
        v,
        vv;

    // Do compare when token is not exists
    if ( token === void 0 ) {
        return this._compare();
    }

    // relational opelator
    if ( /^[<>=]+$/.test(token) ) {
        if ( this.compare !== '' ) {
            // bad syntax
            throw new Error('Syntax Error: Bad operator ' + token + ' after ' + this.compare);
        }
        this.compare = token;
        v  = this.cond[idx++];
        vv = this.parsePrimitiveValue(v);
        this.rightValue[this.rightValue.length] = ( vv !== null ) ? vv : this.getRecursiveValue(v, value);
    }
    // BNF calculation
    else if ( /^[\+\/\-\*]$/.test(token) ) {
        if ( this.compare !== null ) {
            this.rightValue[this.rightValue.length] = token;
        } else {
            this.leftValue[this.leftValue.length] = token;
        }
    }
    // logical opelator "and"
    else if ( token === '&&' ) {
        if ( this._compare() === false ) {
            return false;
        }
        this.leftValue  = [];
        this.rightValue = [];
        this.compare    = '';
    }
    // logical opelator "or"
    else if ( token === '||' ) {
        if ( this._compare() === true ) {
            return true;
        }
        this.leftValue  = [];
        this.rightValue = [];
        this.compare    = '';
    }
    // value
    else {
        vv = this.parsePrimitiveValue(token);
        if ( this.compare !== '' ) {
            this.rightValue[this.rightValue.length] = ( vv !== null ) ? vv : this.getRecursiveValue(token, value);
        } else {
            this.leftValue[this.leftValue.length] = ( vv !== null ) ? vv : this.getRecursiveValue(token, value);
        }
    }

    return this.acceptance(value, idx);
};

/**
 * Try get value as primitive
 *
 * @method parsePrimitiveValue
 * @private
 * @param {String} val parse value
 * @return {Mixed}
 */
Condition.prototype.parsePrimitiveValue = function(val) {
    var m;

    if ( null !== (m = /^['"](.+?)['"]$/.exec(val)) ) {
        return m[1];
    } else if ( null !== (m = /^([0-9\.]+)$/.exec(val)) ) {
        return ( m[1].indexOf('.') !== -1 ) ? parseFloat(m[1]) : parseInt(m[1], 10);
    }

    return null;
};

/**
 * Compare with opelator
 *
 * @method _compare
 * @private
 * @return {Boolean}
 */
Condition.prototype._compare = function() {
    var left  = BNF.make(this.leftValue).calculate(),
        right = BNF.make(this.rightValue).calculate();

    switch ( this.compare ) {
        case '>':
            return left > right;
        case '<':
            return left < right;
        case '>=':
            return left >= right;
        case '<=':
            return left <= right;
        case '==':
            return left == right;
        case '===':
            return left === right;
        case '!=':
            return left != right;
        case '!==':
            return left !== right;
        default:
            return !! left;
    }
};



/**
 * Retriever Component
 *
 * @module Retriever
 */

/**
 * If context parser
 *
 * @class Ifcontext
 * @constructor
 * @param {String} condition First if constion
 * @param {String} context Context in if section
 * @author Yoshiaki Sugimoto <sugimoto@wnotes.net>
 */
function IfContext(condition, context) {
    /**
     * First if condition
     *
     * @property condition
     * @type String
     */
    this.condition = condition;

    /**
     * Splitted context list
     *
     * @property contexts
     * @type Array
     */
    this.contexts = this.analyze(context);
}

/**
 * Static instantiate
 *
 * @method make
 * @static
 * @param {String} condition First if constion
 * @param {String} context Context in if section
 * @return {Object IfContext} IfContext IfContext instance
 */
IfContext.make = function(condition, context) {
    return new IfContext(condition, context);
};

/**
 * Analyze context
 * Parse and split  else if - else - section
 *
 * @method analyze
 * @private
 * @param {String} context
 * @return {Array} ret Context list array
 */
IfContext.prototype.analyze = function(context) {
    var ret      = [],
        i        = 0,
        regex    = /\{\{else(?:\s?if\s?)?([\s\S]+?)?\}\}/,
        contexts,
        size;

    // sub section is not exists
    if ( ! regex.test(context) ) {
        ret.push({
            condition: this.condition,
            context  : context
        });
        return ret;
    }

    contexts = context.split(regex);
    ret.push({
        condition: this.condition,
        context  : contexts.shift().replace(/^\n/, '')
    });

    // Parsed context list format:
    // [condtion, context, condition, context, ...]
    size = contexts.length;
    // context list array must have even length
    if ( size % 2 > 0 ) {
        throw new Error('Syntax Error: If condition id invalid.');
    }

    for ( ; i < size; i += 2 ) {
        ret.push({
            condition: contexts[i],
            context  : contexts[i + 1].replace(/\n$/, '')
        });
    }

    return ret;
};

/**
 * Execute context with aupplied condition parameters
 *
 * @method exec
 * @public
 * @param {Object} param Condition paramters
 * @return {String} parsed Parsed context section
 */
IfContext.prototype.exec = function(param) {
    var size   = this.contexts.length,
        i      = 0,
        parsed = '',
        ctx,
        cond;


    for ( ; i < size; ++i ) {
        ctx  = this.contexts[i];
        if ( ctx.condition === void 0 ) {
            parsed = ctx.context;
            break;
        }
        cond = new Condition(ctx.condition);
        if ( cond.acceptance(param) === true ) {
            parsed = ctx.context;
            break;
        }
    }

    return parsed;
};



/**
 * Retriever Component
 *
 * @module Retriever
 */

/**
 * Parser class
 *
 * @class parser
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
    this.tpl  = template.split('');

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
     * Parser status mode
     *
     * @property mode
     * @type Number
     */
    this.mode = Parser.STATUS_NORMAL;

    /**
     * Parsing process tree ( nestLevel = 0 only )
     *
     * @property processTree
     * @type Array
     */
    this.processTree = [];

    /**
     * Parsed string
     *
     * @property parsed
     * @type Array
     */
    this.parsed = [];

    /**
     * Template lines
     *
     * @property line
     * @type Number
     */
    this.line = 1;

    /**
     * Parsing nest level
     *
     * @property nestLevel
     * @type Number
     */
    this.nestLevel = 0;

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
}

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
 * Default status constant
 *
 * @property STATUS_NORMAL
 * @type Number
 * @default 0x00
 */
Parser.STATUS_NORMAL = 0x00;

/**
 * IF status constant
 *
 * @property STATUS_IF
 * @type Number
 * @default 0x01
 */
Parser.STATUS_IF = 0x01;

/**
 * LOOP status constant
 *
 * @property STATUS_LOOP
 * @type Number
 * @default 0x10
 */
Parser.STATUS_LOOP = 0x10;

/**
 * Parsing status constant
 *
 * @property STATUS_PARSING
 * @type Number
 * @default 0x11
 */
Parser.STATUS_PARSING = 0x11;

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
    var stack = "",
        regex = new RegExp('^' + this.leftDelimiter + '([/])?(.+?)' + this.rightDelimiter + '$'),
        parse = "",
        tmp,
        m,
        c,
        cc = "";

    this.param = param || {};

    while ( this.idx < this.size ) {
        // get next char
        c = this.tpl[this.idx];

        if ( c === '' || c === void 0 ) {
            this.idx++;
            continue;
        }

        // matched left delimiter
        if ( c + this.tpl[this.idx + 1] === this.leftDelimiter ) {
            this.mode = Parser.STATUS_PARSING;
            stack = this.leftDelimiter;
            this.idx++;
        }

        // matched right delimiter
        else if ( c + this.tpl[this.idx + 1] === this.rightDelimiter ) {
            if ( this.mode == Parser.STATUS_NORMAL ) {
                throw new Error('Unexpexted right delimiter chars: ' + this.rightDelimiter + ' at line ' + this.line);
            }
            stack += this.rightDelimiter;

            m = regex.exec(stack);
            if ( ! m[1] ) {
                // Open new process
                tmp = this.openProcess(m[2]);
                if ( this.nestLevel < 2 ) {
                    if ( tmp === false ) {
                        parse += stack;
                    } else if ( tmp !== "" ) {
                        this.parsed[this.parsed.length] = tmp;
                    }
                } else {
                    parse += stack;
                }
            } else {
                // Close recent process
                tmp = this.closeProcess(m[2], parse);
                if ( this.nestLevel < 1 ) {
                    if ( tmp !== '' ) {
                        this.parsed[this.parsed.length] = tmp;
                    }
                    parse = "";
                } else {
                    parse += stack;
                }
            }
            stack = "";
            this.idx++;
        }

        else if ( this.mode === Parser.STATUS_PARSING ) {
            stack += c;
        }
        else if ( this.mode === Parser.STATUS_IF || this.mode === Parser.STATUS_LOOP ) {
            parse += c;
        }
        else {
            this.parsed[this.parsed.length] = c;
            console.log(c);
        }

        if ( c === "\n" ) {
            ++this.line;
        }

        ++this.idx;
    }

    // join and trim linefeed / space
    return this.parsed.join('').replace(/^[\n\s]+|[\n\s]+$/, '');

};

/**
 * Open new process
 *
 * @method openProcess
 * @private
 * @param {String} mode Section string
 * @return {Mixed}
 */
Parser.prototype.openProcess = function(mode) {
    var val = "";

    if ( /^if\s/.test(mode) ) {
        this.mode = Parser.STATUS_IF;
        if ( this.nestLevel === 0 ) {
            this.processTree.push({
                mode: this.mode,
                condition: mode.replace(/^if\s(.+?)$/, '$1')
            });
        }
        this.nestLevel++;
    } else if ( /^else/.test(mode) ) {
        val = false;
        this.mode = Parser.STATUS_IF;
    } else if ( /^loop/.test(mode) ) {
        if ( this.nestLevel === 0 ) {
            this.mode = Parser.STATUS_LOOP;
            this.processTree.push({
                mode: this.mode,
                condition: mode.replace(/^loop\s(.+?)$/, '$1')
            });
        }
        this.nestLevel++;
    } else {
        if ( this.nestLevel === 0 ) {
            val = this.getRecursiveValue(mode, this.param);
            val = this._escape(val);
            this.mode = Parser.STATUS_NORMAL;
        } else {
            val = false;
        }
    }

    return val;
};

/**
 * Close recent process
 *
 * @method closeProcess
 * @private
 * @param {String} mode process string
 * @param {String} context parsing context string
 * @return {String}
 */
Parser.prototype.closeProcess = function(mode, context) {
    var proc,
        parser,
        list,
        size,
        stack = [],
        i = 0,
        piece = '';

    this.nestLevel--;
    this.mode = Parser.STATUS_NORMAL;

    switch ( mode ) {
        case 'if':
            if ( this.nestLevel === 0 ) {
                proc   = this.processTree.pop();
                parser = new IfContext(proc.condition, context);
                piece  = parser.exec(this.param);
                piece  = Parser.make(piece).parse(this.param);
            } else {
                piece = context;
            }
            break;

        case 'loop':
            if ( this.nestLevel === 0 ) {
                proc = this.processTree.pop();
                list = this.getRecursiveValue(proc.condition, this.param) || [];

                size = list.length;
                for ( ; i < size; ++i ) {
                    stack[stack.length] = Parser.make(context).parse(list[i] || {}).replace(/^[\n\s]+|[\n\s]+$/, '');
                }
                piece = stack.join('');
            } else {
                piece = context;
            }
            break;
    }

    return piece;
};

/**
 * Get deep ojbect value at dot syntaxed
 *
 * @method getRecursiveValue
 * @private
 * @param {String} key property key name
 * @param {Object} param Parameter Object
 * @return {Mixed} value/null
 */
Parser.prototype.getRecursiveValue = function(key, param) {
    var point = key.indexOf('.'),
        k;

    // key has not contain dot
    if ( point === -1 ) {
        return ( key in param ) ? param[key] : null;
    }

    k = key.slice(0, point);

    if ( ! ( k in param ) || typeof param[k] !== 'object' ) {
        return null;
    }

    return this.getRecursiveValue(key.slice(++point), param[k]);
};




global.Retriver = Parser;

})(this);
