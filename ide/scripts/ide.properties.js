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
      'max': 2048,
      'default': 0,
    },
    'position.y': {
      'type': 'number',
      'min': 0,
      'max': 2048,
      'default': 0,
    },
    'size.width': {
      'type': 'number',
      'min': 0,
      'max': 2048,
      'default': null,
    },
    'size.height': {
      'type': 'number',
      'min': 0,
      'max': 2048
      'default': null,
    },
    'font.size': {
      'type': 'number',
      'min': 1,
      'max': 2048,
      'default': 25,
    },
    'font-decoration': {
      'type':'text',
      'values': ['bold', 'italic', 'underline', 'overline', 'line-through', 'shadow', 'outline'],
      'default': [],
    },
    'font-family': {
      'type': 'text',
      'default': null,
    },
    'content': {
      'type': 'text',
      'default': '',
    },
    'children': {
      'type': 'list',
      'default': [],
    },
    'interaction': {
      'type': 'list',
      'default': []
    }
  }

  var PropertyManager = function () {

  };

  PropertyManager.prototype.bind = function (P) {

  };

  return PropertyManager;
})();
