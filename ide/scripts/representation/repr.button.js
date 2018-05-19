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
