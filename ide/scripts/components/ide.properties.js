var PropertyManager = (function () {
  var ENABLED_PROPERTIES = {
    'Text': ['position.x', 'position.y', 'size.width', 'size.height',
      'font.size', 'font.family', 'font.decoration', 'content'],
    'Sprite': ['position.x', 'position.y', 'size.width', 'size.height',
      'content'],
    'Frame': ['position.x', 'position.y', 'size.width', 'size.height',
      'children'],
    'Button': ['position.x', 'position.y', 'size.width', 'size.height',
      'font.size', 'font.family', 'font.decoration', 'content', 'interaction']
  };
  var PROPERTIES = {
    'position.x': {
      'type': 'number',
      'min': 0,
      'default': 0,
    },
    'position.y': {
      'type': 'number',
      'min': 0,
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
      'type': 'number',
      'default': 0,
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
      'type':'text',
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
      'type': 'tuple.number',
      'default': null
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
      'default': '(Example)',
    },
    'children': {
      'type': 'list',
      'default': [],
    },
    'interaction': {
      'type': 'text',
      'default': ''
    }
  };

  var PropertyManager = function (propertyBox) {
    this.propertyBox = propertyBox;
    this._fields = {};
  };

  PropertyManager.prototype._buildPropertyField = function (P, propertyName, spec) {
    var shortName = 'property-' + propertyName.replace(
      new RegExp('[^a-zA-Z0-9-]', 'g'), '-');
    if (spec.type === 'text' || spec.type === 'number') {
      var fieldProps = {
        'id': shortName
      };
      for (var prop in spec) {
        if (prop === 'default') {
          if (spec[prop] !== null) {
            fieldProps['value'] = spec[prop];
          }
        } else {
          fieldProps[prop] = spec[prop];
        }
      }
      var field = _Create('input', fieldProps);
    } else if (spec.type.indexOf('tuple.') === 0) {
      var field = _Create('input', {
        'type': 'text',
        'id': shortName,
      });
    } else if (spec.type === 'select'){
      var fieldProps = {
        'id': shortName
      };
      if ('default' in spec && spec.default !== null) {
        fieldProps['value'] = spec.default
      }
      var field = _Create('select', fieldProps);
      for (var i = 0; i < spec.values.length; i++) {
        field.appendChild(_Create('option', {
          'value': spec.values[i]
        }, [_Create('text', spec.values[i])]));
      }
    } else {
      var field = _Create('input', {
        'type': 'text',
        'id': shortName,
        'value': '(Unsupported)',
        'disabled': true
      });
    }
    var propItem = _Create('div', {
      'className': 'input-group'
    }, [
      _Create('label', {
        'for': shortName
      }, [_Create('text', propertyName)]),
      field,
      _Create('div', {'className': 'clearfix'}),
    ]);
    this.propertyBox.appendChild(propItem);
  };

  PropertyManager.prototype.bind = function (P) {
    for (var name in PROPERTIES) {
      this._buildPropertyField(P, name, PROPERTIES[name]);
    }
  };

  return PropertyManager;
})();
