// Internal Representation for the IDE

var Repr = {
  'uiState': {
    'config': {
      'historyMax': 48,
    },
    'selectedLayer': 'default'
  },
  'workspace': {
    'objects': {},
    'layers': {
      'default': {
        'components': []
      }
    },
    'metadata': {
      'animation': {
        'duration': 12000,
      }
    }
  }
};

// Shared object that deals with selection
var Selection = new function() {
  var selection = [];

  // Multi-select enabler
  this.multiSelect = function (itemName, operation) {
    var currentSelection = this.get();
    if (!ReprTools.objectExists(itemName)) {
      return currentSelection;
    }
    var index = currentSelection.indexOf(itemName);
    if (operation === 'add') {
      if (index < 0) {
        currentSelection.push(itemName);
        return currentSelection.sort();
      }
      return currentSelection;
    } else if (operation === 'remove') {
      if (index >= 0) {
        currentSelection.splice(index, 1);
        return currentSelection;
      }
      return currentSelection;
    } else if (operation === 'toggle') {
      if (index < 0) {
        return this.multiSelect(itemName, 'add');
      } else {
        return this.multiSelect(itemName, 'remove');
      }
    } else {
      throw new Error('Unrecognized operation ' + operation);
    }
  };

  this.isSelected = function (items) {
    if (!Array.isArray(items)) {
      return selection.indexOf(items) >= 0;
    } else {
      // Checking a set
      return items.every((function (item) {
        return this.isSelected(item);
      }).bind(this));
    }
  };

  this.set = function (items) {
    if (!Array.isArray(items)) {
      throw new Error('Expected selection to be an array');
    }
    selection = items.sort();
    return true;
  };
  this.get = function () {
    return selection.slice(0);
  };
  this.count = function () {
    return selection.length;
  };
};

// Tools for working with the repr
var ReprTools = new function() {
  var names = {};
  /** Type Related **/
  this.typeAsTool = function (type, tool) {
    switch (type) {
      case 'Text':
      case 'RichText':
        return tool === 'text';
      case 'Button':
        return tool === 'button';
      case 'Frame':
        return tool === 'frame';
      case 'Sprite':
      case 'SVGSprite':
      case 'Bitmap':
      case 'AnimatedSprite':
        return tool === 'sprite';
    }
    return false;
  };

  /** UI Related **/
  this.callOnGroup = function (items, methodName) {
    var args = [];
    for (var i = 2; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    items.forEach((function (objName) {
      var obj = this.getObject(objName);
      if (methodName in obj) {
        obj[methodName].apply(obj, args);
      }
    }).bind(this));
  };

  /** Timeline and animation related **/
  this.duration = function () {
    return Repr.workspace.metadata.animation.duration;
  };
  this.getKeyFrames = function (objName) {
    // Figure out the key frame for an object
    return;
  };

  /** Workspace related **/
  this.getUniqueName = function (prefix) {
    if (typeof prefix !== 'string' || prefix === null || prefix === '') {
      prefix = 'Object';
    }
    if (!(prefix in names)) {
      names[prefix] = 0;
    }
    var name = prefix + '-' + (names[prefix]++);
    while (this.objectExists(name)) {
      name = prefix + '-' + (names[prefix]++);
    }
    return name;
  };

  /** Objects Stuff **/
  this.objectExists = function (name) {
    return name in Repr.workspace.objects;
  };
  this.getObjectType = function (name) {
    var type = this.getObject(name).type;
    if (typeof type !== 'string') {
      return 'Unknown';
    }
    return type;
  };
  this.getObject = function (name) {
    if (!this.objectExists(name)) {
      throw new Error('Object ' + name + ' does not exist!');
    }
    return Repr.workspace.objects[name];
  };
  this.addObject = function (name, object, layer) {
    if (object.name !== name) {
      throw new Error('Object has different name from slot name!');
    }
    if (this.objectExists(name)) {
      throw new Error('Object with ' + name + ' already exists.');
    }
    if (typeof layer !== 'string' || layer === null || layer === '') {
      layer = 'default';
    }
    if (!this.layerExists(layer)) {
      this.addLayer(layer);
    }
    Repr.workspace.objects[name] = object;
    var layerRef = Repr.workspace.layers[layer];
    layerRef.components.push(name);
  };
  this.removeObject = function (name) {
    if (!this.objectExists(name)) {
      return false;
    }
    delete Repr.workspace.objects[name];
    // Delete reference from layers
    var _fnFilter = function (objName) {
      return objName !== name;
    };
    for (var layer in Repr.workspace.layers) {
      Repr.workspace.layers[layer].components =
        Repr.workspace.layers[layer].components.filter(_fnFilter);
    }
    return true;
  };
  this.renameObject = function (oldName, newName) {
    // First make sure no conflicts are possible
    if (this.objectExists(newName)) {
      throw new Error('Cannot rename ' + oldName + ' to ' + newName +
        ': Naming conflict.');
    }
    // OK we're good to go
    var objRef = this.getObject(oldName);
    objRef.rename(newName);
    delete Repr.workspace.objects[oldName];
    Repr.workspace.objects[newName] = objRef;
    // Now scan the workspace and figure out if anything references the old name
    var _fnRemap = function (objName) {
      return objName === oldName ? newName : objName;
    };
    Selection.set(Selection.get().map(_fnRemap));

    // Update references in layers
    for (var layer in Repr.workspace.layers) {
      Repr.workspace.layers[layer].components =
        Repr.workspace.layers[layer].components.map(_fnRemap);
    }
    return true;
  }
  /** Layer Stuff **/
  this.layerExists = function (name) {
    return name in Repr.workspace.layers;
  };
  this.addLayer = function (layerName) {
    if (this.layerExists(layerName)) {
      return false; // Do nothing. This is not fatal.
    }
    Repr.workspace.layers[layerName] = {
      'components': []
    };
    return true;
  };
}
