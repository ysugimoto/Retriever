//= if node
var DataBind = require('../DataBind');
//= end

DataBind.Model = DataBind_Model;

function DataBind_Model(name, model) {
}

DataBind_Model.extend = function(name, model) {
    var mainModel = model || {},
        fn = function() {
            if ( typeof model === 'function' ) {
                mainModel.apply(this, arguments);
            } else {
                Object.keys(mainModel).forEach(function(key) {
                    this[key] = mainModel[key];
                }.bind(this));
            }
            this.name = name;
            this._observe();
        };

    fn.prototype = new DataBind_Model();

    if ( typeof mainModel === 'function' ) {
        Object.keys(mainModel).forEach(function(prop) {
            fn.prototype[prop] = mainModel.prototype[prop];
        });
    }

    return fn;
};

DataBind_Model.prototype._observe = function(node) {
    DataBind();

    var observes = Object.keys(this).filter(function(k) { return k.indexOf('-') !== 0; }),
        that = this;

    observes.forEach(function(prop) {
        if ( that[prop] instanceof DataBind.Observer ) {
            that[prop].initialize(that.name, prop, that);
            that[prop].attachViews(prop, that, node);
            that[prop].chainView();
        } else if ( typeof that[prop] === 'function' ) {
            var modelViews  = DataBind.View.get(that.name + '.' + prop),
                globalViews = DataBind.View.get('*.' + prop);

            modelViews.concat(globalViews).forEach(function(view) {
                view.bindModel = that;
            });
        }
    });

};

DataBind_Model.prototype.getName = function() {
    return this.name;
};

DataBind_Model.prototype.update = function(prop, data) {
    if ( ! this.hasOwnProperty(prop) ) {
        return;
    }

    if ( this[prop] instanceof DataBind.Observer ) {
        this[prop].trigger('update');
        this[prop].set(data);
    } else if ( typeof this[prop] === 'function' ) {
        this[prop](data);
    }

    this.bindUpdate(prop);

    if ( --DataBind.pubsubID === 0 ) {
        DataBind.Event.trigger('updatefinish');
    }
};

DataBind_Model.prototype.bindUpdate = function(prop) {
    Object.keys(this).forEach(function(key) {
        if ( key !== prop && this[key] instanceof DataBind.Observer.Computed ) {
            // Chained property call and set
            this[key].update();
        }
    }.bind(this));
}

