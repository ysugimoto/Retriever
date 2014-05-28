/**
 * Interface constructor
 */
function EventInterface() {
    this.callbacks = {};
}

/**
 * Implement(extend) this class
 * @param  Function fn
 * @reutrn Function fn
 */
EventInterface.prototype.implement = function(fn) {
   fn.prototype = new EventInterface();

   return fn;
};

/**
 * listen event
 * @param String name : Event name
 * @param Function callback : Event handler
 */
EventInterface.prototype.on = function(name, callback) {
    if ( ! (name in this.callbacks) ) {
        this.callbacks[name] = [];
    }

    this.callbacks[name].push([callback, 0]);
};

/**
 * listen event once time 
 * @param String name : Event name
 * @param Function callback : Event handler
 */
EventInterface.prototype.once = function(name, callback) {
    if ( ! (name in this.callbacks) ) {
        this.callbacks[name] = [];
    }

    this.callbacks[name].push([callback, 1]);
};

/**
 * unlisten event
 * @param String name : Event name
 * @param Function callback : Event handler
 */
EventInterface.prototype.off = function(name, callback) {
    if ( ! (name in this.callbacks) ) {
        return;
    } else if ( ! callback ) {
        delete this.callbacks[name];
        return;
    }

    var size = this.callbacks[name].length,
        i    = 0;

    for ( ; i < size; ++i ) {
        if ( this.callbacks[name][i][0] === callback ) {
            this.callbacks[name].splice(i--, 1);
        }
    }
};

/**
 * trigger event
 * @param String name : Event name
 * @param mixed data : Transport data
 */
EventInterface.prototype.trigger = function(name, data) {
    if ( ! (name in this.callbacks) ) {
        return;
    }

    var size = this.callbacks[name].length,
        i    = 0;

    for ( ; i < size; ++i ) {
        this.callbacks[name][i][0]({data: data});
        if ( this.callbacks[name][i][1] > 0 ) {
            this.off(name, this.callbacks[i][0]);
        }
    }
};

//= if node
var DataBind = require('../DataBind');
module.exports = EventInterface;
//= end
DataBind.Event = new EventInterface();
