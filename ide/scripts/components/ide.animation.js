var AnimationManager = (function () {
  var ANIMATION_SETTINGS = {
    'global.duration': {
      'type': 'number',
      'default': 12000,
      'min': 0,
      'step': 1
    },
  };
  var AnimationManager = function (animationWindow, animationInner) {
    this._window = animationWindow;
    this._inner = animationInner;
    this._fields = {};
  };

  AnimationManager.prototype._buildField = function (P, propertyName, spec) {
    var shortName = 'animation-setting-' + propertyName.replace(
      new RegExp('[^a-zA-Z0-9-]', 'g'), '-');
    var field = new MiniWindow.Field(shortName, spec.type, spec);
    var propItem = _Create('div', {
      'className': 'input-group',
      'style': {
        //'display': 'none'
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

  AnimationManager.prototype.bind = function (P) {
    for (var propName in ANIMATION_SETTINGS) {
      this._buildField(P, propName, ANIMATION_SETTINGS[propName]);
    }
  };

  return AnimationManager;
})();
