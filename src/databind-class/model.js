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
        this.name = name;
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

DataBind_Model.prototype.__observe = function() {
    DataBind();

    var observes = Object.keys(this).filter(function(k) { return k.indexOf('-') !== 0; });

    this._updated = {};

    observes.forEach(function(prop) {
        if ( this[prop] instanceof DataBind.Observer ) {
            this[prop].initialize(name, prop, this);
        }

        this._updated[prop] = false;
    }.bind(this));

};

DataBind_Model.prototype.getName = function() {
    return this.name;
};

DataBind_Model.prototype.update = function(prop, data) {
    if ( ! this.hasOwnProperty(prop) ) {
        return;
    }

    if ( this._updated[prop] === false ) {
        this._updated[prop] = true;
        if ( this[prop] instanceof DataBind.Observer ) {
            this[prop].update(data);
        } else if ( typeof this[prop] === 'function' ) {
            this[prop]();
        }
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

