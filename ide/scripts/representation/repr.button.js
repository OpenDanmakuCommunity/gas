var GButton = (function () {
  var GButton = function (name, spec) {
    this.DOM = null;
    this.type = 'Button';
    this.name = name;

    this.create();

    // PropManager
    this._pm = new PropManager(spec, [], this._onPropChange.bind(this));
  };

  GButton.prototype._onPropChange = function (propertyName, newValue) {
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
      case 'font.family':
        this.DOM.style.fontFamily = newValue + '';
        break;
      case 'font.size':
        this.DOM.style.fontSize = newValue + 'px';
        break;
      case 'font.orientation':
        this.DOM.style.writingMode = newValue + '';
        break;
      case 'font.decoration':
        if (newValue !== null && Array.isArray(newValue)) {
          _ToggleClass(this.DOM, 'text-decoration-outline',
            newValue.indexOf('outline') >= 0 && newValue.indexOf('shadow') < 0);
          _ToggleClass(this.DOM, 'text-decoration-shadow',
            newValue.indexOf('shadow') >= 0 && newValue.indexOf('outline') < 0);
          _ToggleClass(this.DOM, 'text-decoration-outline-shadow',
            newValue.indexOf('shadow') >= 0 && newValue.indexOf('outline') >=0);
          _ToggleClass(this.DOM, 'text-decoration-bold',
            newValue.indexOf('bold') >= 0);
          _ToggleClass(this.DOM, 'text-decoration-italic',
            newValue.indexOf('italic') >= 0);
          this.DOM.style.textDecoration = newValue.filter(function (val) {
            return val !== 'outline' && val !== 'shadow' &&
              val !== 'bold' && val !=='italic';
          }).join(' ');
        }
        break;
      case 'content':
        this.DOM.innerText = newValue;
        break;
      default:
        console.warn('Property ' + propertyName + ' changed to ' + newValue +
          ' but we have nothing to update!');
    }
  };

  GButton.prototype.create = function () {
    if (this.DOM === null) {
      this.DOM = _Create('div', {
        'className': 'button',
        'ide-object-name': this.name,
      }, [
        _Create('text', 'Button')
      ]);
    }
  };

  GButton.prototype.rename = function (newName) {
    this.name = newName;
    if (this.DOM !== null) {
      this.DOM.setAttribute('ide-object-name', newName);
    }
  };

  GButton.prototype.setFocus = function (hasFocus) {
    _ToggleClass(this.DOM, 'item-focus', hasFocus);
  };

  /** Below are edit functions **/
  GButton.prototype.setProperty = function (time, propName, value) {
    this._pm.saveProp(time, propName, value);
  };

  GButton.prototype.move = function (time, x, y) {
    this._pm.saveProp(time, 'position.x', this._pm.getProp('position.x', 0) + x);
    this._pm.saveProp(time, 'position.y', this._pm.getProp('position.y', 0) + y);
  };

  GButton.prototype.resize = function (time, width, height) {
    this._pm.saveProp(time, 'size.width', Math.max(1, width));
    this._pm.saveProp(time, 'size.height', Math.max(1, height));
  };

  return GButton;
})();
