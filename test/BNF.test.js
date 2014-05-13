var BNF = require('../src/BNF');
var expect = require('chai').expect;

describe('BNF class testcase', function() {

    it('BNF::make returns BNF intance', function() {
        expect(BNF.make(['a', '=', '1'])).to.be.instanceOf(BNF);
    });

    it('Addition test', function() {
        expect(BNF.make(['10', '+', '10']).calculate()).to.be.a('number')
            .and.eql(20);
    });

    it('Substruction test', function() {
        expect(BNF.make(['100', '-', '10']).calculate()).to.be.a('number')
            .and.eql(90);
    });

    it('Multiple test', function() {
        expect(BNF.make(['10', '*', '10']).calculate()).to.be.a('number')
            .and.eql(100);
    });

    it('Division test', function() {
        expect(BNF.make(['100', '/', '10']).calculate()).to.be.a('number')
            .and.eql(10);
    });
    
    it('Division test', function() {
        expect(BNF.make(['100', '/', '10']).calculate()).to.be.a('number')
            .and.eql(10);
    });

    it('Prural calculation test', function() {
        expect(BNF.make(['100', '/', '10', '+', '15']).calculate()).to.be.a('number')
            .and.eql(25);
    });

    it('Prural with factor calculation test', function() {
        expect(BNF.make(['100', '/', '(', '10', '+', '15', ')']).calculate()).to.be.a('number')
            .and.eql(4);
    });

    it('Prural with invalid factor calculation throws Error', function() {
        expect(function() {
            BNF.make(['100', '/', '(', '10', '+', '15']).calculate();
        }).to.throw(Error, /Syntax Error/);
    });

});
