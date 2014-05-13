var IfContext = require('../src/IfContext');
var expect    = require('chai').expect;

describe('IfContext class testcase', function() {

    it('IfContext.make returns IfContext instance', function() {
        expect(IfContext.make('a > 1', 'foo')).to.be.instanceOf(IfContext);
    });

    it('Simple if case returns context when condition is true', function() {
        var instance = IfContext.make('a > 1', 'foo');

        expect(instance.exec({a: 2})).to.be.eql('foo');
    });

    it('Simple if case returns empty when condition is false', function() {
        var instance = IfContext.make('a > 1', 'foo');

        expect(instance.exec({a: 1})).to.be.empty;
    });

    it('if-else case returns first context when condition is true', function() {
        var instance = IfContext.make('a > 1', 'foo{{else}}bar');

        expect(instance.exec({a: 2})).to.be.eql('foo');
    });

    it('if-else case returns else context when first condition is false', function() {
        var instance = IfContext.make('a > 1', 'foo{{else}}bar');

        expect(instance.exec({a: 1})).to.be.eql('bar');
    });

    it('if-elseif case returns first context when second condition is true', function() {
        var instance = IfContext.make('a > 1', 'foo{{else if a == 0}}bar');

        expect(instance.exec({a: 2})).to.be.eql('foo');
    });

    it('if-elseif case returns elseif context when first condition is false', function() {
        var instance = IfContext.make('a > 1', 'foo{{else if a == 0}}bar');

        expect(instance.exec({a: 0})).to.be.eql('bar');
    });

    it('if-elseif case returns empty when any conditions are false', function() {
        var instance = IfContext.make('a > 1', 'foo{{else if a == 0}}bar');

        expect(instance.exec({a: -1})).to.be.empty;
    });

    it('if-elseif-else case returns first context when first condition is true', function() {
        var instance = IfContext.make('a > 1', 'foo{{else if a == 0}}bar{{else}}baz');

        expect(instance.exec({a: 2})).to.be.eql('foo');
    });

    it('if-elseif-else case returns elseif context when second condition is true', function() {
        var instance = IfContext.make('a > 1', 'foo{{else if a == 0}}bar{{else}}baz');

        expect(instance.exec({a: 0})).to.be.eql('bar');
    });

    it('if-elseif-else case returns empty when any conditions are false', function() {
        var instance = IfContext.make('a > 1', 'foo{{else if a == 0}}bar{{else}}baz');

        expect(instance.exec({a: -1})).to.be.eql('baz');
    });
});
