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

//= if node
var BNF = require('./BNF');
module.exports = Condition;
//= end
