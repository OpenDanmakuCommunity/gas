/** Global Helpers **/
var $ = function (e) { return document.getElementById(e);};

var _deepCopy = function (obj) {
  if (Array.isArray(obj)) {
    return obj.slice(0).map(function (item) {
      return _deepCopy(item);
    });
  }
  if (typeof obj === 'number' || typeof obj === 'string' ||
    typeof obj === 'boolean' || obj === null) {
    return obj;
  }
  if ('clone' in obj && typeof obj['clone'] === 'function') {
    return obj.clone();
  }
  var newObj = {};
  for (var key in obj) {
    newObj[key] = _deepCopy(obj[key]);
  }
  return newObj;
};

var _isEmpty = function (obj) {
  for (var key in obj) {
    return false;
  }
  return true;
};

var _Create = function (type, props, children, callback) {
  var elem = null;
  if (type === 'text') {
    return document.createTextNode(props);
  } else if (type === 'svg:svg' ||
    type === 'svg:text' ||
    type === 'svg:line' ||
    type === 'svg:rect' ||
    type === 'svg:circle' ||
    type === 'svg:ellipse' ||
    type === 'svg:path' ||
    type === 'svg:polygon' ||
    type === 'svg:polyline' ||
    type === 'svg:g') {
    var tag = type.split(':').slice(1).join(':');
    elem = document.createElementNS("http://www.w3.org/2000/svg", tag);
  } else {
    elem = document.createElement(type);
  }
  for (var n in props) {
    if (n !== 'style' && n !== 'className') {
      elem.setAttribute(n, props[n]);
    } else if(n === 'className') {
      elem.className = props[n];
    } else {
      for (var x in props.style) {
        elem.style[x] = props.style[x];
      }
    }
  }
  if (children) {
    for (var i = 0; i < children.length; i++) {
      if (children[i] != null) {
        elem.appendChild(children[i]);
      }
    }
  }
  if (callback && typeof callback === 'function') {
    callback(elem);
  }
  return elem;
};

var _CreateP = function (text, props) {
  return _Create('p', props, [
    _Create('text', text)
  ]);
};

var _ToggleClass = function (elem, className, enable) {
  if (typeof enable !== 'boolean') {
    throw new Error('Expected a boolean for enable parameter');
  }
  if (Array.isArray(elem)) {
    for (var i = 0; i < elem.length; i++) {
      _ToggleClass(elem[i], className, enable);
    }
    return;
  }

  var classes = elem.className.split(' ').filter(function (c) {
    return c.length > 0;
  });
  if (Array.isArray(className)) {
    for (var i = 0; i < className.length; i++) {
      _ToggleClass(elem, className[i], enable);
    }
  } else if ((classes.indexOf(className) >= 0) !== enable) {
    if (enable) {
      classes.push(className);
    } else {
      classes.splice(classes.indexOf(className), 1);
    }
    elem.className = classes.join(' ');
  }
};
