var Condition = require('../src/Condition');
var expect    = require('chai').expect;

describe('Condition class testcase', function() {
    var cond;

    beforeEach(function() {
    });

    it('Condition.make returns Condition instance', function() {
        expect(Condition.make('a > 1')).to.be.instanceOf(Condition);
    });

    it('tokenize returns tokenized array', function() {
        expect(Condition.make('a > 1').cond).to.be.an('array')
            .and.deep.eql(['a', '>', '1']);
    });
    
    it('getRecursiveValue returns deep syntaxed value', function() {
        var obj = {
            foo: {
                bar: 'value'
            }
        };

        expect(Condition.prototype.getRecursiveValue('foo.bar', obj)).to.eql('value');
    });
    
    it('getRecursiveValue returns null property not exists', function() {
        var obj = {
            foo: {
                bar: 'value'
            }
        };

        expect(Condition.prototype.getRecursiveValue('foo.baz', obj)).to.be.null;
    });

    it('persePrimitiveValue returns unquoted string (Double quotation)', function() {
        expect(Condition.prototype.parsePrimitiveValue('"foo"')).to.be.a('string')
            .and.eql('foo');
    });

    it('persePrimitiveValue returns unquoted string (Single quotation)', function() {
        expect(Condition.prototype.parsePrimitiveValue("'foo'")).to.be.a('string')
            .and.eql('foo');
    });

    it('persePrimitiveValue returns Number', function() {
        expect(Condition.prototype.parsePrimitiveValue('999')).to.be.a('number')
            .and.eql(999);
    });

    it('persePrimitiveValue returns Float Number', function() {
        expect(Condition.prototype.parsePrimitiveValue('999.999')).to.be.a('number')
            .and.eql(999.999);
    });

    it('acceptance ">" operator will be true', function() {
        expect(Condition.make('a > 0').acceptance({a: 1})).to.be.a.true;
    });

    it('acceptance ">" operator will be false', function() {
        expect(Condition.make('a > 0').acceptance({a: -1})).to.be.a.false;
    });

    it('acceptance "<" operator will be true', function() {
        expect(Condition.make('a < 10').acceptance({a: 1})).to.be.a.true;
    });

    it('acceptance "<" operator will be false', function() {
        expect(Condition.make('a < 10').acceptance({a: 10})).to.be.a.false;
    });

    it('acceptance ">=" operator will be true', function() {
        expect(Condition.make('a >= 0').acceptance({a: 0})).to.be.a.true;
    });

    it('acceptance ">=" operator will be false', function() {
        expect(Condition.make('a >= 0').acceptance({a: -1})).to.be.a.false;
    });

    it('acceptance "<=" operator will be true', function() {
        expect(Condition.make('a <= 10').acceptance({a: 10})).to.be.a.true;
    });

    it('acceptance "<=" operator will be false', function() {
        expect(Condition.make('a <= 10').acceptance({a: 11})).to.be.a.false;
    });

    it('acceptance "==" operator will be true', function() {
        expect(Condition.make('a == 10').acceptance({a: 10})).to.be.a.true;
    });

    it('acceptance "==" operator will be false', function() {
        expect(Condition.make('a == 10').acceptance({a: 11})).to.be.a.false;
    });

    it('acceptance "==" operator will be true ( type sensitive )', function() {
        expect(Condition.make('a == 10').acceptance({a: '10'})).to.be.a.true;
    });

    it('acceptance "===" operator will be true', function() {
        expect(Condition.make('a === 10').acceptance({a: 10})).to.be.a.true;
    });

    it('acceptance "===" operator will be false', function() {
        expect(Condition.make('a === 10').acceptance({a: 11})).to.be.a.false;
    });

    it('acceptance "===" operator will be true ( type sensitive )', function() {
        expect(Condition.make('a === 10').acceptance({a: '10'})).to.be.a.true;
    });

    it('acceptance with && logical operator works ( true case )', function() {
        expect(Condition.make('a > 10 && a < 12').acceptance({a: 11})).to.be.a.true;
    });

    it('acceptance with || logical operator works ( false case )', function() {
        expect(Condition.make('a > 10 && a < 12').acceptance({a: 12})).to.be.a.false;
    });

    it('acceptance with && logical operator works ( true case )', function() {
        expect(Condition.make('a > 10 || a < 5').acceptance({a: 2})).to.be.a.true;
    });

    it('acceptance with || logical operator works ( false case )', function() {
        expect(Condition.make('a > 10 || a < 5').acceptance({a: 8})).to.be.a.false;
    });

});
