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
        _Create('text', this._pm.getProp('content', '(Example)'))
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