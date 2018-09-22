var Properties = (function () {
  var AVAILABLE_PROPERTIES = {
    '*': ['position.x', 'position.y', 'position.anchor', 'position.axis',
      'size.width', 'size.height', 'transform.scale', 'transform.rotX',
      'transform.rotY', 'transform.rotZ', 'opacity', 'visible'],
    'Text': ['font.size', 'font.decoration', 'font.family', 'font.orientation',
      'font.color', 'content'],
    'RichText': ['content'],
    'Sprite': ['image.position', 'image.repeat', 'image.stretchMode',
      'content'],
    'SVGSprite': [],
    'BinarySprite': ['image.position', 'image.repeat', 'image.stretchMode',
      'content'],
    'AnimatedSprite': ['image.position', 'image.repeat', 'image.stretchMode',
      'content'],
    'Frame': ['children'],
    'Button': ['font.size', 'font.decoration', 'font.family',
      'font.orientation', 'font.color', 'content', 'interaction']
  };

  var PARAMETERS = {
    'select': ['values'],
    'number': ['min', 'max', 'step'],
    'text': ['validator'],
    'color': []
  };

  var DEFAULT_EASING = [
    'linear',
    'quadratic',
    'cubic',
    'circular',
    'sine',
    'exponential'
  ];

  var EASABLE_PROPERTIES = {
    'position.x': DEFAULT_EASING,
    'position.y': DEFAULT_EASING,
    'size.width': DEFAULT_EASING,
    'size.height': DEFAULT_EASING,
    'transform.scale': DEFAULT_EASING,
    'transform.rotX': DEFAULT_EASING,
    'transform.rotY': DEFAULT_EASING,
    'transform.rotZ': DEFAULT_EASING,
    'opacity': DEFAULT_EASING,
    'font.size': DEFAULT_EASING,
    'font.color': ['rgb:linear', 'hsv:linear']
  };

  var SPECS = {
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
    'opacity': {
      'type': 'number',
      'default': 1,
      'step': 0.01,
      'min': 0,
      'max': 1,
    },
    'visible': {
      'type': 'select',
      'values': ['true', 'false'],
      'default': 'true'
    },
    'font.size': {
      'type': 'number',
      'min': 1,
      'default': 25,
    },
    'font.decoration': {
      'type':'multiselect',
      'values': ['bold', 'italic', 'underline', 'overline', 'line-through', 'shadow', 'outline'],
      'default': ['bold', 'outline'],
    },
    'font.family': {
      'type': 'text',
      'default': null,
    },
    'font.color': {
      'type': 'color',
      'default': 0xffffff
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

  var Properties = function () {

  };

  Properties.prototype.enumerateSpecs = function (fn) {
    for(var propName in SPECS) {
      fn(propName, SPECS[propName]);
    }
  };

  Properties.prototype.getParams = function (type) {
    if (type in PARAMETERS) {
      return PARAMETERS[type];
    }
    return [];
  };

  Properties.prototype.getAvailableProperties = function (objects) {
    if (!Array.isArray(objects) || objects.length === 0) {
      return [];
    }
    var base = AVAILABLE_PROPERTIES['*'].slice(0);
    var intersection =
      AVAILABLE_PROPERTIES[ReprTools.getObjectType(objects[0])].slice(0);
    for (var i = 1; i < objects.length; i++) {
      var curProps = AVAILABLE_PROPERTIES[ReprTools.getObjectType(objects[i])];
      for (var j = 0; j < intersection.length; j++) {
        if (curProps.indexOf(intersection[j]) < 0) {
          // Does not exist for the current object
          intersection.splice(j, 1);
          j--;
        }
      }
    }
    intersection.forEach(function (prop) {
      base.push(prop);
    });
    return base;
  }

  Properties.prototype.getAvailableEasing = function (propName) {
    var base = ['none'];
    if (propName in EASABLE_PROPERTIES) {
      for (var i = 0; i < EASABLE_PROPERTIES[propName].length; i++) {
        base.push(EASABLE_PROPERTIES[propName][i]);
      }
    }
    return base;
  }

  // Singleton
  return new Properties();
})();
