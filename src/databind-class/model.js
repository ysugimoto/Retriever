//= if node
var DataBind = require('../DataBind');
//= end

DataBind.Model = DataBind_Model;

function DataBind_Model(name, model) {
    var fn = function DataBindModel() {
        if ( typeof model === 'function' ) {
            model.call(this);
        } else {
            Object.keys(model).forEach(function(key) {
                this[key] = model[key];
            }.bind(this));
        }

        this.__observe(name);
    };

    if ( typeof model === 'function' ) {
        fn.prototype = model.prototype;
    }

    Object.keys(DataBind_Model.prototype).forEach(function(p) {
        fn.prototype[p] = DataBind_Model.prototype[p];
    });

    return fn;
}

DataBind_Model.extend = function(name, model) {
    return new DataBind_Model(name, model || {});
};

DataBind_Model.prototype.__observe = function(name) {
    DataBind();

    var observes = Object.keys(this).filter(function(k) { return k.indexOf('-') !== 0; });

    this._updated = {};

    observes.forEach(function(prop) {
        if ( this[prop] instanceof Array || Object.prototype.toString.call(this[prop]) === '[object Object]' ) {
            this[prop] = new DataBind.Observer.Iterator(name, prop, this[prop]);
        } else if ( typeof this[prop] === 'function' ) {
            this[prop] = new DataBind.Observer.Computed(name, prop, this[prop], this);
        } else {
            this[prop] = new DataBind.Observer.Primitive(name, prop, this[prop]);
        }

        this._updated[prop] = false;
    }.bind(this));

    // Attach inline
    this.getName = function() {
        return name;
    }
};

DataBind_Model.prototype.update = function(prop, data) {
    if ( ! this.hasOwnProperty(prop) ) {
        return;
    }

    if ( this._updated[prop] === false ) {
        this._updated[prop] = true;
        this[prop].update(data);
    }

    Object.keys(this).forEach(function(key) {
        if ( key !== prop && this._updated[key] === false && this[key] instanceof DataBind.Observer.Computed ) {
            // Chained peorperty call and set
            this._updated[key] = true;
            this[key].set();
        }
    }.bind(this));

    if ( --DataBind.pubsubID === 0 ) {
        Object.keys(this._updated).forEach(function(key) {
            this._updated[key] = false;
        }.bind(this));
    }
};

