var DrawingContext = (function () {
  function distance(a, b, x, y) {
    return Math.sqrt((a - x) * (a - x) + (b - y) * (b - y));
  }

  var Group = function () {
    this.children = [];
  };

  Group.prototype.build = function () {
    return {
      'type': 'g',
      'dirty': this.children.reduce(function (acc, curr) {
        return acc || curr.build().dirty;
      }, false),
      'children': this.children.map(function (item) {
        return item.build();
      })
    };
  };

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

    this._baseGroup = new Group();
    this._referenceGroup = new Group();

    // Put in the default groups.
    this._children.push(this._baseGroup);
    this._children.push(this._referenceGroup);
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

  DrawingContext.prototype._drawIndicator = function (x, y) {
    var last = this._current.last();
    if (last === null) {
      return;
    }
    var indicator = new Path();
    indicator.moveTo(last.x, last.y);
    indicator.lineTo(x, y);
    this._referenceGroup.children = [
      indicator
    ];
  };

  DrawingContext.prototype.load = function (svgspec) {
    
  };

  DrawingContext.prototype.initiate = function (x, y) {
    this._reference = {'x': x, 'y': y};
    if (this._current === null) {
      this._current = new Path();
      // Add it into the queue
      this._baseGroup.children.push(this._current);
      this._current.moveTo(x, y);
    } else {
      // Draw the indicator line
      this._drawIndicator(x, y);
    } 
  };

  DrawingContext.prototype.drag = function (dx, dy) {
    if (this._current === null) {
      return;
    }
    var x = dx + this._reference.x;
    var y = dy + this._reference.y;
    this._drawIndicator(x, y);
  };

  DrawingContext.prototype.release = function (dx, dy) {
    if (this._current === null) {
      return;
    }
    // Clear the dragging
    this._referenceGroup.children = [];
    
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
      'children': this._baseGroup.build().children
    };
  };
  return DrawingContext;
})();