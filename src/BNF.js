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

//= if node
module.exports = BNF;
//= end
