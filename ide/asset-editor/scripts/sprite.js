var SVGP = (function () {
  const _OPS = {
    '+': [2, function (a, b) { return a + b; }],
    '-': [2, function (a, b) { return a - b; }],
    '*': [2, function (a, b) { return a * b; }],
    '/': [2, function (a, b) { return a / b; }],
    '**': [2, function (a, b) { return Math.pow(a, b); }],
    'min': [2, function (a, b) { return Math.min(a, b); }],
    'max': [2, function (a, b) { return Math.max(a, b); }],
    'abs': [1, function (a) { return Math.abs(a); }],
    'floor': [1, function (a) { return Math.floor(a); }],
    'ceil': [1, function (a) { return Math.ceil(a); }],
    'round': [1, function (a) { return Math.round(a); }],
    'if': [3, function (a, b, c) { return a > 0 ? b : c; }]
  };
  const _CONV = {
    '#rgb': function (number) {
      var color = number.toString(16);
      while (color.length < 6) {
        color = '0' + color;
      }
      return '#' + color;
    }
  };

  function _eval(notation, variables) {
    if (typeof notation === 'string' || typeof notation === 'number') {
      return notation; // Primitives are resolved directly
    }
    if (Array.isArray(notation)) {
      // Recursively resolve
      return notation.map(function (i) {
        return _eval(i, variables);
      });
    }
    if (notation.type === 'interpolate-linear') {
      if (!Array.isArray(notation.src) ||
        !(typeof notation['on'] === 'string') ||
        !notation.on.startsWith('$')) {

        throw new Error('Interpolate expression error');
      }
      var waypoints = notation.src.slice(0),
        t = variables[notation['on'].substring(1)];
      if (waypoints.length === 0) {
        return 0;
      } else if (waypoints.length === 1) {
        return waypoints[0];
      } else {
        var interval = 1 / (waypoints.length - 1), x = waypoints[0];
        for (var i = 1; i < waypoints.length; i++) {
          if (t - interval > 0) {
            x = waypoints[i];
            t -= interval;
          } else {
            return (waypoints[i] - x) * (t / interval) + x;
          }
        }
        return waypoints[waypoints.length - 1];
      }
    } else if (notation.type === 'rpn') {
      var env = notation.src.slice(0).reverse(); // Make a copy
      var res = [];
      while (env.length > 0) {
        var item = env.pop();
        if (item in _OPS) {
          var op = _OPS[item];
          if (res.length < op[0]) {
            throw new Error('Not enough operands for operator ' + item);
          }
          res = res.slice(0, -op[0]).concat([
            op[1].apply(null, res.slice(-op[0]))
          ]);
        } else if (typeof item === 'string' && item.startsWith('$')) {
          // Resolve the item and put it back
          item = variables[item.substring(1)];
          item = ((typeof item !== 'number') && !(item in _OPS)) ? 0 : item;
          env.push(item);
        } else {
          res.push(item);
        }
      }
      if (res.length > 1) {
        throw new Error('Not enough operators for operands!');
      }
      return res[0];
    } else {
      throw new Error('Unsupported notation ' + notation.type);
    }
  }

  function SVGP (src, extViewBox, respectNames) {
    this._src = src;
    this._dim = extViewBox;
    this._respectNames = respectNames === true;
    this._canvas = null;
  }

  SVGP._eval = _eval;

  SVGP.prototype._recurse = function (callback) {
    var stackSrc = [this._src],
      stackTree = [this._canvas.root()];
    while (stackSrc.length > 0) {
      var srcItem = stackSrc.pop(), treeItem = stackTree.pop();
      callback(srcItem, treeItem);
      // Continue exploration
      if ('children' in srcItem && Array.isArray(srcItem.children)) {
        for (var i = srcItem.children.length - 1; i >= 0; i--) {
          stackSrc.push(srcItem.children[i]);
          stackTree.push(treeItem.getChildAt(i));
        }
      }
    }
  }

  SVGP.prototype._resolve = function (item, t) {
    var resolved = {};
    for (var attr in item) {
      if (attr === 'type' ||
        attr === 'name' ||
        attr === 'children' ||
        attr.startsWith('__')) {
        continue;
      }
      // Some hardening
      if (attr === 'id' || attr.startsWith('on')) {
        continue; // banned keys
      }
      // Resolve the variables
      var vars = {};
      if ('variables' in this._src) {
        for (var name in this._src.variables) {
          vars[name] = SVGP._eval(this._src.variables[name], {'t': t});
        }
      }
      vars['t'] = t;
      resolved[attr] = SVGP._eval(item[attr], vars);
      // Do conversion if necessary
      if (typeof item[attr] === 'object' && item[attr] !== null &&
        ('convert' in item[attr])) {
        resolved[attr] = _CONV[item[attr].convert](resolved[attr]);
      }
    }
    return resolved;
  }

  SVGP.prototype.draw = function (canvas, t) {
    // Create the canvas item
    this._canvas = canvas;
    this._canvas.setViewBox.apply(this._canvas, this.viewBox());
    // Draw items recursively
    var context = this._canvas.context();
    this._recurse((function (srcItem, treeItem) {
      if ('children' in srcItem && Array.isArray(srcItem.children)) {
        for (var i = 0; i < srcItem.children.length; i++) {
          const childSpec = this._resolve(srcItem.children[i], t),
            type = srcItem.children[i].type;
          if (this._respectNames && 'name' in srcItem.children[i]) {
            treeItem.appendNamedChild(
              srcItem.children[i].name, context.raw(type, childSpec));
          } else {
            treeItem.appendUnnamedChild(context.raw(type, childSpec));
          }
        }
      }
    }).bind(this));
  }

  SVGP.prototype.update = function (t) {
    var context = this._canvas.context();
    this._recurse((function (srcItem, treeItem) {
      if ('children' in srcItem && Array.isArray(srcItem.children)) {
        for (var i = 0; i < srcItem.children.length; i++) {
          const childSpec = this._resolve(srcItem.children[i], t);
          context.applyProps(treeItem.getChildAt(i).item(), childSpec);
        }
      }
    }).bind(this));
  }

  SVGP.prototype.viewBox = function () {
    return 'viewBox' in this._src ? this._src['viewBox'] : this._dim;
  }

  SVGP.prototype.toJSON = function () {
    return JSON.stringify(this._src);
  }

  SVGP.prototype.toString = function () {
    return this._src.type + ' image \n' +
      (this._src.__author__ ?
        (' Author: ' + this._src.__author__) : '(No author info)') + '\n\n ' +
        (this._src.__desc__ ? this._src.__desc__ : '(No description)');
  }

  return SVGP;
})();
