// Internal Representation for the project
var Repr = {
  'workspace': {
    'objects': {},
    'layers': {
      'order': ['default'],
      'defs': {
        'default': {
          'components': []
        }
      }
    },
    'metadata': {
      'stage': {
        'width': 640,
        'height': 480,
        'autoScale': true
      },
      'interactions': {},
      'layers': {
        'orphans': 'hide',
        'defaultMixing': 'none'
      },
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
  this.remove = function (name) {
    var index = selection.indexOf(name);
    if (index >= 0) {
      selection.splice(index, 1);
    }
    return;
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
  this.getDuration = function () {
    return Repr.workspace.metadata.animation.duration;
  };
  this.setDuration = function (duration) {
    if (typeof duration !== 'number' || isNaN(duration)) {
      throw new Error('Duration must be a non-NaN number!');
    }
    Repr.workspace.metadata.animation.duration = duration;
  };

  /** Canvas related **/
  this.setStageSize = function (width, height) {
    if (typeof width !== 'number' || typeof height !== 'number' || isNaN(width)
      || isNaN(height)) {
      throw new Error('Width and Height must be non-NaN numbers!');
    }
    width = Math.floor(width);
    height = Math.floor(height);
    if (width <= 0 || height <= 0) {
      throw new Error('Width and height must be positive.')
    }
    Repr.workspace.metadata.stage.width = width;
    Repr.workspace.metadata.stage.height = height;
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
    Repr.workspace.objects[name] = object;
  };
  this.removeObject = function (name) {
    if (!this.objectExists(name)) {
      return false;
    }
    delete Repr.workspace.objects[name];
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

    // Update any references in layers
    for (var layer in Repr.workspace.layers.defs) {
      Repr.workspace.layers.defs[layer].components =
        Repr.workspace.layers.defs[layer].components.map(_fnRemap);
    }
    return true;
  }
  this.allObjectNames = function () {
    var names = [];
    for (var name in Repr.workspace.objects) {
      names.push(name);
    }
    return names;
  };
}

var LayerTools = new function () {
  this.allLayerNamesOrdered = function () {
    return Repr.workspace.layers.order.slice(0);
  }
  this.layerExists = function (name) {
    return name in Repr.workspace.layers.defs;
  };
  this.getLayer = function (layerName) {
    if (!this.layerExists(layerName)) {
      throw new Error('Layer ' + layerName + ' does not exist!');
    }
    return Repr.workspace.layers.defs[layerName];
  };
  this.addLayer = function (layerName) {
    if (this.layerExists(layerName)) {
      return false; // Do nothing. This is not fatal.
    }
    Repr.workspace.layers.defs[layerName] = {
      'components': []
    };
    Repr.workspace.layers.order.push(layerName);
    return true;
  };
  this.removeLayer = function (layerName) {
    if (layerName === 'default') {
      throw new Error('Cannot remove the default layer!');
    }
    if (!this.layerExists(layerName)) {
      return;
    }
    // Layer cannot be deleted if its not empty
    if (!this.getLayer(layerName).components.length > 0) {
      throw new Error('Layer cannot be deleted unless it is empty!');
    }
    Repr.workspace.layers.order =
      Repr.workspace.layers.order.filter(function (name) {
        return name !== layerName;
      });
    delete Repr.workspace.layers.defs[layerName];
  };
  this.renameLayer = function (oldName, newName) {
    if (!this.layerExists(oldName)) {
      throw new Error('Layer "' + oldName + '" does not exist');
    }
    if (this.layerExists(newName)) {
      throw new Error('Naming Conflict: Layer "' + newName +
        '" already exists');
    }
    Repr.workspace.layers.defs[newName] = Repr.workspace.layers.defs[oldName];
    Repr.workspace.layers.order = Repr.workspace.layers.order.map(
      function (name) {
        return name === oldName ? newName : name;
      });
  };
  this.moveLayer = function (name, after) {
    // Moves the layer in the ordering. Note, after indicates order in array
    // which is opposite of display order
    if (name === 'default') {
      throw new Error('Cannot move the default layer!');
    }
    if (name === after) {
      throw new Error('Cannot move a layer after itself!');
    }
    if (!this.layerExists(name) || !this.layerExists(after)) {
      throw new Error('Layer does not exist.');
    }
    var newOrder = Repr.workspace.layers.order.filter(function (name) {
        return name !== layerName;
      });
    var itemIndex = newOrder.indexOf(after);
    newOrder.splice(itemIndex + 1, 0, name);
    Repr.workspace.layers.order = newOrder;
  };
  this.objectHigher = function (name, layerName) {
    if(!ReprTools.objectExists(name)) {
      throw new Error('Object does not exist');
    }
    var layer = this.getLayer(layerName);
    var index = layer.components.indexOf(name) + 1;
    return index < layer.components.length ? layer.components[index] : null;
  };
  this.objectLower = function (name, layerName) {
    if(!ReprTools.objectExists(name)) {
      throw new Error('Object does not exist');
    }
    var layer = this.getLayer(layerName);
    var index = layer.components.indexOf(name) - 1;
    return index >= 0 ? layer.components[index] : null;
  };
  this.findLayer = function (name) {

  };
  this.assignLayer = function (name, layerName) {
    // Assigns a layer to the object
    if (!ReprTools.objectExists(name)) {
      throw new Error('Object does not exist');
    }
    if (!this.layerExists(layerName)) {
      this.addLayer(layerName);
    }
    var layer = this.getLayer(layerName);
    layer.components.push(name);
  };
  this.unassignLayer = function (name, layerName) {
    // Removes item from layer. Can only be done when the object is not
    // registered anymore
    if (ReprTools.objectExists(name)) {
      throw new Error('Object still exists. Can\'t detach! Please use move.');
    }
    var layer = this.getLayer(layerName);
    layer.components = layer.components.filter(function (n) {
      return n !== name;
    });
  };
  this.moveObject = function (name, layerName, target, targetLayerName) {
    // Move the object in a layer after some other object
    if (!this.layerExists(layerName) || !this.layerExists(targetLayerName)) {
      throw new Error('Layer does not exist!');
    }
    if (!ReprTools.objectExists(name) ||
      (target !== null && !ReprTools.objectExists(target))) {
      throw new Error('Object does not exist!');
    }
    var sourceLayer = this.getLayer(layerName);
    var targetLayer = this.getLayer(targetLayerName);
    var idxSource = sourceLayer.components.indexOf(name);
    sourceLayer.components.splice(idxSource, 1); // Remove from sourceLayer
    if (target === null) {
      targetLayer.components.push(name);
    } else {
      var idxTarget = targetLayer.components.indexOf(target);
      targetLayer.components.splice(idxTarget, 0, name);
    }
  };
};
