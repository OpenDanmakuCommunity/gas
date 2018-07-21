var MacroManager = (function () {
  var DEFAULT_MACROS = {
    'explode': {
      'description': 'Move selected items away from/close to their center. ' +
        'When option > 1 items move away from each other and ' + 
        'when option < 1 they move toward each other.',
      'author': 'Demo',
      'options': {'type': 'number', 'default': 1.0, 'step': 0.01},
      'macro': function (prompter, reprTools, selectedObjects, selectedKeyframes, messenger) {
        if (selectedObjects.length < 2) {
          prompter.message('Please select at least 2 objects to use this macro!');
          return;
        }
        var ratio = prompter.getOption('float', 1.0);
        var centroidX = 0, centroidY = 0;
        for (var i = 0; i < selectedObjects.length; i++) {
          var obj = reprTools.getObject(selectedObjects[i]);
          centroidX += obj._pm.getProp('position.x', 0);
          centroidY += obj._pm.getProp('position.y', 0);
        }
        centroidX /= selectedObjects.length;
        centroidY /= selectedObjects.length;
        for (var i = 0; i < selectedObjects.length; i++) {
          var obj = reprTools.getObject(selectedObjects[i]);
          var newX = (obj._pm.getProp('position.x', 0) - centroidX) * ratio + centroidX;
          var newY = (obj._pm.getProp('position.y', 0) - centroidY) * ratio + centroidY;
          messenger.setProperty(selectedObjects[i], 'position.x', newX);
          messenger.setProperty(selectedObjects[i], 'position.y', newY);
        }
      }
    },
    'wiggle': {
      'description': 'Wiggle (x,y) selected elements given a time range.',
      'author': 'Demo',
      'options': {'type': 'select', 'values': ['together', 'independent'], 'default': 'together'},
      'macro': function (prompter, reprTools, selectedObjects, selectedKeyframes, messenger) {
        
      }
    },
    'shake': {
      'description': 'Shake (rotZ) the selected elements given a time range.',
      'author': 'Demo',
      'options': {'type': 'select', 'values': ['together', 'independent'], 'default': 'together'},
      'macro': function (prompter, reprTools, selectedObjects, selectedKeyframes, messenger) {
        
      }
    }
  };

  var Prompter = function (optionValue) {
    this._optionValue = optionValue;
  };

  Prompter.prototype._conformType = function (type, val, defaultValue) {
    try {
      if (type === 'float') {
        return parseFloat(val);
      } else if (type === 'int') {
        return parseInt(val);
      } else if (type === 'string') {
        return val.toString();
      } else if (type === 'boolean') {
        return val.trim().toLowerCase() === 'true';
      } else {
        return val;
      }
    } catch (e) {
      return defaultValue;
    }
  };

  Prompter.prototype.getOption = function (type, defaultValue) {
    return this._conformType(type, this._optionValue, defaultValue);
  };

  Prompter.prototype.prompt = function (responseType, message, defaultValue) {
    var val = prompt(message, defaultValue);
    if (typeof val === 'undefined' || val === null) {
      return defaultValue;
    }
    return this._conformType(responseType, val, defaultValue);
  };
  
  Prompter.prototype.message = function (message) {
    alert(message);
    return;
  };

  var Messenger = function (P) {
    this._P = P;
  };
  
  Messenger.prototype.setProperty = function (objectName, property, value) {
    return this._P.emit('object.setProperty', {
      'objectName': objectName,
      'propertyName': property,
      'value': value
    });
  };

  var MacroManager = function (macrosInner) {
    this._macrosInner = macrosInner;
    this._macros = {};
  };

  MacroManager.prototype._createMacroRecord = function (P, name, spec) {
    if (name in this._macros) {
      throw new Error('Macro with name "' + name + '" already exists!');
    }
    var label = _Create('label', {}, [_Create('text', name)]);
    var field = new MiniWindow.Field(name, spec.options.type, spec.options);
    var applyBtn = _Create('div', {
      'className': 'button onhover pull-right',
      'style': {
        'width': '25%'
      }
    }, [ _Create('text', 'Apply')]);
    var listing = _Create('div', {
      'className': 'input-group',
    }, [
      label,
      field.DOM,
      _Create('div', {
        'className': 'microtext onhover'
      }, [_Create('text', spec.description)]),
      applyBtn,
      _Create('div', {'className': 'clearfix'})
    ]);
    this._macrosInner.appendChild(listing);
    var macro = {
      'item': listing,
      'optionValue': field.get()
    };
    field.setChangeListener(function (newValue) {
      macro.optionValue = newValue;
    });
    this._macros[name] = macro;
    P.bind(applyBtn, 'click', 'macro.' + name + '.activate');
  };

  MacroManager.prototype._listenMacro = function (P, name, spec) {
    P.listen('macro.' + name + '.activate', (function (e) {
      var prompter = new Prompter(this._macros[name].optionValue);
      var messenger = new Messenger(P);
      spec.macro(prompter, ReprTools, Selection.get(), [], messenger);
      return e;
    }).bind(this));
  };

  MacroManager.prototype.bind = function (P) {
    for (var name in DEFAULT_MACROS) {
      this._createMacroRecord(P, name, DEFAULT_MACROS[name]);
      this._listenMacro(P, name, DEFAULT_MACROS[name]);
    }
  };

  return MacroManager;
})();
