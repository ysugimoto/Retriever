var BNF = require('./BNF');

function Condition(cond) {
    this.cond       = this.tokenize(cond);
    this.idx        = 0;
    this.compare    = null;
    this.leftValue  = [];
    this.rightValue = [];
}

Condition.prototype.tokenize = function(token) {
    token = token.replace(/([><=!&\|\/\-\+\*]{,3}?)/g, ' $1 ');

    return token.split(' ').map(function(t) {
        return t.trim();
    });
};

Condition.prototype.getRecursiveValue = function(key, param) {
    var point = key.indexOf('.'),
        k;

    // key has not contain dot
    if ( point === -1 ) {
        return param[key] || null;
    }

    k = key.slice(0, point);

    if ( ! ( k in param ) || typeof params[k] !== 'object' ) {
        return null;
    }

    return this.getRecursiveValue(k.slice(++point), param[k]);
};

Condition.prototype.acceptance = function(value, index) {
    var idx = index || 0,
        token = this.cond[idx++],
        v,
        vv;

    if ( token === void 0 ) {
        return this._compare();
    }

    if ( /^[<>=]+$/.test(token) ) {
        // compare
        this.compare = token;
        v  = this.cond[idx++];
        vv = this.parsePrimitiveValue(v);
        this.rightValue[this.rightValue.length] = ( vv !== null ) ? vv : this.getRecursiveValue(v, value);
    } else if ( /^[\+\/\-\*]$/.test(token) ) {
        if ( this.compare !== null ) {
            this.rightValue[this.rightValue.length] = token;
        } else {
            this.leftValue[this.leftValue.length] = token;
        }
    } else if ( token === '&&' ) {
        if ( this._compare() === false ) {
            return false;
        }
        this.leftValue  = [];
        this.rightValue = [];
        this.compare    = null;
    } else if ( token === '||' ) {
        if ( this._compare() === true ) {
            return true;
        }
        this.leftValue  = [];
        this.rightValue = [];
        this.compare    = null;
    } else {
        vv = this.parsePrimitiveValue(token);
        if ( this.compare !== null ) {
            this.rightValue[this.rightValue.length] = ( vv !== null ) ? vv : this.getRecursiveValue(token, value);
        } else {
            this.leftValue[this.leftValue.length] = ( vv !== null ) ? vv : this.getRecursiveValue(token, value);
        }
    }

    return this.acceptance(value, idx);
};

Condition.prototype.parsePrimitiveValue = function(val) {
    var m;

    if ( null !== (m = /^['"](.+?)['"]$/.exec(val)) ) {
        return m[1];
    } else if ( null !== (m = /^([0-9\.]+)$/.exec(val)) ) {
        return ( m[1].indexOf('.') !== -1 ) ? parseFloat(m[1]) : parseInt(m[1], 10);
    }

    return null;
};

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

module.exports = Condition;
