var MacroManager = (function () {
  var DEFAULT_MACROS = {
    'explode': {
      'description': 'Move selected items away from/close to their center.',
      'author': 'Demo',
      'options': ['explode', 'implode'],
      'macro': function (prompter, reprTools, selectedObjects, selectedKeyframes) {
        var ratio = prompter.prompt('float',
          'Specify the explosion radius (<1 = implode, >1 = explode): ', 1.0);
      }
    },
    'wiggle': {
      'description': 'Wiggle (x,y) selected elements given a time range.',
      'author': 'Demo',
      'options': ['together', 'independent'],
      'macro': function (prompter, reprTools, selectedObjects, selectedKeyframes) {
        
      }
    },
    'shake': {
      'description': 'Shake (rotZ) the selected elements given a time range.',
      'author': 'Demo',
      'options': ['together', 'independent'],
      'macro': function (prompter, reprTools, selectedObjects, selectedKeyframes) {
        
      }
    }
  };

  var Prompter = function () {
    
  };
  
  Prompter.prototype.prompt = function (responseType, message, defaultValue) {
    
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
    var listing = _Create('div', {
      'className': 'input-group',
    }, [
      label,
      _Create('div', {'className': 'clearfix'})
    ]);
    this._macrosInner.appendChild(listing);
    var macro = {
      'item': listing
    };
    this._macros[name] = macro;
  };

  MacroManager.prototype.bind = function (P) {
    for (var name in DEFAULT_MACROS) {
      this._createMacroRecord(P, name, DEFAULT_MACROS[name]);
    }
  };

  return MacroManager;
})();
