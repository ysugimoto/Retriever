//= if node
var DataBind = require('../DataBind');
//= end

DataBind.Model = DataBind_Model;

function DataBind_Model(name, model) {
    var fn = function DataBindModel() {
        if ( typeof model === 'function' ) {
            model.apply(this, arguments);
        } else {
            Object.keys(model).forEach(function(key) {
                this[key] = model[key];
            }.bind(this));
        }
        this.name = name;
        this.__observe();
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

    var observes = Object.keys(this).filter(function(k) { return k.indexOf('-') !== 0; }),
        that = this;

    this._updated = {};

    observes.forEach(function(prop) {
        if ( that[prop] instanceof DataBind.Observer ) {
            that[prop].initialize(name, prop, that);
            that[prop].attachViews(prop, that);
            that[prop].chainView();
        } else if ( typeof that[prop] === 'function' ) {
            var modelViews  = DataBind.View.get(that.name + '.' + prop),
                globalViews = DataBind.View.get('*.' + prop);

            modelViews.concat(globalViews).forEach(function(view) {
                view.bindModel = that;
            });
        }

        that._updated[prop] = false;
    });

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
            this[key].update();
        }
    }.bind(this));

    if ( --DataBind.pubsubID === 0 ) {
        Object.keys(this._updated).forEach(function(key) {
            this._updated[key] = false;
        }.bind(this));
    }
};

