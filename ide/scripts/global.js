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

var _Create = function (type, props, children, callback) {
	var elem = null;
	if (type === "text") {
		return document.createTextNode(props);
	} else if(type === "svg"){
		elem = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	}else {
		elem = document.createElement(type);
	}
	for(var n in props){
		if(n !== "style" && n !== "className"){
			elem.setAttribute(n, props[n]);
		}else if(n === "className"){
			elem.className = props[n];
		}else{
			for(var x in props.style){
				elem.style[x] = props.style[x];
			}
		}
	}
	if (children) {
		for(var i = 0; i < children.length; i++){
			if(children[i] != null) {
				elem.appendChild(children[i]);
      }
		}
	}
	if (callback && typeof callback === "function") {
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
