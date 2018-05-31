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
      [_Create('text', '\u21e7')]);
    var downBtn = _Create('div', {'className': 'group-button pull-right'},
      [_Create('text', '\u21e9')]);
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
    if (!name in this._layers) {
      throw new Error('Layer with name "' + name + '" not found!');
    }
    this._layerList.removeChild(listItem);
  };

  LayerManager.prototype._renameLayerItem = function (P, oldName, newName) {
    this._layers[newName] = this._layers[oldName];
    delete this._layers[oldName];
    this._layers[newName].label.innerText = newName;
  };

  LayerManager.prototype._createMapping = function (P, name, layer) {
    var label = _Create('div', {'className': 'text'}, [_Create('text', name)]);
    var upBtn = _Create('div', {'className': 'group-button pull-right'},
      [_Create('text', '\u21e7')]);
    var downBtn = _Create('div', {'className': 'group-button pull-right'},
      [_Create('text', '\u21e9')]);
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
    var objectAfter = LayerTools.objectLower(name, 'default');

    var listItemAfter = objectAfter === null ?
      this._layers[layer].listItem.nextSibling :
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
      LayerTools.assignLayer(data.name, 'default');
      this._createMapping(P, data.name, 'default');
      return data;
    }).bind(this));

    P.listen('objects.removed', (function (data) {
      // Remove object from workspace
      LayerTools.unassignLayer(data.name, this._mapping[data.name].layer);
      // Delete from mapping table
      this._removeMapping(P, data.name);
      return data;
    }).bind(this));

    P.listen('objects.renamed', (function (nameSpec) {
      // Update the mapping so we can resolve the layers
      this._renameMapping(P, nameSpec.oldName, nameSpec.newName);
      return nameSpec;
    }).bind(this));

    P.listen('objects.reflow', (function (spec) {
      // Move the object within its layer
      LayerTools.moveObject(spec.source, spec.sourceLayer,
        spec.target, spec.targetLayer);
      this._mapping[spec.source].layer = spec.targetLayer;
      if (spec.target === null) {
        this._layerList.insertBefore(this._mapping[spec.source].listItem,
          this._layers[spec.targetLayer].listItem.nextSibling);
      } else {
        this._layerList.insertBefore(this._mapping[spec.source].listItem,
          this._mapping[spec.target].listItem.nextSibling);
      }
      return spec;
    }).bind(this));
  };

  LayerManager.prototype._bindButtons = function (P) {
    P.bind(this._buttons.add, 'mousedown', 'layers.btn.add');
    P.listen('layers.btn.add', (function (e) {
      return e;
    }).bind(this));

    P.bind(this._buttons.orderUp, 'click', 'layers.btn.orderUp');
    P.listen('layers.btn.orderUp', (function (e) {
      try {
        e.event.target.blur();
      } catch (err) {}
      // Refloat each object
      return Selection.get().reduce((function (base, itemName) {
        var self = this;
        return base.then(function () {
          var higher = LayerTools.objectHigher(itemName,
            self._mapping[itemName].layer);
          if (higher === null) {
            return Promise.resolve();
          }
          return P.emit('objects.reflow', {
            'source': itemName,
            'sourceLayer': self._mapping[itemName].layer,
            'target': LayerTools.objectHigher(higher,
              self._mapping[itemName].layer),
            'targetLayer': self._mapping[itemName].layer,
          });
        });
      }).bind(this), Promise.resolve()).then(P.next(e));
    }).bind(this));

    P.bind(this._buttons.orderDown, 'click', 'layers.btn.orderDown');
    P.listen('layers.btn.orderDown', (function (e) {
      try {
        e.event.target.blur();
      } catch (err) {}
      // Refloat each object
      return Selection.get().reduce((function (base, itemName) {
        var self = this;
        return base.then(function () {
          var lower = LayerTools.objectLower(itemName,
            self._mapping[itemName].layer);
          if (lower === null) {
            return Promise.resolve();
          } else {
            return P.emit('objects.reflow', {
              'source': itemName,
              'sourceLayer': self._mapping[itemName].layer,
              'target': lower,
              'targetLayer': self._mapping[itemName].layer,
            });
          }
        });
      }).bind(this), Promise.resolve()).then(P.next(e));
    }).bind(this));
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
      if (LayerTools.layerExists(layerName)) {
        throw new Error('Layer "' + layerName + '" already exists!');
      }
      LayerTools.addLayer(layerName);
      this._createLayerItem(P, layerName);
      return layerName;
    }).bind(this));

    P.listen('layers.rename', (function (nameSpec) {
      LayerTools.renameLayer(nameSpec.oldName, nameSpec.newName);
      this._renameLayerItem(P, nameSpec.oldName, nameSpec.newName);
      return layerName;
    }).bind(this))
  };

  return LayerManager;
})();
