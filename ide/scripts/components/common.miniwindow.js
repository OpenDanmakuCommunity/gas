var MiniWindow = (function () {
  var Field = function (id, fieldType, spec) {
    this.id = id;
    this.type = fieldType;
    this.spec = spec;
    this.changeListener = null;

    this._value = this._reprToValue(spec.value);
    this.DOM = null;
    this._createDom();
  };

  Field.prototype._reprToValue = function (repr) {
    if (repr === null) {
      return null;
    } else if (repr === '' && this.type !== 'text') {
      return null;
    }
    if (this.type === 'color') {
      try {
        var color = new Primitives.Color();
        if (typeof repr === 'string') {
          color.fromString(repr);
        } else {
          color.fromNumber(repr);
        }
        return color;
      } catch (e) {
        console.log(e);
        return null;
      }
    } else if (this.type === 'number' || this.type === 'tuple.number') {
      if (typeof repr === 'number') {
        return repr;
      } else {
        return parseFloat(repr, 10);
      }
    } else {
      return repr;
    }
  };
  Field.prototype._valueToRepr = function (value) {
    if (value === null) {
      return null;
    }
    if (this.type === 'color') {
      if (typeof value === 'number') {
        var color = new Primitives.Color();
        color.fromNumber(value);
        return color;
      } else {
        return value;
      }
    } else {
      return value;
    }
  };

  Field.prototype._copyProperties = function (base, propName) {
    if (Array.isArray(propName)) {
      for (var i = 0; i < propName.length; i++) {
        this._copyProperties(base, propName[i]);
      }
    } else {
      if (propName in this.spec) {
        if (propName === 'default') {
          if (this.spec[propName] !== null) {
            base['value'] = this.spec[propName];
          } else {
            base['placeholder'] = '(Undefined)';
          }
        } else {
          base[propName] = this.spec[propName];
        }
      }
    }
  };

  Field.prototype._createTuple = function (tupleType, baseProperties) {
    var TUPLE_COUNT = 2;
    var fields = [];
    if (tupleType === 'select') {
      if (!('values' in baseProperties) ||
        baseProperties.values.length !== TUPLE_COUNT) {

        throw new Error('Badly defined values.');
      }
      for (var i = 0; i < baseProperties.values.length; i++) {
        var sel = _Create('select');
        for(var j = 0; j < baseProperties.values[i].length; j++) {
          sel.appendChild(
            _Create('option', {
              'value': baseProperties.values[i][j],
            }, [_Create('text', baseProperties.values[i][j])]));
        }
        fields.unshift(sel);
      }
    } else {
      for (var i = 0; i < 2; i++) {
        var params = {
          'type': tupleType
        };
        if (tupleType === 'number') {
          Properties.getParams(tupleType).forEach(function (paramName) {
            if (paramName in baseProperties) {
              params[paramName] = baseProperties[paramName][i];
            }
          });
        }
        fields.unshift(_Create('input', params));
      }
    }
    var container = _Create('div', {
      'id': baseProperties.id,
      'className': 'tuple'
    }, fields);
    // Apply the defaults
    if ('value' in baseProperties && Array.isArray(baseProperties.value)) {
      for (var i = 0; i < fields.length; i++) {
        fields[i].value = baseProperties.value[i];
      }
    }
    return container;
  };

  Field.prototype._createDom = function () {
    var baseProperties = {
      'id': this.id
    };
    // Copy default value if it exists
    this._copyProperties(baseProperties, 'default');
    if (this.type === 'select' || this.type === 'multiselect') {
      if (this.type === 'multiselect') {
        baseProperties['multiple'] = true;
      }
      this.DOM = _Create('select', baseProperties);
      for (var i = 0; i < this.spec.values.length; i++) {
        this.DOM.appendChild(_Create('option', {
          'value': this.spec.values[i]
        }, [_Create('text', this.spec.values[i])]));
      }

    } else if (this.type.indexOf('tuple.') === 0) {
      this._copyProperties(baseProperties, 'values');
      this._copyProperties(baseProperties, 'min');
      this._copyProperties(baseProperties, 'max');
      this._copyProperties(baseProperties, 'step');
      this.DOM = this._createTuple(this.type.substring(6), baseProperties);
    } else {
      if (this.type === 'text') {
        baseProperties['type'] = 'text';
        this._copyProperties(baseProperties, Properties.getParams(this.type));
      } else if (this.type === 'color') {
        baseProperties['type'] = 'text';
        this._copyProperties(baseProperties, Properties.getParams(this.type));
      } else if (this.type === 'number') {
        baseProperties['type'] = 'number';
        baseProperties['placeholder'] = '(Undefined)';
        this._copyProperties(baseProperties, Properties.getParams(this.type));
      } else {
        baseProperties['type'] = 'text';
        baseProperties['value'] = '(Unsupported)';
        baseProperties['disabled'] = true;
      }
      this.DOM = _Create('input', baseProperties);
    }
    this._bindDom();
  };

  Field.prototype._bindDom = function () {
    if (this.type.indexOf('tuple.') === 0 ) {
      for (var i = 0; i < this.DOM.children.length; i++) {
        this.DOM.children[i].addEventListener('change', (function (e) {
          this._notifyChange();
        }).bind(this));
      }
    } else {
      this.DOM.addEventListener('change', (function (e) {
        this._notifyChange();
      }).bind(this));
    }
  };

  Field.prototype._notifyChange = function () {
    // Notifies an underlying change
    if (this.type.indexOf('tuple.') === 0) {
      var values = [];
      for (var i = 0; i < this.DOM.children.length; i++) {
        values.unshift(this._reprToValue(this.DOM.children[i].value));
      }
      this._set(values);
    } else if (this.type === 'multiselect') {
      var selected = [];
      for (var i = 0; i < this.DOM.options.length; i++) {
        if (this.DOM.options[i].selected) {
          selected.push(this.DOM.options[i].value);
        }
      }
      this._set(selected);
    } else {
      this._set(this._reprToValue(this.DOM.value));
    }
    if (typeof this.changeListener === 'function') {
      this.changeListener(this._value);
    }
  };

  Field.prototype._set = function (value) {
    if (typeof value === 'undefined' || value === null) {
      value = null;
    }
    this._value = value;
  };

  Field.prototype.get = function () {
    // Get the value
    return this._value;
  };

  Field.prototype.set = function (value) {
    this._set(value);
    // Update the UI
    if (this.type.indexOf('tuple.') === 0) {
      // Somehow update the tuple values
      if (Array.isArray(value) && value.length >= this.DOM.children.length) {
        for (var i = 0; i < this.DOM.children.length; i++) {
          this.DOM.children[i].value = this._valueToRepr(
            value[value.length - i - 1]);
        }
      }
    } else if (this.type === 'multiselect') {
      if (Array.isArray(this._value)) {
        for (var i = 0; i < this.DOM.options.length; i++) {
          if (this._value.indexOf(this.DOM.options[i].value) >= 0) {
            this.DOM.options[i].setAttribute('selected', true);
          } else {
            this.DOM.options[i].removeAttribute('selected');
          }
        }
      }
    } else {
      if (this._value === null) {
        this.DOM.value = '';
      } else {
        this.DOM.value = this._valueToRepr(this._value);
      }
    }
  };

  Field.prototype.setChangeListener = function (l) {
    if (typeof l === 'function') {
      this.changeListener = l;
    }
  };

  var MiniWindow = function (mWindow, name) {
    this._window = mWindow;
    this._titleBar = null;
    this._hasUserInteracted = false;

    var headings = this._window.getElementsByTagName('h1');
    if (headings.length >= 0) {
      this._titleBar = headings[0];
    }
    this._name = (typeof name === 'string' && name !== null) ?
      name : this._getName();
  };

  MiniWindow.prototype._getName = function () {
    if (this._window.getAttribute('id') !== null) {
      return this._window.getAttribute('id');
    } else {
      return 'binding-created-' + Date.now();
    }
  };

  MiniWindow.prototype._bindTitleBar = function (P) {
    if (this._titleBar === null) {
      return;
    }
    P.bind(this._titleBar, 'mousedown', 'miniwindow.' + this._name +
      '.title.dblclick');
    P.listen('miniwindow.' + this._name + '.title.dblclick', (function (e) {
      this._hasUserInteracted = true;
      this.toggleCollapse();
      return e;
    }).bind(this));
  };

  MiniWindow.prototype.autoToggleCollapse = function (collapse) {
    if (!this._hasUserInteracted) {
      this.toggleCollapse(collapse);
    }
  };

  MiniWindow.prototype.toggleCollapse = function (collapse) {
    if (typeof collapse !== 'boolean') {
      var collapse =
        this._window.className.split(' ').indexOf('collapse') < 0;
    }
    _ToggleClass(this._window, 'collapse', collapse);
  };

  MiniWindow.prototype.bind = function (P) {
    this._bindTitleBar(P);
  };


  // Add inner classes
  MiniWindow.Field = Field;
  return MiniWindow;
})();
