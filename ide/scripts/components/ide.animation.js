var AnimationManager = (function () {
  var ANIMATION_SETTINGS = {
    'global.duration': {
      'type': 'number',
      'default': 12000,
      'min': 0,
      'step': 1
    },
  };
  var ANIMATION_GLOBAL_NOTIFY = {
    'global.duration': 'timeline.duration.set'
  }
  var AnimationManager = function (animationWindow, animationInner) {
    this._window = animationWindow;
    this._inner = animationInner;
    this._fields = {};
    this._visible = [];

    this._selectedPins = [];
  };

  AnimationManager.prototype._buildField = function (P, propertyName, spec, show) {
    var shortName = 'animation-setting-' + propertyName.replace(
      new RegExp('[^a-zA-Z0-9-]', 'g'), '-');
    var field = new MiniWindow.Field(shortName, spec.type, spec);
    var propItem = _Create('div', {
      'className': 'input-group',
      'style': {
        'display': !show ? 'none' : ''
      }
    }, [
      _Create('label', {
        'for': shortName
      }, [_Create('text', propertyName)]),
      field.DOM,
      _Create('div', {'className': 'clearfix'}),
    ]);
    this._inner.appendChild(propItem);
    this._fields[propertyName] = {
      'item': propItem,
      'field': field,
    };
    field.setChangeListener(function (value) {
      P.emit('animation.setting.change', {
        'propertyName': propertyName,
        'value': value
      });
    });
  };

  AnimationManager.prototype._updateAnimationSettings = function (pins, change) {
    for (var i = 0; i < pins.length; i++) {
      var key = ReprTools.getObject(pins[i].track)._pm.getKeyFrame(pins[i].end);
      var originalEasing = null;
      for (var easing in key.spec) {
        if (change.propertyName in key.spec[easing]) {
          originalEasing = easing;
          break;
        }
      }
      // Found the source easing, maybe
      if (originalEasing === null) {
        continue; // Does not apply to this pin
      }
      if (originalEasing === change.value) {
        continue; // Already set to correct value
      }
      if (!(change.value in key.spec)) {
        key.spec[change.value] = {};
      }
      key.spec[change.value][change.propertyName] =
        key.spec[originalEasing][change.propertyName];
      delete key.spec[originalEasing][change.propertyName];
    }
  };

  AnimationManager.prototype._updateAnimationPropertiesList = function (pins) {
    // Hide all currently shown properties
    this._visible.forEach((function (prop) {
      this._fields[prop].item.style.display = 'none';
    }).bind(this));

    // Get all the properties involved
    this._visible = [];
    var values = {};
    for (var i = 0; i < pins.length; i++) {
      var key = ReprTools.getObject(pins[i].track)._pm.getKeyFrame(pins[i].end);
      for (var easing in key.spec) {
        for (var prop in key.spec[easing]) {
          if (!(prop in values)) {
            values[prop] = easing
          } else if (values[prop] === easing) {
            values[prop] = easing;
          } else {
            values[prop] = null;
          }
          if (this._visible.indexOf(prop) < 0) {
            this._visible.push(prop);
          }
        }
      }
    }
    this._visible.forEach((function (prop) {
      this._fields[prop].field.set(values[prop]);
      this._fields[prop].item.style.display = '';
    }).bind(this));
  };

  AnimationManager.prototype._bindPinEvents = function (P) {
    P.listen('timeline.pins.added', (function (pin) {
      ReprTools.getObject(pin.objectName)._pm.createKeyFrame(
        pin.start, pin.end);
      return pin;
    }).bind(this));
    P.listen('timeline.pins.removed', (function (pin) {
      ReprTools.getObject(pin.objectName)._pm.removeKeyFrame(
        pin.end);
      return pin;
    }).bind(this));
    P.listen('timeline.pins.resized', (function (pin) {
      ReprTools.getObject(pin.objectName)._pm.resizeKeyFrame(
        pin.time, pin.start, pin.end);
      return pin;
    }).bind(this));

    // Listen for the object selection events to adjust the fields shown
    P.listen('timeline.pins.selected', (function (items) {
      this._selectedPins = items;
      return P.emit('animation.properties.load').then(P.next(items));
    }).bind(this));
    P.listen('object.setProperty', (function (e) {
      return P.emit('animation.properties.load').then(P.next(e));
    }).bind(this));
  };

  AnimationManager.prototype._bindSettingChangeEvents = function (P) {
    P.listen('animation.setting.change', (function (change) {
      if (change.propertyName in ANIMATION_GLOBAL_NOTIFY) {
        // This is a global setting
        return P.emit(ANIMATION_GLOBAL_NOTIFY[change.propertyName],
            change.value).then(P.next(change));
      } else {
        // Hmm
        this._updateAnimationSettings(this._selectedPins, change);
        return change;
      }
    }).bind(this));
  };

  AnimationManager.prototype.bind = function (P) {
    for (var propName in ANIMATION_SETTINGS) {
      this._buildField(P, propName, ANIMATION_SETTINGS[propName], true);
    }
    Properties.enumerateSpecs((function (propName, spec) {
      this._buildField(P, propName, {
        'type': 'select',
        'values': Properties.getAvailableEasing(propName),
        'default': 'none'
      }, false);
    }).bind(this));

    P.listen('animation.properties.load', (function () {
      this._updateAnimationPropertiesList(this._selectedPins);
    }).bind(this));

    this._bindPinEvents(P);
    this._bindSettingChangeEvents(P);
  };

  return AnimationManager;
})();
