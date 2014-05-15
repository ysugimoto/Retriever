var Parser = require('../src/Parser');
var expect = require('chai').expect;
var sinon  = require('sinon');
var fs     = require('fs');

describe('Parser class testcase', function() {
    var tpl = '{{foo}}{{bar}}{{loop section}}{{data}}{{/loop}}{{if baz}}{{baz}}{{/if}}';
    var p;
    var tpl2 = fs.readFileSync(__dirname + '/fixture/testTemplate.html', {encoding: 'utf8'});

    beforeEach(function() {
        p = Parser.make(tpl);
    });

    it('Parser.make returns Parser instance', function() {
        expect(p).to.be.instanceOf(Parser);
    });

    it('Helper add and called', function() {
        var spy = sinon.spy();

        Parser.addHelper('someHelper', spy);
        Parser.make('{{#someHelper}}').parse();

        expect(spy.called).to.be.true;
    });

    it('Helper add and called with args', function() {
        var spy = sinon.spy();

        Parser.addHelper('someHelper', spy);
        Parser.make('{{#someHelper "test"}}').parse();

        expect(spy.withArgs('test').callCount).to.eql(1);
    });

    it('Changed delimiters', function() {
        Parser.setDelimiter('{{{', '}}}')
        expect(Parser.make('{{{foo}}}').parse({foo: 'bar'})).to.eql('bar');
        Parser.setDelimiter();
    });

    it('Escape string', function() {
        var str = '<div class="{{attr}}"></div>';

        expect(Parser.make(str).parse({attr: '<img src="xss" />'})).to.eql('<div class="&lt;img src=&quot;xss&quot; /&gt;"></div>');
    });

    it('parse to empty string when parameter not exists', function() {
        expect(p.parse()).to.be.a('string').and.empty;
    });

    it('parse to string when parameter is exists', function() {
        expect(p.parse({foo:'a',bar:'b'})).to.be.a('string').and.eql('ab');
    });

    it('parse loop when parameter exists', function() {
        expect(p.parse({section: [{data:'a'},{data:'b'}]})).to.be.a('string').and.eql('ab');
    });

    it('parse loop when parameter is an array', function() {
        expect(Parser.make('{{loop list}}{{@data}}{{/loop}}').parse({list: [1,2,3]})).to.be.a('string')
            .and.eql('123');
    });

    it('access to parent parameter object in loop process', function() {
        expect(Parser.make('{{loop list}}{{@data}}{{@parent.foo}}{{/loop}}').parse({foo: 'a', list: [1,2,3]})).to.be.a('string')
            .and.eql('1a2a3a');
    });

    it('access to index in loop process', function() {
        expect(Parser.make('{{loop list}}{{@index}}{{/loop}}').parse({foo: 'a', list: [1,2,3]})).to.be.a('string')
            .and.eql('012');
    });

    it('parse if empty when condition is true', function() {
        expect(p.parse({baz: 'dog', section: []})).to.be.a('string').and.eql('dog');
    });

    it('parse condition test', function() {
        var cond = 'a + "hoge" = 10 * 2';

        expect(Parser.prototype._parseCondition.call(p, cond)).to.be.a('string')
            .and.eql('obj.a + "hoge" = 10 * 2');
    });

    it('Pase test', function() {
        var o  = {foo:'b', bar:'b', list: [{value:0},{value:1},{value:2},{value:3},{value:4},{value:5}], baz: 'baz'};

        expect(function() {
            return Parser.make(tpl2).parse(o);
        }).not.throws;
    });

});
