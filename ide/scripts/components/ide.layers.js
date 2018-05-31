var LayerManager = (function () {
  var LayerManager = function (layerList, buttons) {
    if (!Repr || !_Create) {
      throw new Error('Global Stuff not loaded!');
    }

    this._layerList = layerList;
    this._buttons = buttons;
    this._layers = {};
    this._mapping = {};
  };

  LayerManager.prototype._createLayerItem = function (P, name) {
    var label = _Create('div', {'className': 'text'}, [_Create('text', name)]);
    var upBtn = _Create('div', {'className': 'group-button pull-right'}, 
      [_Create('text', '\u2191')]);
    var downBtn = _Create('div', {'className': 'group-button pull-right'}, 
      [_Create('text', '\u2193')]);
    var listItem = _Create('div', {
      'className': 'input-group layer'
    }, [
      label,
      upBtn,
      downBtn,
      _Create('div', {'className': 'clearfix'})
    ]);
    this._layers[name] = {
      'listItem': listItem,
      'label': label
    };
    this._layerList.appendChild(listItem);
  };

  LayerManager.prototype._removeLayerItem = function (P, name) {
    
  };

  LayerManager.prototype._renameLayerItem = function (P, oldName, newName) {
    this._layers[newName] = this._layers[oldName];
    delete this._layers[oldName];
    this._layers[newName].label.innerText = newName;
  };

  LayerManager.prototype._createMapping = function (P, name, layer) {
    var label = _Create('div', {'className': 'text'}, [_Create('text', name)]);
    var upBtn = _Create('div', {'className': 'group-button pull-right'}, 
      [_Create('text', '\u2191')]);
    var downBtn = _Create('div', {'className': 'group-button pull-right'}, 
      [_Create('text', '\u2193')]);
    var listItem = _Create('div', {
      'className': 'input-group'
    }, [
      label,
      upBtn,
      downBtn,
      _Create('div', {'className': 'clearfix'})
    ]);
    this._mapping[name] = {
      'listItem': listItem,
      'label': label,
      'layer': layer
    };
    P.bind(listItem, 'mousedown', 'layers.object.' + name + '.click');
    var objectAfter = ReprTools.objectLower(name, 'default');
    console.log(objectAfter);
    var listItemAfter = objectAfter === null ?
      this._layers[layer].listItem.nextSibing :
        this._mapping[objectAfter].listItem;
    this._layerList.insertBefore(listItem, listItemAfter);
  };

  LayerManager.prototype._removeMapping = function (P, name) {
    this._layerList.removeChild(this._mapping[name].listItem);
    // Drop all listeners
    P.drop('layers.object.' + name + '.click');
    delete this._mapping[name];
  };

  LayerManager.prototype._renameMapping = function (P, oldName, newName) {
    this._mapping[newName] = this._mapping[oldName];
    delete this._mapping[oldName];
    // Rename the label
    this._mapping[newName].label.innerText = newName;

    // Change all the event bindings
    P.rename('layers.object.' + oldName + '.click',
      'layers.object.' + newName + '.click');
  };

  LayerManager.prototype._bindObjects = function (P) {
    P.listen('objects.added', (function (data) {
      // Add object to the default layer
      ReprTools.assignLayer(data.name, 'default');
      this._createMapping(P, data.name, 'default');
      return data;
    }).bind(this));

    P.listen('objects.removed', (function (data) {
      // Remove object from workspace
      ReprTools.unassignLayer(data.name, this._mapping[data.name].layer);
      // Delete from mapping table
      this._removeMapping(P, data.name);
      return data;
    }).bind(this));

    P.listen('objects.renamed', (function (nameSpec) {
      // Update the mapping so we can resolve the layers
      this._renameMapping(P, nameSpec.oldName, nameSpec.newName);
      return nameSpec;
    }).bind(this));
  };

  LayerManager.prototype._bindButtons = function (P) {
    
  };

  LayerManager.prototype.bind = function (P) {
    // Insert the default layer. It is always present
    this._createLayerItem(P, 'default');

    // Bind with object modification
    this._bindObjects(P);

    // Bind with the add layer buttons
    this._bindButtons(P);

    P.listen('layers.load', (function (layerName) {
      return layerName;
    }).bind(this));

    P.listen('layers.add', (function (layerName) {
      if (ReprTools.layerExists(layerName)) {
        throw new Error('Layer "' + layerName + '" already exists!');
      }
      ReprTools.addLayer(layerName);
      this._createLayerItem(P, layerName);
      return layerName;
    }).bind(this));

    P.listen('layers.rename', (function (nameSpec) {
      ReprTools.renameLayer(nameSpec.oldName, nameSpec.newName);
      this._renameLayerItem(P, nameSpec.oldName, nameSpec.newName);
      return layerName;
    }).bind(this))
  };

  return LayerManager;
})();