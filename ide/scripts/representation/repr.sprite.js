var GSprite = (function () {
  var GSprite = function (spec) {
    this.DOM = null;
    this.type = spec.type;
    this.name = spec.name;
    this.spec = spec;

    this._pm = new PropManager(spec);

    this.load();
  };

  GSprite.prototype.rename = function (newName) {
    this.name = newName;
    this.spec.name = newName;
    if (this.DOM !== null) {
      this.DOM.setAttribute('ide-object-name', newName);
    }
  };

  GSprite.prototype.setImage = function (image) {
    if (typeof image === 'undefined' || image === null || !'type' in image) {
      _ToggleClass(this.DOM, 'no-image', true);
      this._pm.setProp('content', null);
      return;
    }
    switch (image.type) {
      case 'image/png':
      case 'image/jpg':
      case 'image/jpeg':
        this._pm.setProp('content', image);
        this.type = 'BinarySprite';
        break;
      case 'image/gif':
        this._pm.setProp('content', image);
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
