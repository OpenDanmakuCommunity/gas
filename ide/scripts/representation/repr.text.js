var GText = (function () {
  var GText = function (name, spec) {
    this.DOM = null;
    this.type = 'Text';
    this.name = name;

    this.create();

    // PropManager
    this._pm = new PropManager(spec, [], this._onPropChange.bind(this));
  };

  GText.prototype._onPropChange = function (propertyName, newValue, pm) {
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
        this.DOM.style.width = newValue !== null ? (newValue + 'px') : '';
        break;
      case 'size.height':
        this.DOM.style.height = newValue !== null ? (newValue + 'px') : '';
        break;
      case 'position.anchor':
      case 'transform.rotX':
      case 'transform.rotY':
      case 'transform.rotZ':
      case 'transform.scale':
        // Build the transform
        // Figure out the anchor
        if (Array.isArray(pm.getProp('position.anchor'))
          && pm.getProp('position.anchor') !== null) {

          var anchor = pm.getProp('position.anchor').map(function (v) {
            return (-v * 100) + '';
          });
        } else {
          var anchor = ['0', '0'];
        }
        console.log(anchor);
        var transforms = [
          {'key': 'rotateX', 'value': pm.getProp('transform.rotX', 0), 'unit': 'deg'},
          {'key': 'rotateY', 'value': pm.getProp('transform.rotY', 0), 'unit': 'deg'},
          {'key': 'rotateZ', 'value': pm.getProp('transform.rotZ', 0), 'unit': 'deg'},
          {'key': 'scale', 'value': pm.getProp('transform.scale', 1), 'unit': ''},
          {'key': 'translateX', 'value': anchor[1], 'unit': '%'},
          {'key': 'translateY', 'value': anchor[0], 'unit': '%'},
        ];
        this.DOM.style.transform = transforms.filter(function (tf) {
          if (tf.value === null) {
            return false;
          } else if (tf.unit === 'deg' && tf.value === 0) {
            return false;
          } else if (tf.unit === 'px' && tf.value === 0) {
            return false;
          } else if (tf.unit === '' && tf.value === 1) {
            return false;
          }
          return true;
        }).map(function (tf) {
          return tf.key + '(' + tf.value + tf.unit + ')';
        }).join(' ');
        break;
      case 'font.color':
        this.DOM.style.color = newValue !== null ? newValue.toString() : '';
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
        this.DOM.innerText = newValue.replace('\\n', '\n');
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
