var SvgCanvas = (function () {
  function NamedItem(name, item) {
    this._item = item;
    this._name = name;
    this._children = {};
    this._order = [];
  }

  NamedItem.prototype.getChildAt = function (index) {
    return this._children[this._order[index]];
  }

  NamedItem.prototype.getChild = function (name) {
    if (name in this._children) {
      return this._children[name];
    }
    throw new Error('Child ' + name + ' not found!');
  }

  NamedItem.prototype.appendChild = function(namedItem) {
    if (namedItem._name in this._children) {
      this.replaceChild(namedItem);
    } else {
      this._children[namedItem._name] = namedItem;
      this._order.push(namedItem._name);
      this._item.appendChild(namedItem._item);
    }
  }

  NamedItem.prototype.replaceChild = function(namedItem) {
    if (!(namedItem._name in this._children)) {
      throw new Error('Cannot replace child unless it exists!');
    }
    this._item.replaceChild(namedItem, this._children[namedItem._name]);
    this._children[namedItem._name] = namedItem;
  }

  NamedItem.prototype.appendUnnamedChild = function (child) {
    // Create an un-named svg thing
    var newNode = new NamedItem('child-' + this._order.length, child);
    this.appendChild(newNode);
  }

  NamedItem.prototype.item = function () {
    return this._item;
  }

  NamedItem.prototype.draw = function (child) {
    // Unnamed items are not tracked
    this._item.appendChild(child);
    return this;
  };

  function Context(context) {
    this._context = context;
  }

  Context.prototype.applyProps = function (item, spec) {
    for (var key in spec) {
      item.setAttribute(key, spec[key]);
    }
  }

  Context.prototype.fork = function () {
    var nc = {};
    for (var key in this._context) {
      nc[key] = this._context[key];
    }
    return new Context(nc);
  }

  Context.prototype._applyDefaults = function (item) {
    this.applyProps(item, this._context);
  }

  Context.prototype.raw = function (type, spec) {
    // Ignores the local style
    var attributes = {};
    for (var attr in spec) {
      switch(attr) {
        case 'd':
          if (Array.isArray(spec[attr])) {
            attributes[attr] = spec[attr].map(function (d) {
                if (typeof d === 'string') {
                  return d;
                } else {
                  return d.join(' ');
                }
              }).join(' ');
          } else {
            attributes[attr] = spec[attr];
          }
        default:
          attributes[attr] = spec[attr];
      }
    }
    // Handle text
    if (type === 'text') {
      var text = attributes['content'];
      delete attributes['content'];
      return _Create('svg:text', attributes, [
        _Create('text', text)
      ]);
    } else {
      return _Create('svg:' + type, attributes);
    }
  }

  Context.prototype.line = function(x1, y1, x2, y2) {
    var line = this.raw('line', {
      'x1': x1,
      'y1': y1,
      'x2': x2,
      'y2': y2
    });
    this._applyDefaults(line);
    return line;
  }

  function SvgCanvas(dom, initialContext) {
    this._dom = dom;
    this._tree = new NamedItem('_root', this._dom);
    this._width = dom.offsetWidth ? dom.offsetWidth : 640;
    this._height = dom.offsetHeight ? dom.offsetHeight: 480;
    this._initialContext = initialContext;

    this.setViewBox(0, 0, this._width, this._height);
  }

  SvgCanvas.prototype.setViewBox = function (x, y, w, h) {
    this._dom.setAttribute('viewBox', [x, y, w, h].join(' '));
  }

  SvgCanvas.prototype.root = function () {
    return this._tree;
  }

  SvgCanvas.prototype.makeGroup = function (name) {
    this._tree.appendChild(new NamedItem(name, _Create('g')));
    return this._tree.getChild(name);
  }

  SvgCanvas.prototype.context = function () {
    return new Context(this._initialContext);
  }

  return SvgCanvas;
})();
