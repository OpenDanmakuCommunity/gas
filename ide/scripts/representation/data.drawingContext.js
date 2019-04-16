var DrawingContext = (function () {
  var AVAILABLE_TOOLS = ['select', 'rect', 'ellipse', 'circle' ,'path'];
  var SVG_ATTRIBUTES = {
    '': ['stroke', 'stroke-width', 'stroke-linecap', 'fill'],
    'path': [],
    'circle': ['cx', 'cy', 'r'],
    'ellipse': ['cx', 'cy', 'rx', 'ry'],
    'rect': ['x', 'y', 'width', 'height', 'rx', 'ry']
  };

  var REF_ATTRS = {
    'stroke': '#72DEC9',
    'stroke-width': 1,
    'stroke-linecap': '',
    'fill': 'none'
  };

  function distance(a, b, x, y) {
    return Math.sqrt((a - x) * (a - x) + (b - y) * (b - y));
  }

  var NamedGroup = function (name) {
    this.name = name;
    this._autonames = {};
    this._children = {};
  };
  Object.defineProperty(NamedGroup.prototype, "type", {
    value: 'g',
    writable: false,
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(NamedGroup.prototype, "children", {
    get: function () {
      return this.getChildren();
    },
    set: function (l) {
      console.log('NamedGroup.children is read-only');
    },
    enumerable: true,
    configurable: true
  });
  NamedGroup.prototype.getChildren = function () {
    var children = [];
    for (var name in this._children) {
      children.push(this._children[name]);
    }
    return children;
  };
  NamedGroup.prototype.add = function (item) {
    // Auto names the item
    if (!(item.type in this._autonames)) {
      this._autonames[item.type] = 0;
    }
    var name;
    do {
      name = item.type + '_' + (this._autonames[item.type] ++);
    } while(name in this._children)
    this.set(name, item);
  };
  NamedGroup.prototype.set = function (name, item) {
    this._children[name] = item;
  };
  NamedGroup.prototype.unset = function (name, item) {
    delete this._children[name];
  };
  NamedGroup.prototype.find = function(x, y) {
    for (var name in this._children) {
      if (this._children[name].contains(x, y)) {
        return this._children[name];
      }
    }
    return null;
  };
  NamedGroup.prototype.clear = function () {
    this._children = {};
  };
  NamedGroup.prototype.build = function () {
    return {
      'type': 'g',
      'children': this.getChildren().map(function (item) {
        return item.build();
      })
    };
  };

  var Ellipse = function (name) {
    this.name = name;
    this.attrs = {};
  };
  Object.defineProperty(Ellipse.prototype, "type", {
    value: 'ellipse',
    writable: false,
    enumerable: true,
    configurable: true
  });
  Ellipse.prototype.setAttr = function (attrName, value) {
    this.attrs[attrName] = value;
  };
  Ellipse.prototype.build = function () {
    return {
      'type': 'ellipse',
      'children': [],
      'attrs': this.attrs
    };
  };
  Ellipse.prototype.contains = function (x, y) {
    var dx = (x - this.attrs['cx']) / this.attrs['rx'];
    var dy = (y - this.attrs['cy']) / this.attrs['ry'];
    return (dx * dx + dy * dy) <= 1;
  };
  Ellipse.prototype.getBoundingBox = function () {
    return {
      'x': this.attrs['cx'] - this.attrs['rx'],
      'y': this.attrs['cy'] - this.attrs['ry'],
      'width': 2 * this.attrs['rx'],
      'height': 2 * this.attrs['ry']
    };
  };

  var Circle = function (name) {
    this.name = name;
    this.attrs = {};
  };
  Object.defineProperty(Circle.prototype, "type", {
    value: 'circle',
    writable: false,
    enumerable: true,
    configurable: true
  });
  Circle.prototype.setAttr = function (attrName, value) {
    this.attrs[attrName] = value;
  };
  Circle.prototype.build = function () {
    return {
      'type': 'circle',
      'children': [],
      'attrs': this.attrs
    };
  };
  Circle.prototype.contains = function(x, y) {
    var dx = x - this.attrs['cx'];
    var dy = y - this.attrs['cy'];
    var r = this.attrs['r'];
    return Math.sqrt(dx * dx + dy * dy) <= r;
  };
  Circle.prototype.getBoundingBox = function () {
    return {
      'x': this.attrs['cx'] - this.attrs['r'],
      'y': this.attrs['cy'] - this.attrs['r'],
      'width': 2 * this.attrs['r'],
      'height': 2 * this.attrs['r']
    };
  };

  var Rect = function (name) {
    this.name = name;
    this.attrs = {};
  };
  Object.defineProperty(Rect.prototype, "type", {
    value: 'rect',
    writable: false,
    enumerable: true,
    configurable: true
  });
  Rect.prototype.set = function (x, y, width, height) {
    this.setAttr('x', x);
    this.setAttr('y', y);
    this.setAttr('width', width);
    this.setAttr('height', height);
  };
  Rect.prototype.setAttr = function (attrName, value) {
    this.attrs[attrName] = value;
  };
  Rect.prototype.build = function () {
    return {
      'type': 'rect',
      'children': [],
      'attrs': this.attrs
    };
  };
  Rect.prototype.contains = function (x, y) {
    var dx = x - this.attrs['x'];
    var dy = y - this.attrs['y'];
    return dx >= 0 && dy >= 0 && dx <= this.attrs['width'] &&
      dy <= this.attrs['height'];
  };
  Rect.prototype.getBoundingBox = function () {
    return {
      'x': this.attrs['x'],
      'y': this.attrs['y'],
      'width': this.attrs['width'],
      'height': this.attrs['height']
    };
  };

  var Path = function (name) {
    this.name = name;
    this.control = [];
    this.attrs = {};
  };
  Object.defineProperty(Path.prototype, "children", {
    get: function () { return []; },
    set: function () {},
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(Path.prototype, "type", {
    value: 'path',
    writable: false,
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(Path.prototype, "d", {
    get: function () {
      return this.control.slice(0);
    },
    set: function () {},
    enumerable: true,
    configurable: true
  });
  Path.prototype.setAttr = function (attrName, value) {
    this.attrs[attrName] = value;
  };
  Path.prototype.last = function () {
    return this.control.length > 0 ?
      this.control[this.control.length - 1] : null;
  };
  Path.prototype.moveTo = function (x, y) {
    this.control.push({'action':'M', 'x': x, 'y': y});
  };
  Path.prototype.lineTo = function (x, y) {
    this.control.push({'action':'L', 'x': x, 'y': y});
  };
  Path.prototype.close = function () {
    this.control.push({'action':'Z'});
  };
  Path.prototype.getBoundingBox = function () {
    var box = this.control.reduce(function (acc, cur) {
      if (!('x' in cur) || !('y' in cur)) {
        return acc;
      }
      if (!('minX' in acc) || !('maxX' in acc) || !('minY' in acc) ||
        !('maxY' in acc)) {
        return {
          'minX': cur.x,
          'maxX': cur.x,
          'minY': cur.y,
          'maxY': cur.y
        };
      } 
      return {
        'minX': Math.min(acc.minX, cur.x),
        'minY': Math.min(acc.minY, cur.y),
        'maxX': Math.max(acc.maxX, cur.x),
        'maxY': Math.max(acc.maxY, cur.y),
      };
    }, {});
    return {
      'x': box.minX,
      'y': box.minY,
      'width': box.maxX - box.minX,
      'height': box.maxY - box.minY
    };
  };
  Path.prototype.build = function () {
    return {
      'type': 'path',
      'children': [],
      'attrs': this.attrs,
      'd': this.control.slice(0)
    };
  };
  Path.prototype.contains = function (x, y) {
    return false;
  };

  var DrawingContext = function (parent, toolAttrs) {
    this._parent = parent;
    this._children = [];

    this._baseNamedGroup = new NamedGroup('base');
    this._referenceNamedGroup = new NamedGroup('reference');

    this._namedReferences = {};

    // Put in the default NamedGroups.
    this._children.push(this._baseNamedGroup);
    this._children.push(this._referenceNamedGroup);
    
    // Set global tool attrs to configure how new shapes are drawn
    this._tool = 'path';
    this._current = null;
    this._reference = null;
    this._toolAttrs = {
      'stroke': '#000000',
      'stroke-width': 1,
      'stroke-linecap': '',
      'fill': 'none'
    };
  };

  Object.defineProperty(DrawingContext, "SVG_ATTRIBUTES", {
    value: SVG_ATTRIBUTES,
    writable: false,
    enumerable: true,
    configurable: true
  });

  Object.defineProperty(DrawingContext.prototype, "type", {
    value: 'svg',
    writable: false,
    enumerable: true,
    configurable: true
  });

  Object.defineProperty(DrawingContext.prototype, "children", {
    get: function () {
      return this._children;
    },
    set: function (l) {
      console.log('DrawingContext.children is read-only');
    },
    enumerable: true,
    configurable: true
  });
  
  DrawingContext.prototype._setupAttrs = function (item, attrs) {
    if (typeof attrs === 'undefined' || attrs === null) {
      attrs = this._toolAttrs;
    }
    for (var attr in attrs) {
      item.setAttr(attr, attrs[attr]);
    }
  };

  DrawingContext.prototype._drawBoundingBox = function (item) {
    this._referenceNamedGroup.unset('bounding-box');
    if (item instanceof Circle || item instanceof Rect ||
      item instanceof Ellipse || item instanceof Path) {
      var box = item.getBoundingBox();
      var bbox = new Rect();
      this._setupAttrs(bbox, REF_ATTRS);
      bbox.set(box.x, box.y, box.width, box.height);
      this._referenceNamedGroup.set('bounding-box', bbox);
    } else {
      // Nothing to draw
      return;
    }
  };

  DrawingContext.prototype._drawPreview = function (x, y) {
    this._referenceNamedGroup.unset('preview');
    if (this._current === null) {
      return;
    }
    switch (this._current.type) {
      case 'path':
        var last = this._current.last();
        if (last === null) {
          return;
        }
        var preview = new Path();
        this._setupAttrs(preview);
        preview.moveTo(last.x, last.y);
        preview.lineTo(x, y);
        this._referenceNamedGroup.set('preview', preview);
        this._drawBoundingBox(preview);
        break;
      case 'circle':
        // Modify the circle
        var dx = x - this._reference.x, dy = y - this._reference.y;
        this._current.setAttr('cx', this._reference.x + 0.5 * dx);
        this._current.setAttr('cy', this._reference.y + 0.5 * dy);
        this._current.setAttr('r', 0.5 * Math.min(Math.abs(dx), Math.abs(dy)));
        // Draw a bounding box around it
        this._drawBoundingBox(this._current);
        break;
      case 'rect':
        var dx = x - this._reference.x, dy = y - this._reference.y;
        this._current.set(Math.min(this._reference.x, x),
          Math.min(this._reference.y, y),
          Math.abs(dx),
          Math.abs(dy));
        // Draw a bounding box around it
        this._drawBoundingBox(this._current);
        break;
      case 'ellipse':
        var dx = x - this._reference.x, dy = y - this._reference.y;
        this._current.setAttr('cx', this._reference.x + 0.5 * dx);
        this._current.setAttr('cy', this._reference.y + 0.5 * dy);
        this._current.setAttr('rx', 0.5 * Math.abs(dx));
        this._current.setAttr('ry', 0.5 * Math.abs(dy));
        // Draw a bounding box around it
        this._drawBoundingBox(this._current);
        break;
      default:
        if (this._current !== null) {
          this._drawBoundingBox(this._current);
        }
        break;
    }
  };

  DrawingContext.prototype.recoverToolAttrs = function (attrs) {
    for (var key in attrs) {
      this._toolAttrs[key] = attrs[key];
    }
    console.log(attrs);
  };

  DrawingContext.prototype.recoverTool = function (toolName) {
    if (AVAILABLE_TOOLS.indexOf(toolName) < 0) {
      throw new Error('Tool "' + toolName + '" not supported.');
    }
    this._tool = toolName;
  } 

  DrawingContext.prototype.load = function (svgspec) {
    
  };

  DrawingContext.prototype.initiate = function (x, y) {
    this._reference = {'x': x, 'y': y};
    switch (this._tool) {
      case 'path':
        if (this._current === null || this._current.type !== 'path') {
          this._current = new Path();
          this._setupAttrs(this._current);
          this._baseNamedGroup.add(this._current);
          this._current.moveTo(x, y);
        } else {
          this._drawPreview(x, y);
        }
        break;
      case 'rect':
        this._current = new Rect();
        this._setupAttrs(this._current);
        this._baseNamedGroup.add(this._current);
        break;
      case 'circle':
        this._current = new Circle();
        this._setupAttrs(this._current);
        this._baseNamedGroup.add(this._current);
        break;
      case 'ellipse':
        this._current = new Ellipse();
        this._setupAttrs(this._current);
        this._baseNamedGroup.add(this._current);
        break;
      case 'select':
        // Find the 'current'
        this._current = this._baseNamedGroup.find(x, y);
        this._drawBoundingBox(this._current);
        break;
      default:
        break; // Do nothing
    }
  };

  DrawingContext.prototype.drag = function (dx, dy) {
    if (this._current === null) {
      return;
    }
    if (this._tool === 'select') {
      // Move the thing
      return;
    }
    if (this._current.type !== this._tool) {
      // Tool was switched between events. Cleanup the current one
      this.release(dx, dy);
      return;
    }
    var x = dx + this._reference.x;
    var y = dy + this._reference.y;
    this._drawPreview(x, y);
  };

  DrawingContext.prototype.release = function (dx, dy) {
    if (this._current === null) {
      return;
    }
    // Clear the preview
    this._referenceNamedGroup.unset('preview');

    // Commit the change
    switch(this._current.type) {
      case 'path':
        var x = dx + this._reference.x;
        var y = dy + this._reference.y;
        var origin = this._current.control[0];
        if (distance(origin.x, origin.y, x, y) < 4) {
          this._current.close();
          this._current = null;
        } else {
          this._current.lineTo(x, y);
        }
        this._drawBoundingBox(this._current);
        break;
      default:
        break;
    }
    // Clear the reference
    this._reference = null;
  };

  // Update the parent
  DrawingContext.prototype.commit = function () {
    this._parent._setImage(this);
  }

  DrawingContext.prototype.serialize = function () {
    return {
      'type': 'svg',
      'children': this._baseNamedGroup.build().children
    };
  };
  return DrawingContext;
})();
