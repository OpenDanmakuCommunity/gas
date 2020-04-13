var GSprite = (function () {

  var GSprite = function (name, spec) {
    this.DOM = null;
    this.type = 'Sprite';
    this.name = name;

    this._svgCanvas = null;
    this._svgP = null;

    this.create();

    // Temporary cache of transform
    this._transform = {
      '_translateX': 0,
      '_translateY': 0,
      'rotateX': 0,
      'rotateY': 0,
      'rotateZ': 0,
      'scale': 1
    };

    // PropManager
    this._pm = new PropManager(spec, [], this._onPropChange.bind(this));
  };

  GSprite.prototype._buildTransform = function () {
    var transforms = [];
    if (this._transform._translateX !== 0) {
      transforms.push('translateX(' + this._transform._translateX + '%)');
    }
    if (this._transform._translateY !== 0) {
      transforms.push('translateY(' + this._transform._translateY + '%)');
    }
    if (this._transform.rotateX !== 0) {
      transforms.push('rotateX(' + this._transform.rotateX + 'deg)');
    }
    if (this._transform.rotateY!== 0) {
      transforms.push('rotateY(' + this._transform.rotateY + 'deg)');
    }
    if (this._transform.rotateZ !== 0) {
      transforms.push('rotateZ(' + this._transform.rotateZ + 'deg)');
    }
    if (this._transform.scale !== 1) {
      transforms.push('scale(' + this._transform.scale + ')');
    }
    this.DOM.style.transform = transforms.join(' ');
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
      case 'position.anchor':
        if (Array.isArray(newValue) && newValue !== null &&
          newValue.length === 2) {

          this.DOM.style.transformOrigin = newValue.map(function (v) {
            return ((v !== null) ? (v * 100) : 0) + '%';
          }).join(' ');
          this._transform._translateX =
            -((newValue[0] !== null ? newValue[0] : 0) * 100);
          this._transform._translateY =
            -((newValue[1] !== null ? newValue[1] : 0) * 100);
        } else {
          this.DOM.style.transformOrigin = '';
          this._transform._translateX = 0;
          this._transform._translateY = 0;
        }
        this._buildTransform();
        break;
      case 'transform.rotX':
        if (newValue !== null) {
          this._transform.rotateX = newValue;
        }
        this._buildTransform();
        break;
      case 'transform.rotY':
        if (newValue !== null) {
          this._transform.rotateY = newValue;
        }
        this._buildTransform();
        break;
      case 'transform.rotZ':
        if (newValue !== null) {
          this._transform.rotateZ = newValue;
        }
        this._buildTransform();
        break;
      case 'transform.scale':
        if (newValue !== null) {
          this._transform.scale = newValue;
        }
        this._buildTransform();
        break;
      case 'size.width':
        this.DOM.style.width = newValue + 'px';
        break;
      case 'size.height':
        this.DOM.style.height = newValue + 'px';
        break;
      case 'opacity':
        _ToggleClass(this.DOM , 'item-almost-hidden', false);
        if (newValue === null || newValue >= 1) {
          this.DOM.style.opacity = '';
        } else if (newValue < 1 && newValue >= 0) {
          this.DOM.style.opacity = newValue + '';
          if (newValue < 0.2) {
            // Low opacity, add a special class
            _ToggleClass(this.DOM , 'item-almost-hidden', true);
          }
        }
        break;
      case 'visible':
        _ToggleClass(this.DOM, 'item-hidden', newValue === 'false');
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
      case 'frame':
        if (this._svgP !== null) {
          this._svgP.update(newValue);
        }
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

  /** Functions to serialize everything **/
  GSprite.prototype.serialize = function () {
    var data = {
      'type': this.type
    };
    this._pm.serializeBase(data);
    return data;
  };

  /** Below are edit functions **/
  GSprite.prototype.setProperty = function (time, propName, value) {
    this._pm.saveProp(time, propName, value);
  };

  GSprite.prototype._move = function (x, y) {
    // Don't really save the position, just move visually
    this._pm._setProp('position.x', this._pm.getProp('position.x', 0) + x);
    this._pm._setProp('position.y', this._pm.getProp('position.y', 0) + y);
  };

  GSprite.prototype._resize = function (time, width, height) {
    this._pm.saveProp(time, 'size.width', Math.max(1, width));
    this._pm.saveProp(time, 'size.height', Math.max(1, height));
  };

  /** Below are special functions **/
  GSprite.prototype._clearSvgCanvas = function () {
    // Destroy the SVG because we don't know what we'll get
    if (this._svgCanvas !== null) {
      this.DOM.removeChild(this._svgCanvas._dom);
      this._svgCanvas = null;
      this._svgP = null;
    }
  }

  GSprite.prototype._setImage = function (image) {
    if (typeof image != 'object' || image === null || !'type' in image) {
      _ToggleClass(this.DOM, 'no-image', true);
      this.type = 'Sprite';
      if (typeof this._pm !== 'undefined' && this._pm !== null) {
        this._pm._baseSpec['type'] = 'Sprite';
      }
      this.DOM.style.backgroundImage = '';
      this.DOM.style.backgroundSize = '';
      this._clearSvgCanvas();
      return;
    }
    switch (image.type) {
      case 'image/png':
      case 'image/jpg':
      case 'image/jpeg':
      case 'image/gif':
      case 'image/svg+xml':
        this.type = 'BinarySprite';
        if (typeof this._pm !== 'undefined' && this._pm !== null) {
          this._pm._baseSpec['type'] = 'BinarySprite';
        }
        this._clearSvgCanvas();
        this.DOM.style.backgroundImage = 'url(' + image.dataUri + ')';
        this.DOM.style.backgroundSize = 'contain';
        break;
      case 'svg+p':
      case 'svg':
        this._clearSvgCanvas();
        // Setup the DOM
        var canvasDom = _Create('svg:svg', {
          'width': '100%',
          'height': '100%',
          'style': {
            'transform': 'initial'
          }
        });
        this.DOM.appendChild(canvasDom);
        // Setup the stuff
        this._svgCanvas = new SvgCanvas(canvasDom, {});
        this._svgP = new SVGP(image, [0, 0, 640, 480]);
        // Draw
        this._svgP.draw(this._svgCanvas, 0);

        this.type = image.type === 'svg' ? 'SVGSprite' : 'AnimatedSprite';
        if (typeof this._pm !== 'undefined' && this._pm !== null) {
          this._pm._baseSpec['type'] = this.type;
        }
        break;
      default:
        throw new Error('Sprite does not support image type of ' + image.type);
    }
    _ToggleClass(this.DOM, 'no-image', false);
  };

  return GSprite;
})();
