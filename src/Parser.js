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
 * Initialize properties
 *
 * @method initialize
 * @private
 * @return {Void}
 */
Parser.prototype.initialize = function() {
    this.idx         = 0;
    this.mode        = Parser.STATUS_NORMAL;
    this.processTree = [];
    this.parsed      = [];
    this.line        = 1;
    this.nestLevel   = 0;
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

    this.initialize();
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
        index,
        stack = [],
        piece = '',
        i     = 0;

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

                    // Create assign object
                    if ( Object.prototype.toString.call(list[i]) === '[object Object]' ) {
                        index = list[i];
                    } else {
                        index = {"@data": list[i]};
                    }
                    index["@parent"] = this.param;
                    stack[stack.length] = Parser.make(context).parse(index).replace(/^[\n\s]+|[\n\s]+$/, '');
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

//= if node
var IfContext  = require('./IfContext');
module.exports = Parser;
//= end
