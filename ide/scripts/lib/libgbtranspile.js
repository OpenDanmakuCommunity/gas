/** 
 * libGAS2BAS - exports GAS scripts to BAS
 */
var BasTranslator = (function () {
  var PROPERTIES = {
    'text': ['content', 'x', 'y', 'anchorX', 'anchorY', 'color', 'fontSize', 'fontFamily', 'scale'],
    'button': ['content'],
    'path': [],
  }
  var _timeToString = function (t) {
    var timeComponents = [];
    var units = ['ms', 's', 'm', 'h', 'd'];
    timeComponents.push(t % 1000);
    var s = Math.floor(t / 1000);
    timeComponents.push(s % 60);
    var m = Math.floor(s / 60);
    timeComponents.push(m % 60);
    var h = Math.floor(m / 60);
    timeComponents.push(h % 24);
    var d = Math.floor(h / 24);
    timeComponents.push(d);
    var output = [];
    while(units.length > 0) {
      var n = timeComponents.pop();
      var u = units.pop();
      if (n !== 0) {
        output.push(n + u);
      }
    }
    return output.join('');
  };
  
  var Script = function () {
    this._basSpec = {
      'defs': {},
      'sets': []
    };
    this._gasSpec = {};
  };

  Script.prototype.typeToBas = function(type) {
    switch(type){
      case 'Text':
      case 'RichText':
        return 'text';
      case 'Button':
        return 'button';
      case 'SVGSprite':
        return 'path';
      default:
        throw new Error('Unknown or unsupported [gas] type ' + type);
    }
  };

  Script.prototype.copyProperties = function (properties, spec) {
    var props = {};
    if (!Array.isArray(properties)) {
      return props;
    }
    for (var i = 0; i < properties.length; i++) {
      switch(properties[i]) {
        case 'content':
          props['content'] = {
              'type': 'string',
              'value': spec['content'].toString()
          };
          break;
        case 'anchorX':
          if ('position' in spec && 'anchor' in spec.position &&
            Array.isArray(spec.position.anchor)) {
            props['anchorX'] = {
              'type': 'number',
              'value': spec.position.anchor[0]
            };
          }
          break;
        case 'anchorY':
          if ('position' in spec && 'anchor' in spec.position &&
            Array.isArray(spec.position.anchor)) {
            props['anchorY'] = {
              'type': 'number',
              'value': spec.position.anchor[1]
            };
          }
          break;
        case 'x':
          if ('position' in spec && 'x' in spec.position) {
            props['x'] = {
              'type': 'number', 
              'value': spec.position.x
            };
          }
          break;
        case 'y':
          if ('position' in spec && 'x' in spec.position) {
            props['y'] = {
              'type': 'number', 
              'value': spec.position.y
            };
          }
          break;
        case 'color':
          if ('font' in spec && 'color' in spec.font) {
            props['color'] = {
              'type': 'number', 
              'value': spec.font.color
            };
          }
          break;
        case 'fontFamily':
          if ('font' in spec && 'family' in spec.font) {
            props['fontFamily'] = {
              'type': 'string', 
              'value': spec.font.family.toString()
            };
          }
          break;
        case 'fontSize':
          if ('font' in spec && 'size' in spec.font) {
            props['fontSize'] = {
              'type': 'number', 
              'value': spec.font.size
            };
          }
          break;
        default:
          break; // Do nothing
      }
    }
    return props;
  };

  Script.prototype.fromGas = function (gasSpec) {
    this._gasSpec = gasSpec;
    for (var objName in this._gasSpec['objects']) {
      try {
        var type = this.typeToBas(this._gasSpec['objects'][objName].type);
        this._basSpec.defs[objName] = {
          'type': type,
          'properties': this.copyProperties(
            PROPERTIES[type],
            this._gasSpec['objects'][objName])
        };
        // Copy the properties
      } catch (e) {
        console.log(e);
      }
    }
  };
  
  Script.prototype.fromBas = function () {
    throw new Error('Not implemented');
  };

  Script.prototype._outputDefProperties = function (obj, indent) {
    var propText = [];
    if (typeof indent !== 'number' || indent < 0) {
      indent = 1;
    }
    for (var propName in obj.properties) {
      var prop = obj.properties[propName];
      switch (prop.type) {
        case 'number':
        case 'string':
          propText.push(propName + ' = ' + JSON.stringify(prop.value));
          break;
        case 'percent':
          propText.push(propName + ' = ' + (prop.value * 100) + '%');
          break;
        case 'time':
          propText.push(propName + ' = ' + _timeToString(prop.value));
          break;
        case 'named':
          propText.push(propName + ' = ' + prop.value.type + '{' + 
            this._outputDefProperties(prop.value, indent + 1) + '}');
          break;
      }
    }
    var prefix = '';
    while(indent > 0) {
      prefix += '  ';
      indent --;
    }
    if (propText.length > 0) {
      return propText.map(function (v) {return prefix + v;}).join('\n') + '\n';
    } else {
      return '';
    }
  };

  Script.prototype.basVariableName = function (name) {
    return name.replace(new RegExp('[^a-zA-Z0-9]', 'g'), '_');
  };

  Script.prototype.toBas = function () {
    var output = [];
    for (var key in this._basSpec.defs) {
      var defData = 'def ' + this._basSpec.defs[key].type + ' ' + 
        this.basVariableName(key) + ' {\n' +
          this._outputDefProperties(this._basSpec.defs[key], 1) + 
        '}';
      output.push(defData);
    }
    return output.join('\n');
  };
  
  Script.prototype.toGas = function () {
    return this._gasSpec;
  };

  var BasTranslator = {};
  BasTranslator.fromBas = function (str) {
    
  };
  BasTranslator.toBas = function(spec) {
    var script = new Script();
    script.fromGas(spec);
    return script.toBas();
  };
  
  return BasTranslator;
})();