var GText = (function () {
  var GText = function (name, spec) {
    this.DOM = null;
    this.type = 'Text';
    this.name = name;

    this.create();

    // PropManager
    this._pm = new PropManager(spec, [], this._onPropChange.bind(this));
  };

  GText.prototype._onPropChange = function (propertyName, newValue) {
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
      case 'font.family':
        this.DOM.style.fontFamily = newValue + '';
        break;
      case 'font.size':
        this.DOM.style.fontSize = newValue + 'px';
        break;
      case 'font.orientation':
        this.DOM.style.writingMode = newValue + '';
        break;
      case 'size.width':
        this.DOM.style.width = newValue !== null ? (newValue + 'px') : '';
        break;
      case 'size.height':
        this.DOM.style.height = newValue !== null ? (newValue + 'px') : '';
        break;
      case 'content':
        this.DOM.innerText = newValue;
        break;
      default:
        console.warn('Property ' + propertyName + ' changed to ' + newValue +
          ' but we have nothing to update!');
    }
  };

  GText.prototype.create = function () {
    if (this.DOM === null) {
      this.DOM = _Create('div', {
        'className': 'text',
        'ide-object-name': this.name
      }, [
        _Create('text', '(Empty)')
      ]);
      this.DOM.style.position = 'absolute';
    }
  };

  GText.prototype.rename = function (newName) {
    this.name = newName;
    if (this.DOM !== null) {
      this.DOM.setAttribute('ide-object-name', newName);
    }
  };

  GText.prototype.setFocus = function (hasFocus) {
    _ToggleClass(this.DOM, 'item-focus', hasFocus);
  };

  /** Below are edit functions **/
  GText.prototype.setProperty = function (time, propName, value) {
    this._pm.saveProp(time, propName, value);
  };

  GText.prototype.move = function (time, x, y) {
    this._pm.saveProp(time, 'position.x', this._pm.getProp('position.x', 0) + x);
    this._pm.saveProp(time, 'position.y', this._pm.getProp('position.y', 0) + y);
  };

  return GText;
})();