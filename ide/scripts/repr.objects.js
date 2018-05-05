var PropManager = (function () {
  var PropManager = function (spec) {
    this.spec = spec;
  };
  
  PropManager.prototype.getProp = function (propertyName, def) {
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
  
  PropManager.prototype.setProp = function (propertyName, newValue) {
    var keys = propertyName.split('.');
    var curSpec = this.spec;
    while (true) {
      var curKey = keys.shift();
      if (keys.length === 0) {
        // This is the thing we need to write
        curSpec[curKey] = newValue;
        return;
      } else {
        if (!curKey in curSpec) {
          curSpec[curKey] = {};
        }
        curSpec = curSpec[curKey];
      }
    }
  };
  
  return PropManager;
})();

var GText = (function () {
  var GText = function (spec) {
    this.DOM = null;
    this.type = spec.type;
    this.name = spec.name;
    this.spec = spec;

    // Prop manager
    this._pm = new PropManager(spec);

    this.load();
  };

  GText.prototype.rename = function (newName) {
    this.name = newName;
    this.spec.name = newName;
    if (this.DOM !== null) {
      this.DOM.setAttribute('ide-object-name', newName);
    }
  };

  /** Ui Related **/
  GText.prototype.load = function () {
    if (this.DOM === null) {
      this.DOM = _Create('div', {
        'className': 'text',
        'ide-object-name': this.name
      }, [
        _Create('text', this._pm.getProp('text', '(Example)'))
      ]);
      this.DOM.style.position = 'absolute';
    }
    this.DOM.style.left = this._pm.getProp('position.x', 0) + 'px';
    this.DOM.style.top = this._pm.getProp('position.y', 0) + 'px';
  };

  GText.prototype.move = function (x, y) {
    this._pm.setProp('position.x', this._pm.getProp('position.x', 0) + x);
    this._pm.setProp('position.y', this._pm.getProp('position.y', 0) + y);
    this.load();
  };

  GText.prototype.setFocus = function (hasFocus) {
    _ToggleClass(this.DOM, 'item-focus', hasFocus);
  };

  return GText;
})();

var GSprite = (function () {
  var GSprite = function (spec) {
    this.DOM = null;
    this.type = spec.type;
    this.name = spec.name;
    this.spec = spec;

    this._pm = new PropManager(spec);

    this.load();
  };

  GText.prototype.rename = function (newName) {
    this.name = newName;
    this.spec.name = newName;
    if (this.DOM !== null) {
      this.DOM.setAttribute('ide-object-name', newName);
    }
  };

  GSprite.prototype.setImage = function (image) {
    if (typeof image === 'undefined' || image === null || !'type' in image) {
      _ToggleClass(this.DOM, 'no-image', true);
      return;
    }
    switch (image.type) {
      default:
        throw new Error('Sprite does not support image type of ' + image.type);
    }
    _ToggleClass(this.DOM, 'no-image', false);
  };

  GSprite.prototype.load = function () {
    if (this.DOM === null) {
      this.DOM = _Create('div', {
        'className': 'sprite no-image',
        'ide-object-name': this.name,
      });
    }
    this.DOM.style.width = this._pm.getProp('size.width', 1) + 'px';
    this.DOM.style.height = this._pm.getProp('size.height', 1) + 'px';
    this.DOM.style.left = this._pm.getProp('position.x', 0) + 'px';
    this.DOM.style.top = this._pm.getProp('position.y', 0) + 'px';

    this.setImage(this._pm.getProp('content', null));
  };

  GSprite.prototype.resize = function (width, height) {
    this._pm.setProp('size.width', Math.max(1, width));
    this._pm.setProp('size.height', Math.max(1, height));
    this.load();
  };

  GSprite.prototype.move = function (x, y) {
    this._pm.setProp('position.x', this._pm.getProp('position.x', 0) + x);
    this._pm.setProp('position.y', this._pm.getProp('position.y', 0) + y);
    this.load();
  };

  GSprite.prototype.setFocus = function (hasFocus) {
    _ToggleClass(this.DOM, 'item-focus', hasFocus);
  };

  return GSprite;
})();

var GButton = (function () {
  var GButton = function (spec) {
    this.DOM = null;
    this.type = spec.type;
    this.name = spec.name;
    this.spec = spec;

    this._pm = new PropManager(spec);

    this.load();
  };

  GButton.prototype.load = function () {
    if (this.DOM === null) {
      this.DOM = _Create('div', {
        'className': 'button',
        'ide-object-name': this.name,
      }, [
        _Create('text', this._pm.getProp('content', 'Button'))
      ]);
    }
    this.DOM.style.width = this._pm.getProp('size.width', 1) + 'px';
    this.DOM.style.height = this._pm.getProp('size.height', 1) + 'px';
    this.DOM.style.left = this._pm.getProp('position.x', 0) + 'px';
    this.DOM.style.top = this._pm.getProp('position.y', 0) + 'px';
  };
  
  GButton.prototype.resize = function (width, height) {
    this._pm.setProp('size.width', Math.max(1, width));
    this._pm.setProp('size.height', Math.max(1, height));
    this.load();
  };

  GButton.prototype.move = function (x, y) {
    this._pm.setProp('position.x', this._pm.getProp('position.x', 0) + x);
    this._pm.setProp('position.y', this._pm.getProp('position.y', 0) + y);
    this.load();
  };

  GButton.prototype.setFocus = function (hasFocus) {
    _ToggleClass(this.DOM, 'item-focus', hasFocus);
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