var PropertyManager = (function () {
  var ENABLED_PROPERTIES = {
    '*': ['position.x', 'position.y', 'position.anchor', 'position.axis', 'size.width', 'size.height', 'transform.scale', 'transform.rotX', 'transform.rotY', 'transform.rotZ'],
    'Text': ['font.size', 'font.decoration', 'font.family', 'font.orientation', 'content'],
    'RichText': ['content'],
    'Sprite': ['image.position', 'image.repeat', 'image.stretchMode', 'content'],
    'BinarySprite': ['image.position', 'image.repeat', 'image.stretchMode', 'content'],
    'AnimatedSprite': ['image.position', 'image.repeat', 'image.stretchMode', 'content'],
    'Frame': ['children'],
    'Button': ['font.size', 'font.decoration', 'font.family', 'font.orientation', 'content', 'interaction']
  };
  var PARAMETERS = {
    'select': ['values'],
    'number': ['min', 'max', 'step'],
    'text': ['validator']
  };
  var PROPERTIES = {
    'position.x': {
      'type': 'number',
      'default': 0,
    },
    'position.y': {
      'type': 'number',
      'default': 0,
    },
    'position.anchor': {
      'type': 'tuple.number',
      'min': [0, 0],
      'max': [1, 1],
      'step': [0.01, 0.01],
      'default': [0, 0]
    },
    'position.axis': {
      'type': 'select',
      'values': ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      'default': 'top-left',
    },
    'size.width': {
      'type': 'number',
      'min': 0,
      'default': null,
    },
    'size.height': {
      'type': 'number',
      'min': 0,
      'default': null,
    },
    'transform.scale': {
      'type': 'number',
      'min': 0,
      'step': 0.01,
      'default': 1,
    },
    'transform.rotX': {
      'type': 'number',
      'default': 0
    },
    'transform.rotY': {
      'type': 'number',
      'default': 0
    },
    'transform.rotZ': {
      'type': 'number',
      'default': 0
    },
    'font.size': {
      'type': 'number',
      'min': 1,
      'default': 25,
    },
    'font.decoration': {
      'type':'multiselect',
      'values': ['bold', 'italic', 'underline', 'overline', 'line-through', 'shadow', 'outline'],
      'default': [],
    },
    'font.family': {
      'type': 'text',
      'default': null,
    },
    'font.orientation': {
      'type': 'select',
      'values': ['horizontal-tb', 'vertical-rl', 'vertical-lr'],
      'default': 'horizontal-tb'
    },
    'image.position': {
      'type': 'tuple.select',
      'values': [['left', 'right', 'center'], ['top', 'bottom', 'center']],
      'default': ['center', 'center']
    },
    'image.repeat': {
      'type': 'select',
      'values': ['no-repeat', 'repeat-x', 'repeat-y', 'repeat'],
      'default': 'no-repeat'
    },
    'image.stretchMode': {
      'type': 'select',
      'values': ['contain', 'cover', 'fill', 'crop'],
      'default': 'contain'
    },
    'content': {
      'type': 'text',
      'default': '',
    },
    'children': {
      'type': 'list',
      'default': [],
    },
    'frame.overflow': {
      'type': 'select',
      'values': ['hidden', 'visible'],
      'default': 'hidden'
    },
    'interaction': {
      'type': 'text',
      'default': ''
    }
  };

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
    return repr;
  };
  Field.prototype._valueToRepr = function (value) {
    return value;
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
            }, [_Create('text', baseProperties.values[i][j])]))
        }
        fields.push(sel);
      }
    } else {
      for (var i = 0; i < 2; i++) {
        var params = {
          'type': tupleType
        };
        if (tupleType === 'number') {
          PARAMETERS[tupleType].forEach(function (paramName) {
            if (paramName in baseProperties) {
              params[paramName] = baseProperties[paramName][i];
            }
          });
        }
        fields.push(_Create('input', params));
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
        this._copyProperties(baseProperties, PARAMETERS.text);
      } else if (this.type === 'number') {
        baseProperties['type'] = 'number';
        baseProperties['placeholder'] = '(Undefined)';
        this._copyProperties(baseProperties, PARAMETERS.number);
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
        values.push(this.DOM.children[i]);
      }
      this._set(values);
    } else {
      this._set(this.DOM.value);
    }
    if (typeof this.changeListener === 'function') {
      this.changeListener(this.get());
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
    } else {
      if (this._value === null) {
        this.DOM.value = '';
      } else {
        this.DOM.value = this._value;
      }
    }
  };

  Field.prototype.setChangeListener = function (l) {
    if (typeof l === 'function') {
      this.changeListener = l;
    }
  };

  /*********** START CODE FOR PROPERTY MANAGER *****************/
  var PropertyManager = function (propertyBox) {
    this.propertyBox = propertyBox;
    this._fields = {};

    this._visible = [];
  };

  PropertyManager.prototype._buildPropertyField = function (P, propertyName, spec) {
    var shortName = 'property-' + propertyName.replace(
      new RegExp('[^a-zA-Z0-9-]', 'g'), '-');
    var field = new Field(shortName, spec.type, spec);
    var propItem = _Create('div', {
      'className': 'input-group',
      'style': {
        'display': 'none'
      }
    }, [
      _Create('label', {
        'for': shortName
      }, [_Create('text', propertyName)]),
      field.DOM,
      _Create('div', {'className': 'clearfix'}),
    ]);
    this.propertyBox.appendChild(propItem);
    this._fields[propertyName] = {
      'item': propItem,
      'field': field,
    };
    field.setChangeListener(function (value) {
      P.emit('property.' + propertyName + '.change', value);
    });
    P.listen('property.' + propertyName + '.change', (function () {
      
    }).bind(this));
  };

  PropertyManager.prototype._collectiveValues = function (items, propName) {
    if (items.length === 0) {
      return null;
    } else if (items.length === 1) {
      return ReprTools.getObject(items[0])._pm.getProp(propName);
    } else {
      var propList = items.map(function (itemName) {
        return ReprTools.getObject(itemName)._pm.getProp(propName);
      });
      return propList.reduce(function (acc, cur) {
        return acc === cur ? acc : null;
      }, propList[0]);
    }
  };

  PropertyManager.prototype._updatePropertiesList = function (items) {
    // FHide all currently shown properties
    this._visible.forEach((function (prop) {
      this._fields[prop].item.style.display = 'none';
    }).bind(this));

    var displayProperties = [];
    if (items.length > 0) {
      // First set the global ones
      for (var i = 0; i < ENABLED_PROPERTIES['*'].length; i++) {
        displayProperties.push(ENABLED_PROPERTIES['*'][i]);
      }
      // Find the intersection of the remaining properties
      var intersection =
        ENABLED_PROPERTIES[ReprTools.getObjectType(items[0])].slice(0);
      for (var i = 1; i < items.length; i++) {
        var curProps = ENABLED_PROPERTIES[ReprTools.getObjectType(items[i])];
        for (var j = 0; j < intersection.length; j++) {
          if (curProps.indexOf(intersection[j]) < 0) {
            // Does not exist for the current object
            intersection.splice(j, 1);
            j--;
          }
        }
      }
      // Add the shared props
      intersection.forEach(function (prop) {
        displayProperties.push(prop);
      });
    }
    displayProperties.forEach((function (prop) {
      // Show and populate the properties
      this._fields[prop].field.set(this._collectiveValues(items, prop));
      this._fields[prop].item.style.display = '';
    }).bind(this));
    this._visible = displayProperties;
  };

  PropertyManager.prototype.bind = function (P) {
    for (var name in PROPERTIES) {
      this._buildPropertyField(P, name, PROPERTIES[name]);
    }

    P.listen('properties.load', (function (objects) {
      this._updatePropertiesList(objects);
      return objects;
    }).bind(this));

    // Listen for the object selection events to adjust the fields shown
    P.listen('selection.change', (function (items) {
      return P.emit('properties.load', items.to).then(P.next(items));
    }).bind(this));
  };

  return PropertyManager;
})();
