var Parser = require('../src/Parser');
var expect = require('chai').expect;

describe('Parser class testcase', function() {
    var tpl = '{{foo}}{{bar}}{{loop section}}{{data}}{{/loop}}{{if baz}}{{baz}}{{/if}}';
    var p;

    beforeEach(function() {
        p = Parser.make(tpl);
    });

    it('Parser.make returns Parser instance', function() {
        expect(p).to.be.instanceOf(Parser);
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

    it('parse if empty when condition is true', function() {
        expect(p.parse({baz: 'dog'})).to.be.a('string').and.eql('dog');
    });

});
