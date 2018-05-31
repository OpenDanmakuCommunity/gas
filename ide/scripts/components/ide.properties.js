var PropertyManager = (function () {
  if (!Properties) {
    throw new Error('Could not read properties definition');
  }

  var PropertyManager = function (propertyWindow, propertyBox) {
    this.propertyWindow = propertyWindow;
    this.propertyBox = propertyBox;
    this._fields = {};

    this._visible = [];
  };

  PropertyManager.prototype._buildPropertyField = function (P, propertyName, spec) {
    var shortName = 'property-' + propertyName.replace(
      new RegExp('[^a-zA-Z0-9-]', 'g'), '-');
    var field = new MiniWindow.Field(shortName, spec.type, spec);
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
      P.emit('property.change', {
        'propertyName': propertyName,
        'value': value
      });
    });
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
    // Hide all currently shown properties
    this._visible.forEach((function (prop) {
      this._fields[prop].item.style.display = 'none';
    }).bind(this));

    this._visible = Properties.getAvailableProperties(items);
    this._visible.forEach((function (prop) {
      // Show and populate the properties
      this._fields[prop].field.set(this._collectiveValues(items, prop));
      this._fields[prop].item.style.display = '';
    }).bind(this));
  };

  PropertyManager.prototype.bind = function (P) {
    Properties.enumerateSpecs((function (name, spec) {
      this._buildPropertyField(P, name, spec);
    }).bind(this));

    // Bind to the property change event
    P.listen('property.change', (function (propSpec) {
      // Change the property for the selected elements
      return Promise.all(Selection.get().map(function (objectName) {
        return P.emit('object.setProperty', {
          'objectName': objectName,
          'propertyName': propSpec.propertyName,
          'value': propSpec.value,
        });
      })).then(P.next(propSpec));
    }).bind(this));

    P.listen('properties.load', (function (objects) {
      this.propertyWindow.autoToggleCollapse(objects.length === 0);
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
