var Parser = require('../src/Parser');
var expect = require('chai').expect;
var sinon  = require('sinon');
var fs     = require('fs');

describe('Parser class Basic test', function() {
    var tpl = '{{foo}}{{bar}}{{loop section}}{{data}}{{/loop}}{{if baz}}{{baz}}{{/if}}';
    var p;

    beforeEach(function() {
        p = Parser.make(tpl);
    });

    it('Parser.make returns Parser instance', function() {
        expect(p).to.be.instanceOf(Parser);
    });

    it('Changed delimiters', function() {
        Parser.setDelimiter('{{{', '}}}')
        expect(Parser.make('{{{foo}}}').parse({foo: 'bar'})).to.eql('bar');
        Parser.setDelimiter();
    });

    it('Escape binding', function() {
        var str = '<div class="{{attr}}"></div>';

        expect(Parser.make(str).parse({attr: '<img src="xss" />'})).to.eql('<div class="&lt;img src=&quot;xss&quot; /&gt;"></div>');
    });

    it('No escape binding', function() {
        var str = '<div class="{{%attr}}"></div>';

        expect(Parser.make(str).parse({attr: '<img src="xss" />'})).to.eql('<div class="<img src="xss" />"></div>');
    });
});

describe('Parser class Helper test', function() {

    beforeEach(function() {
        Parser.Helpers = {};
    });

    it('Helper add and called', function() {
        var spy = sinon.spy();

        Parser.addHelper('someHelper', spy);
        Parser.make('{{#someHelper}}').parse();

        expect(spy.called).to.be.true;
    });

    it('Helper add from object and called', function() {
        var spy = sinon.spy();

        Parser.addHelperObject({
            'someHelper': spy
        });
        Parser.make('{{#someHelper}}').parse();

        expect(spy.called).to.be.true;
    });

    it('Helper add and called with string args', function() {
        var spy = sinon.spy();

        Parser.addHelper('someHelper', spy);
        Parser.make('{{#someHelper "test"}}').parse();

        expect(spy.withArgs('test').callCount).to.eql(1);
    });

    it('Helper add and called with bind args', function() {
        var spy = sinon.spy();

        Parser.addHelper('someHelper', spy);
        Parser.make('{{#someHelper bind}}').parse({bind: 'bind'});

        expect(spy.withArgs('bind').callCount).to.eql(1);
    });

    it('Helper add and called with number args', function() {
        var spy = sinon.spy();

        Parser.addHelper('someHelper', spy);
        Parser.make('{{#someHelper 10}}').parse();

        expect(spy.withArgs(10).callCount).to.eql(1);
    });

    it('Undefined helper called', function() {
        expect(function() {
            Parser.make('{{#undefHelper}}').parse();
        }).to.throws(Error, /Parse Error/);
    });
});

describe('Parser class Reserved-vars test', function() {

    it('@data referenced current value', function() {
        var p = Parser.make('{{loop list}}{{@data}}{{/loop}}');

        expect(p.parse({list: [1,2,3]})).to.eql('123');
    });

    it('@data referenced current value and use no-escape.', function() {
        var p = Parser.make('{{loop list}}{{@%data}}{{/loop}}');

        expect(p.parse({list: ['<s>']})).to.eql('<s>');
    });

    it('@data referenced current value and enable syntax value', function() {
        var p = Parser.make('{{loop list}}{{@data.foo}}{{/loop}}');

        expect(p.parse({
            list: [
                {foo:1},
                {foo:2},
                {foo:3}
            ]
        })).to.eql('123');
    });

    it('@parent referenced outer-loop object', function() {
        var p = Parser.make('{{loop list}}{{@parent}}{{/loop}}');

        expect(p.parse({foo: 'bar', list: [1,2,3]})).to.eql('[object Object][object Object][object Object]');
    });

    it('@data referenced current value and enable syntax value', function() {
        var p = Parser.make('{{loop list}}{{@parent.foo}}{{/loop}}');

        expect(p.parse({foo: 'bar', list: [1,2,3]})).to.eql('barbarbar');
    });

    it('@index referenced loop-index', function() {
        var p = Parser.make('{{loop list}}{{@index}}{{/loop}}');

        expect(p.parse({list: [1,2,3]})).to.eql('012');
    });

    it('undefined var returns empty', function() {
        var p = Parser.make('{{loop list}}{{@some}}{{/loop}}');

        expect(p.parse({list: [1,2,3]})).to.eql('');
    });
});

describe('Parser class Parsing test', function() {
    var tpl = '{{foo}}{{bar}}{{loop section}}{{data}}{{/loop}}{{if baz}}{{baz}}{{/if}}';
    var p;
    var tpl2 = fs.readFileSync(__dirname + '/fixture/testTemplate.html', {encoding: 'utf8'});

    beforeEach(function() {
        p = Parser.make(tpl);
    });

    it('parse to empty string when parameter not exists', function() {
        expect(p.parse()).to.be.a('string').and.empty;
    });

    it('parse to string when parameter is exists', function() {
        expect(p.parse({foo:'a',bar:'b'})).to.be.a('string').and.eql('ab');
    });

    it('parse if empty when condition is true', function() {
        expect(p.parse({baz: 'dog', section: []})).to.be.a('string').and.eql('dog');
    });

    it('if-elseif-else', function() {
        var tpl = 'Result:{{if a > 10}}greater than 10{{else if a > 0}}greater than 0{{else}}failed{{/if}}';

        expect(Parser.make(tpl).parse({a: 5})).to.eql('Result:greater than 0');
    });

});
