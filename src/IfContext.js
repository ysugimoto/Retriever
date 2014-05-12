var Condition = require('./Condition');

function IfContext(condition, context) {
    this.condition = condition;
    this.contexts  = this.analyze(context);
}

IfContext.make = function(condition, context) {
    return new IfContext(condition, context);
};

IfContext.prototype.analyze = function(context) {
    var ret      = [],
        contexts = context.split(/\{\{else(?:\s?if\s?)?([\s\S]+?)?\}\}/),
        i        = 0,
        size;

    ret.push({
        condition: this.cond,
        context  : contexts.shift().replace(/^\n/, '')
    });

    size = contexts.length;
    if ( size % 2 > 0 ) {
        throw new Error('Syntax Error: If condition id invalid.');
    }
    for ( ; i < size; i += 2 ) {
        ret.push({
            condition: contexts[i],
            context  : contexts[i + 1].replace(/\n$/, '')
        });
    }

    return ret;
};

IfContext.prototype.exec = function(param) {
    var size   = this.contexts.length,
        i      = 0,
        parsed = '',
        ctx,
        cond;

    for ( ; i < size; ++i ) {
        ctx  = this.contexts[i];
        if ( ctx.condition === void 0 ) {
            parsed = ctx.context;
            break;
        }
        cond = new Condition(ctx.condition);
        if ( cond.acceptance(param) === true ) {
            parsed = ctx.context;
            break;
        }
    }

    return parsed;
};

module.exports = IfContext;
