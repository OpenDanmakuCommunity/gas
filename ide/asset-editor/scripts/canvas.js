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

  NamedItem.prototype.removeChild = function(name) {
    if (!(name in this._children)) {
      throw new Error('Cannot remove child unless it exists!');
    }
    this._item.removeChild(this._children[name]._item);
    delete this._children[name];
    this._order.splice(this._order.indexOf(name), 1);
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
  }

  NamedItem.prototype.clear = function () {
    for (var childName in this._children) {
      this._item.removeChild(this._children[childName]._item);
    }
    this._children = {};
    this._order = [];
  }

  function Context(context) {
    this._context = context;
  }

  Context.prototype._mapAttribute = function (key, value) {
    if (key === 'd') {
      if (Array.isArray(value)) {
        return value.map(function (d) {
            if (Array.isArray(d)) {
              return d.join(' ');
            } else {
              return d;
            }
          }).join(' ');
      } else {
        return value;
      }
    } else {
      return value;
    }
  }

  Context.prototype.applyProps = function (item, spec) {
    for (var key in spec) {
      item.setAttribute(key, this._mapAttribute(key, spec[key]));
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

  Context.prototype.setAttribute = function (attrName, value) {
    this._context[attrName] = value;
    return this;
  }

  Context.prototype.raw = function (type, spec) {
    // Ignores the local style
    var attributes = {};
    for (var attr in spec) {
      attributes[attr] = this._mapAttribute(attr, spec[attr]);
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

  Context.prototype.text = function(x, y, text, font) {
    var text = this.raw('text', {
      'x': x,
      'y': y,
      'content': text
    })
    this._applyDefaults(text);
    return text;
  };

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
    this._tree.appendChild(new NamedItem(name, _Create('svg:g')));
    return this._tree.getChild(name);
  }

  SvgCanvas.prototype.context = function () {
    return new Context(this._initialContext);
  }

  SvgCanvas.prototype.getBoundingBoxes = function () {
    // Recursively gets the bounding boxes from children
    var boxes = [];

  }

  SvgCanvas.prototype.toXmlString = function () {
    var clone = this._dom.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    return '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' +
      clone.outerHTML;
  }

  return SvgCanvas;
})();
