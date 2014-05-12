function BNF(token) {
    this.token = token;
    this.size  = token.length;
    this.idx   = 0;
}

BNF.make = function(token) {
    return new BNF(token);
};

BNF.prototype.calculate = function() {
    this.idx = 0;

    return this.addSub();
};

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

module.exports = BNF;
