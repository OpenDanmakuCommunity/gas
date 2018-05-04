// Internal Representation for the IDE

var Repr = {
  'uiState': {
    'config': {
      'historyMax': 48,
    },
    'selectedTool': 'select',
    'selectedObjects': [],
    'selectedLayer': '',
    'timeline': {
      'playhead': 0
    }
  },
  'bindings': {
    'tracks': {}
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
        'duration': 10000,
      }
    }
  }
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
  this.multiSelect = function (itemName, operation) {
    var selection = Repr.uiState.selectedObjects.slice(0);
    if (!this.objectExists(itemName)) {
      return selection;
    }
    var index = selection.indexOf(itemName);
    if (operation === 'add') {
      if (index < 0) {
        selection.push(itemName);
        return selection.sort();
      }
      return selection;
    } else if (operation === 'remove') {
      if (index >= 0) {
        selection.splice(index, 1);
        return selection;
      }
      return selection;
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
  this.setSelected = function (items) {
    if (!Array.isArray(items)) {
      if (typeof items === 'string') {
        items = [items];
      } else {
        throw new Error('Illegal value for setting selected!');
      }
    }
    items = items.filter((function (item) {
      return this.objectExists(item);
    }).bind(this));
    // Set objects and tracks focus
    for (var i = 0; i < Repr.uiState.selectedObjects.length; i++) { 
      this.getObject(Repr.uiState.selectedObjects[i]).setFocus(false);
      var row = this.getTrack(Repr.uiState.selectedObjects[i]).row;
      _ToggleClass(row, 'selected', false);
      try {
        row.scrollIntoView();
      } catch (e) {}
    }
    for (var j = 0; j < items.length; j++){
      this.getObject(items[j]).setFocus(true);
      var row = this.getTrack(items[j]).row;
      _ToggleClass(row, 'selected', true);
      try {
        row.scrollIntoView();
      } catch (e) {}
    }
    Repr.uiState.selectedObjects = items.sort();
    return true;
  };
  
  /** Timeline Related **/
  this.timeToPixels = function (time) {
    return Math.floor(time / 10);
  };
  this.duration = function () {
    return Repr.workspace.metadata.animation.duration;
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
  this.bindTrack = function (trackName, trackObj) {
    Repr.bindings.tracks[trackName] = trackObj;
  }
  this.getTrack = function (trackName) {
    if (!trackName in Repr.bindings.tracks) {
      throw new Error('Could not find track ' + trackName);
    }
    return Repr.bindings.tracks[trackName];
  }

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
  this.renameObject = function (oldName, newName) {
    // First make sure no conflicts are possible
    if (this.objectExists(newname)) {
      throw new Error('Cannot rename ' + change.oldName + ' to ' +
        change.newName + ': Naming conflict.');
    }
    // OK we're good to go
    var objRef = this.getObject(oldName);
    objRef.name = newName;
    delete Repr.workspace.objects[oldName];
    Repr.workspace.objects[newName] = objRef;
    // Now scan the workspace and figure out if anything references the old name
    var _fnRemap = function (objName) {
      return objName === oldName ? newName : objName;
    };
    Repr.uiState.selectedObjects = Repr.uiState.selectedObjects.map(_fnRemap);
    // Update references in layers
    for (var layer in Repr.workspace.layers) {
      Repr.workspace.layers[layer].components =
        Repr.workspace.layers[layer].components.map(_fnRemap);
    }
    // Frames reference objects directly so nothing to do there
    // Rename the tracks
    Repr.bindings.tracks[newName] = Repr.bindings.tracks[oldName];
    delete Repr.bindings.tracks[oldName];
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

var GText = (function () {
  var GText = function (spec) {
    this.DOM = null;
    this.type = 'Text';
    this.name = spec.name;
    this.spec = spec;

    this.load();
  };
  
  GText.prototype.getProp = function (propertyName, def) {
    var keys = propertyName.split('.');
    var curSpec = this.spec;
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] in curSpec) {
        curSpec = curSpec[keys[i]];
      } else {
        return def;
      }
    }
    return curSpec;
  };
  
  GText.prototype.load = function () {
    if (this.DOM === null) {
      this.DOM = _Create('div', {
        'className': 'text',
        'ide-object-name': this.name
      }, [
        _Create('text', this.getProp('text', '(Example)'))
      ]);
      this.DOM.style.position = 'absolute';
      this.DOM.style.left = this.getProp('position.x', 0) + 'px';
      this.DOM.style.top = this.getProp('position.y', 0) + 'px';
    }
  };

  GText.prototype.setFocus = function (hasFocus) {
    _ToggleClass(this.DOM, 'item-focus', hasFocus);
  };

  GText.prototype.stageItem = function () {
    return this.DOM;
  }
  return GText;
})();

var GSprite = (function () {
  var GSprite = function (spec) {
    this.P = pettan;
  };
  return GSprite;
})();

var GButton = (function () {
  var GButton = function (spec) {
    this.P = pettan;
  };
  return GButton;
})();

// Singleton factory
var GFactory = new function () {
  this.createFromSpec = function (spec) {
    switch (spec.type) {
      case 'Text':
      case 'RichText':
        return new GText(spec);
      case 'Button':
        return new GButton(spec);
      case 'Sprite':
        return new GSprite(spec);
      default:
        throw new Error('Spec had type ' + spec.type + ' but it was not recognized.');
    }
  };
};

