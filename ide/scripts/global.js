/** Global Helpers **/
var $ = function (e) { return document.getElementById(e);};

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

var _ToggleClass = function (elem, className, enable) {
  var classes = elem.className.split(' ');
  if ((classes.indexOf(className) >= 0) !== enable) {
    if (enable) {
      classes.push(className);
    } else {
      classes.splice(classes.indexOf(className), 1);
    }
  }
  elem.className = classes.join(' ');
};