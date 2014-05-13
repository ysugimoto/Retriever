/**
 * Retriever Component
 *
 * @module Retriever
 */

/**
 * If context parser
 *
 * @class Ifcontext
 * @constructor
 * @param {String} condition First if constion
 * @param {String} context Context in if section
 * @author Yoshiaki Sugimoto <sugimoto@wnotes.net>
 */
function IfContext(condition, context) {
    /**
     * First if condition
     *
     * @property condition
     * @type String
     */
    this.condition = condition;

    /**
     * Splitted context list
     *
     * @property contexts
     * @type Array
     */
    this.contexts = this.analyze(context);
}

/**
 * Static instantiate
 *
 * @method make
 * @static
 * @param {String} condition First if constion
 * @param {String} context Context in if section
 * @return {Object IfContext} IfContext IfContext instance
 */
IfContext.make = function(condition, context) {
    return new IfContext(condition, context);
};

/**
 * Analyze context
 * Parse and split  else if - else - section
 *
 * @method analyze
 * @private
 * @param {String} context
 * @return {Array} ret Context list array
 */
IfContext.prototype.analyze = function(context) {
    var ret      = [],
        i        = 0,
        regex    = /\{\{else(?:\s?if\s?)?([\s\S]+?)?\}\}/,
        contexts,
        size;

    // sub section is not exists
    if ( ! regex.test(context) ) {
        ret.push({
            condition: this.condition,
            context  : context
        });
        return ret;
    }

    contexts = context.split(regex);
    ret.push({
        condition: this.condition,
        context  : contexts.shift().replace(/^\n/, '')
    });

    // Parsed context list format:
    // [condtion, context, condition, context, ...]
    size = contexts.length;
    // context list array must have even length
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

/**
 * Execute context with aupplied condition parameters
 *
 * @method exec
 * @public
 * @param {Object} param Condition paramters
 * @return {String} parsed Parsed context section
 */
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

//= if node
var Condition = require('./Condition');
module.exports = IfContext;
//= end
