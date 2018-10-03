var DrawingContext = (function () {
  function distance(a, b, x, y) {
    return Math.sqrt((a - x) * (a - x) + (b - y) * (b - y));
  }

  var NamedGroup = function (name) {
    this.type = 'g';
    this.name = name;
    this._autonames = {};
    this._children = {};
  };
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
    var name = item.type + '_' + (this._autonames[item.type] ++);
    this.set(name, item);
  };
  NamedGroup.prototype.set = function (name, item) {
    this._children[name] = item;
  };
  NamedGroup.prototype.unset = function (name, item) {
    delete this._children[name];
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

  var Circle = function () {};
  var Rect = function () {};

  var Path = function () {
    this.control = [];
    this.dirty = false;
    this.stroke = '#000000';
    this.strokeWidth = '1';
    this.fill = 'none';
  };
  Object.defineProperty(Path.prototype, "type", {
    value: 'path',
    writable: false,
    enumerable: true,
    configurable: true
  });
  Path.prototype.last = function () {
    return this.control.length > 0 ?
      this.control[this.control.length - 1] : null;
  };
  Path.prototype.moveTo = function (x, y) {
    this.control.push({'action':'M', 'x': x, 'y': y});
    this.dirty = true;
  };
  Path.prototype.lineTo = function (x, y) {
    this.control.push({'action':'L', 'x': x, 'y': y});
    this.dirty = true;
  };
  Path.prototype.close = function () {
    this.control.push({'action':'Z'});
    this.dirty = true;
  };
  Path.prototype.build = function () {
    var isDirty = this.dirty;
    this.dirty = false;
    return {
      'type': 'path',
      'dirty': isDirty,
      'children': [],
      'fill': this.fill,
      'stroke': this.stroke,
      'strokeWidth': this.strokeWidth,
      'd': this.control.slice(0)
    };
  };

  var DrawingContext = function (parent) {
    this._parent = parent;
    this._children = [];
    this._current = null;
    this._reference = null;

    this._baseNamedGroup = new NamedGroup('base');
    this._referenceNamedGroup = new NamedGroup('reference');

    this._namedReferences = {};

    // Put in the default NamedGroups.
    this._children.push(this._baseNamedGroup);
    this._children.push(this._referenceNamedGroup);
  };

  Object.defineProperty(DrawingContext.prototype, "type", {
    value: 'svg',
    writable: false,
    enumerable: true,
    configurable: true
  });

  Object.defineProperty(DrawingContext.prototype, "children", {
    get: function () {
      return this._children.map(function (item) {
        return item.build();
      });
    },
    set: function (l) {
      console.log('DrawingContext.children is read-only');
    },
    enumerable: true,
    configurable: true
  });

  DrawingContext.prototype._drawPreview = function (x, y) {
    var last = this._current.last();
    if (last === null) {
      return;
    }
    var preview = new Path();
    preview.moveTo(last.x, last.y);
    preview.lineTo(x, y);
    this._referenceNamedGroup.set('preview', preview);
  };

  DrawingContext.prototype.load = function (svgspec) {
    
  };

  DrawingContext.prototype.initiate = function (x, y) {
    this._reference = {'x': x, 'y': y};
    if (this._current === null) {
      this._current = new Path();
      // Add it into the queue
      this._baseNamedGroup.add(this._current);
      this._current.moveTo(x, y);
    } else {
      // Draw the indicator line
      this._drawPreview(x, y);
    } 
  };

  DrawingContext.prototype.drag = function (dx, dy) {
    if (this._current === null) {
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
    // Clear the dragging
    this._referenceNamedGroup.unset('preview');

    var x = dx + this._reference.x;
    var y = dy + this._reference.y;
    var origin = this._current.control[0];
    if (distance(origin.x, origin.y, x, y) < 4) {
      this._current.close();
      this._current = null;
    } else {
      this._current.lineTo(x, y);
    }
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