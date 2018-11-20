/**
 * libGAS2BAS - exports GAS scripts to BAS
 */
var BasTranslator = (function () {
  var PROPERTIES = {
    'text': ['content', 'x', 'y', 'anchorX', 'anchorY',
      'color', 'fontSize', 'fontFamily', 'scale'],
    'button': ['text', 'x', 'y', 'anchorX', 'anchorY',
      'color', 'fontSize', 'fontFamily', 'scale'],
    'path': ['d', 'x', 'y', 'anchorX', 'anchorY',
      'scale'],
  };
  var DEFAULT_BAS_EXPORT_CONFIG = {
    'generateComments': false,
    'useRelativeValues': false
  };
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
    // Translate BAS name to GAS name
    this._basObjects = {};
    // Translate GAS name to BAS name
    this._gasObjects = {};
    this._basSpec = {
      'defs': {},
      'sets': {}
    };
    this._gasSpec = {};
  };

  Script.prototype._typeToBas = function(type) {
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

  Script.prototype._registerBasName = function (name) {
    if (name in thsi._basObjects || name in this._gasObjects) {
      throw new Error('Name[BAS] ' + name + ' already used!');
    }
    this._gasObjects[name] = name;
    this._basObjects[name] = name;
  };

  Script.prototype._registerGasName = function (name) {
    var basName = name.replace(new RegExp('[^a-zA-Z0-9]', 'g'), '_');
    if (basName in this._basObjects || name in this._gasObjects) {
      throw new Error('Name[GAS] ' + name + '->' + basName + ' already used!');
    }
    this._basObjects[basName] = name;
    this._gasObjects[name] = basName;
  };

  Script.prototype._copyProperties = function (properties, spec) {
    var props = {};
    if (!Array.isArray(properties)) {
      return props;
    }
    for (var i = 0; i < properties.length; i++) {
      switch(properties[i]) {
        case 'd':
          // Check type
          if ('type' in spec['content'] && spec['content'].type === 'svg') {
            var paths = [];
            if (Array.isArray(spec['content'].children)) {
              for (var j = 0; j < spec['content'].children.length; j++) {
                var obj = spec['content'].children[j];
                if (obj.type === 'path') {
                  paths.push(obj.d.map(function (d) {
                    switch(d.action) {
                      case 'M':
                      case 'm':
                      case 'L':
                      case 'l':
                        return d.action + ' ' + d.x + ' ' + d.y;
                      case 'Z':
                      case 'z':
                      default:
                        return d.action;
                    }
                  }).join(' '));
                } else if (obj.type === 'rect') {
                  // TODO: simulate rect with path
                } else if (obj.type === 'circle') {
                  // TODO: simulate circle with path
                } else if (obj.type === 'ellipse') {
                  // TODO: simulate ellipse with path
                }
              }
            }
            props['d'] = {
              'type': 'string',
              'value': paths.join(' ')
            };
          } else {
            console.log('Content type of ' + spec['content'].type + ' unknown');
          }
          break;
        case 'text':
        case 'content':
          if (!('content' in spec)) {
            break;
          }
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
          } else if ('position.anchor' in spec &&
            Array.isArray(spec['position.anchor'])) {
            props['anchorX'] = {
              'type': 'number',
              'value': spec['position.anchor'][0]
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
          } else if ('position.anchor' in spec &&
            Array.isArray(spec['position.anchor'])) {
            props['anchorY'] = {
              'type': 'number',
              'value': spec['position.anchor'][1]
            };
          }
          break;
        case 'x':
          if ('position' in spec && 'x' in spec.position) {
            props['x'] = {
              'type': 'number',
              'value': spec.position.x
            };
          } else if ('position.x' in spec) {
            props['x'] = {
              'type': 'number',
              'value': spec['position.x']
            };
          }
          break;
        case 'y':
          if ('position' in spec && 'y' in spec.position) {
            props['y'] = {
              'type': 'number',
              'value': spec.position.y
            };
          } else if ('position.y' in spec) {
            props['y'] = {
              'type': 'number',
              'value': spec['position.y']
            };
          }
          break;
        case 'color':
          if ('font' in spec && 'color' in spec.font) {
            props['color'] = {
              'type': 'number',
              'value': spec.font.color
            };
          } else if ('font.color' in spec) {
            props['color'] = {
              'type': 'number',
              'value': spec['font.color']
            };
          }
          break;
        case 'fontFamily':
          if ('font' in spec && 'family' in spec.font) {
            props['fontFamily'] = {
              'type': 'string',
              'value': spec.font.family.toString()
            };
          } else if ('font.family' in spec) {
            props['fontFamily'] = {
              'type': 'string',
              'value': spec['font.family'].toString()
            };
          }
          break;
        case 'fontSize':
          if ('font' in spec && 'size' in spec.font) {
            props['fontSize'] = {
              'type': 'number',
              'value': spec.font.size
            };
          } else if ('font.size' in spec) {
            props['fontSize'] = {
              'type': 'number',
              'value': spec['font.size']
            };
          }
          break;
        case 'scale':
          if ('transform' in spec && 'scale' in spec.transform) {
            props['scale'] = {
              'type': 'number',
              'value': spec.transform.scale
            };
          } else if ('transform.scale' in spec) {
            props['scale'] = {
              'type': 'number',
              'value': spec['transform.scale']
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
    // Validate and save the spec
    if (typeof gasSpec !== 'object' || gasSpec === null ||
      !('objects' in gasSpec) ||
      !('animation' in gasSpec) ||
      !('metadata' in gasSpec)) {

      throw Error('Malformed gas spec object.');
    }
    this._gasSpec = gasSpec;
    // Copy objects
    for (var objName in this._gasSpec['objects']) {
      try {
        var type = this._typeToBas(this._gasSpec['objects'][objName].type);
        this._registerGasName(objName);
        this._basSpec.defs[this._gasObjects[objName]] = {
          'type': type,
          'properties': this._copyProperties(
            PROPERTIES[type],
            this._gasSpec['objects'][objName])
        };
        this._basSpec.sets[this._gasObjects[objName]] = {
          'linear': [],
          'none': []
        };
      } catch (e) {
        console.log(e);
      }
    }
    // Copy animations
    if ('anchors' in this._gasSpec['animation']) {
      var lastATime = {}, lastNTime = {};
      for (var i = 0; i < this._gasSpec['animation']['anchors'].length; i++) {
        var anchor = this._gasSpec['animation']['anchors'][i];
        for (var objName in anchor.objects) {
          if (!(objName in lastATime)) {
            lastATime[objName] = 0;
          }
          if (!(objName in lastNTime)) {
            lastNTime[objName] = 0;
          }
          var adur = anchor.time - lastATime[objName];
          var ndur = anchor.time - lastNTime[objName];

          for (var easing in anchor.objects[objName]) {
            switch (easing) {
              case 'none':
                // TODO: Bug with bas renderer makes this broken!
                var props = this._copyProperties(PROPERTIES[type],
                  anchor.objects[objName][easing]);
                if (!_isEmpty(props)) {
                  this._basSpec.sets[this._gasObjects[objName]].none.push({
                    'time': ndur,
                    'properties': props
                  });
                  lastNTime[objName] = anchor.time;
                }
                break;
              default:
                console.warn('Unsupported easing ' + easing +
                  ' -> fallback to linear.');
              case 'linear':
                var props = this._copyProperties(PROPERTIES[type],
                  anchor.objects[objName][easing]);
                if (!_isEmpty(props)) {
                  this._basSpec.sets[this._gasObjects[objName]].linear.push({
                    'time': adur,
                    'properties': props
                  });
                  lastATime[objName] = anchor.time;
                }
                break;
            }
          }
        }
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

  Script.prototype._outputAnimation = function (animation) {
    return '{\n' + this._outputDefProperties(animation, 1) + '} ';
  };

  Script.prototype.toBas = function (config) {
    var output = [];
    // Generate all the objects
    for (var key in this._basSpec.defs) {
      var defData = 'def ' + this._basSpec.defs[key].type + ' ' + key + ' {\n' +
          this._outputDefProperties(this._basSpec.defs[key], 1) +
        '}';
      output.push(defData);
    }
    output.push('');
    // Generate all the animations (best effort)
    for (var key in this._basSpec.sets) {
      var setData = '';
      for (var i = 0; i < this._basSpec.sets[key].linear.length; i++) {
        var animation = this._basSpec.sets[key].linear[i];
        setData += 'set ' + key + ' ' +
          this._outputAnimation(animation) +
          _timeToString(animation.time) + '\n';
        if (i < this._basSpec.sets[key].linear.length - 1) {
          setData += 'then ';
        }
      }
      for (var i = 0; i < this._basSpec.sets[key].none.length; i++) {
        var animation = this._basSpec.sets[key].none[i];
        // Set the delay
        setData += 'set ' + key + ' { } ' +
          _timeToString(animation.time) + '\n';
        // Set an instant time
        setData += 'then set ' + key + ' ' +
          this._outputAnimation(animation) +
          '0s\n';
        if (i < this._basSpec.sets[key].none.length - 1) {
          setData += 'then ';
        }
      }
      output.push(setData);
    }
    return output.join('\n');
  };

  Script.prototype.toGas = function () {
    return this._gasSpec;
  };

  var BasTranslator = {};
  BasTranslator.fromBas = function (str) {
    var script = new Script();
    script.fromBas(str);
    return script.toGas();
  };
  BasTranslator.toBas = function(spec) {
    var script = new Script();
    script.fromGas(spec);
    return script.toBas();
  };

  return BasTranslator;
})();
