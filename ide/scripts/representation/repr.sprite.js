var GSprite = (function () {
  var GSprite = function (name, spec) {
    this.DOM = null;
    this.SVGDOM = null;
    this.type = 'Sprite';
    this.name = name;

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
    if (this.SVGDOM !== null) {
      this.SVGDOM.setAttribute('ide-object-name', newName);
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

  GSprite.prototype.move = function (time, x, y) {
    this._pm.saveProp(time, 'position.x', this._pm.getProp('position.x', 0) + x);
    this._pm.saveProp(time, 'position.y', this._pm.getProp('position.y', 0) + y);
  };

  GSprite.prototype.resize = function (time, width, height) {
    this._pm.saveProp(time, 'size.width', Math.max(1, width));
    this._pm.saveProp(time, 'size.height', Math.max(1, height));
  };

  /** Below are special functions **/
  GSprite.prototype.getContext = function () {
    if (this.type !== 'Sprite' && this.type !== 'SVGSprite') {
      return null; // Can't get a context
    }
    this.type = 'SVGSprite';
    this._pm._baseSpec['type'] = 'SVGSprite';
    var content = this._pm.getProp('content');
    if (content instanceof DrawingContext) {
      return content; // Get the existing context
    } else if (typeof content === 'object') {
      // Transform it into a drawing context
      var ctx = new DrawingContext(this);
      ctx.load(content);
      return ctx;
    } else {
      return new DrawingContext(this);
    }
  }

  /** Below are internal helper functions **/
  GSprite.prototype._drawElement = function (item) {
    var dom = _Create(item.type);
    switch(item.type) {
      case 'path':
        dom.setAttribute('stroke-width', item.strokeWidth);
        dom.setAttribute('stroke', item.stroke);
        dom.setAttribute('fill', item.fill);
        dom.setAttribute('d', item.d.map(function (d) {
          switch(d.action) {
            case 'M':
            case 'm':
            case 'L':
            case 'l':
              return d.action + ' ' + d.x + ' ' + d.y;
            case 'Z':
            case 'z':
            default: 
              return d.action;
          }
        }).join(' '));
      default:
        break;
    }
    for (var i = 0; 'children' in item && i < item.children.length; i++) {
      dom.appendChild(this._drawElement(item.children[i]));
    }
    return dom;
  };
  GSprite.prototype._drawSVG = function (imageData) {
    if (this.SVGDOM === null) {
      throw new Error('Cannot invoke svg drawing with no svg canvas');
    }
    for (var i = 0; i < imageData.children.length; i++) {
      this.SVGDOM.appendChild(this._drawElement(imageData.children[i]));
    }
  };
  GSprite.prototype._setImage = function (image) {
    if (typeof image != 'object' || image === null || !'type' in image) {
      _ToggleClass(this.DOM, 'no-image', true);
      this.type = 'Sprite';
      this._pm._baseSpec['type'] = 'Sprite';
      this.DOM.style.backgroundImage = '';
      this.DOM.style.backgroundSize = '';
      if (this.SVGDOM !== null) {
        this.DOM.removeChild(this.SVGDOM);
        this.SVGDOM = null;
      }
      return;
    }
    switch (image.type) {
      case 'image/png':
      case 'image/jpg':
      case 'image/jpeg':
      case 'image/gif':
        this.type = 'BinarySprite';
        this._pm._baseSpec['type'] = 'BinarySprite';
        if (this.SVGDOM !== null) {
          this.DOM.removeChild(this.SVGDOM);
          this.SVGDOM = null;
        }
        this.DOM.style.backgroundImage = 'url(' + image.dataUri + ')';
        this.DOM.style.backgroundSize = 'contain';
        break;
      case 'svg':
        if (this.SVGDOM !== null) {
          this.DOM.removeChild(this.SVGDOM);
        } 
        this.SVGDOM = _Create('svg', {
          'width': '100%',
          'height': '100%',
          'ide-object-name': this.name
        });
        this.DOM.appendChild(this.SVGDOM);
        this._drawSVG(image);
        break;
      default:
        throw new Error('Sprite does not support image type of ' + image.type);
    }
    _ToggleClass(this.DOM, 'no-image', false);
  };

  return GSprite;
})();
