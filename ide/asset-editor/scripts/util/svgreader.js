var SVGReader = (function () {
  var SVG_WL = [
    'svg', 'g', 'path', 'rect', 'text', 'ellipse', 'polygon', 'polyline',
    'circle', 'line', 'textPath', 'use'
  ];

  function SVGReader (text) {
    this._svg = (new DOMParser()).parseFromString(text, "image/svg+xml");
    this._cssRules = {};
    this._defs = [];
    this._resolveMaps = {}; // Map of "#" names

    this._css();
  }

  SVGReader.prototype._defs = function () {
    const defBlocks = this._svg.getElementsByTagName('defs');

  }

  SVGReader.prototype._css = function () {
    // Extract css rules
    const styleDefs = this._svg.getElementsByTagName('style');
    for (var i = 0; i < styleDefs.length; i++) {
      const sheet = styleDefs[i].sheet;
      for (var j = 0; j < sheet.cssRules.length; j++) {
        const rule = sheet.cssRules[j];
        if (!(rule.selectorText in this._cssRules)) {
          this._cssRules[rule.selectorText] = {};
        }
        for (var k = 0; k < rule.style.length; k++) {
          this._cssRules[rule.selectorText][rule.style[k]] =
            rule.style[rule.style[k]];
        }
      }
    }
  }

  SVGReader.prototype._shallowApplyCssRules = function (node, className) {
    // This is an incorrect CSS selector implementation that only works in some
    // cases
    var selectors = className.split(' ');
    selectors.forEach((function (selector) {
      const selectorName = '.' + selector;
      if (selectorName in this._cssRules) {
        for (var rule in this._cssRules[selectorName]) {
          node[rule] = this._cssRules[selectorName][rule];
        }
      }
    }).bind(this));
  }

  SVGReader.prototype._recurse = function (root) {
    if (root.nodeType !== 1) {
      // Need an element node to work!
      return null;
    }
    if (SVG_WL.indexOf(root.nodeName) < 0) {
      // Only deal with whitelisted items
      return null;
    }
    const rootNode = {
      'type': root.nodeName,
      'children': []
    };
    if (root.hasAttributes()) {
      for (var i = 0; i < root.attributes.length; i++) {
        const attr = root.attributes[i];
        if (attr.name === 'id') {
          rootNode['name'] = attr.value;
        } else if (attr.name === 'class') {
          this._shallowApplyCssRules(rootNode, attr.value);
        } else {
          rootNode[attr.name] = attr.value;
        }
      }
    }
    // Handle local stylesheet
    if (root.style && root.style.length && root.style.length > 0) {
      for (var i = 0; i < root.style.length; i++) {
        rootNode[root.style[i]] = root.style[root.style[i]];
      }
    }
    for (var i = 0; i < root.childNodes.length; i++) {
      const childNode = root.childNodes[i];
      const built = this._recurse(childNode);
      if (built !== null) {
        rootNode.children.push(built);
      }
    }
    return rootNode;
  }

  SVGReader.prototype.import = function () {
    const svgTag = this._svg.getElementsByTagName('svg');
    if (svgTag.length === 0) {
      return [];
    }
    const wrapped = this._recurse(svgTag[0]);
    const result = {
      'type': 'svg',
      '__desc__': 'Imported by SVGReader',
      'children': wrapped.children
    };
    if ('viewBox' in wrapped) {
      result['viewBox'] = wrapped.viewBox.split(' ').map(function (n) {
        return parseFloat(n);
      });
    }
    return result;
  }

  return SVGReader;
})();
