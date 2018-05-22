var GSprite = (function () {
  var GSprite = function (name, spec) {
    this.DOM = null;
    this.type = 'Sprite';
    this.name = name;

    this.create();

    // PropManager
    this._pm = new PropManager(spec, [], this._onPropChange.bind(this));
  };

  GSprite.prototype._onPropChange = function (propertyName, newValue) {
    if (this.DOM === null) {
      return;
    }
    switch (propertyName) {
      case 'type':
        this.type = newValue;
        break;
      case 'position.x':
        this.DOM.style.left = newValue + 'px';
        break;
      case 'position.y':
        this.DOM.style.top = newValue + 'px';
        break;
      case 'size.width':
        this.DOM.style.width = newValue + 'px';
        break;
      case 'size.height':
        this.DOM.style.height = newValue + 'px';
        break;
      case 'image.position':
        this.DOM.style.backgroundPosition =
          newValue !== null ? newValue.join(' ') : '';
        break;
      case 'image.repeat':
        this.DOM.style.backgroundRepeat = newValue + '';
        break;
      case 'image.stretchMode':
        if (newValue === 'contain' || newValue === 'cover') {
          this.DOM.style.backgroundSize = newValue;
        } else if (newValue === 'fill') {
          this.DOM.style.backgroundSize = '100% 100%';
        } else if (newValue === 'crop') {
          this.DOM.style.backgroundSize = 'auto';
        }
        break;
      case 'content':
        this._setImage(newValue);
        break;
      default:
        console.warn('Property ' + propertyName + ' changed to ' + newValue +
          ' but we have nothing to update!');
    }
  };

  GSprite.prototype.create = function () {
    if (this.DOM === null) {
      this.DOM = _Create('div', {
        'className': 'sprite no-image',
        'ide-object-name': this.name,
      });
    }
  };

  GSprite.prototype.rename = function (newName) {
    this.name = newName;
    if (this.DOM !== null) {
      this.DOM.setAttribute('ide-object-name', newName);
    }
  };

  GSprite.prototype.setFocus = function (hasFocus) {
    _ToggleClass(this.DOM, 'item-focus', hasFocus);
  };

  /** Below are edit functions **/
  GSprite.prototype.setProperty = function (time, propName, value) {
    this._pm.saveProp(time, propName, value);
  };

  GSprite.prototype.move = function (time, x, y) {
    this._pm.saveProp(time, 'position.x', this._pm.getProp('position.x', 0) + x);
    this._pm.saveProp(time, 'position.y', this._pm.getProp('position.y', 0) + y);
  };

  GSprite.prototype.resize = function (time, width, height) {
    this._pm.saveProp(time, 'size.width', Math.max(1, width));
    this._pm.saveProp(time, 'size.height', Math.max(1, height));
  };

  /** Below are internal helper functions **/
  GSprite.prototype._setImage = function (image) {
    if (typeof image === 'undefined' || image === null || !'type' in image) {
      _ToggleClass(this.DOM, 'no-image', true);
      return;
    }
    switch (image.type) {
      case 'image/png':
      case 'image/jpg':
      case 'image/jpeg':
        this.type = 'BinarySprite';
        break;
      case 'image/gif':
        this.type = 'AnimatedSprite';
        break;
      case 'svg':
      default:
        throw new Error('Sprite does not support image type of ' + image.type);
    }
    this.DOM.style.backgroundImage = 'url(' + image.dataUri + ')';
    this.DOM.style.backgroundSize = 'contain';
    _ToggleClass(this.DOM, 'no-image', false);
  };

  return GSprite;
})();
