/** 
 * libGAS2BAS - exports GAS scripts to BAS
 */
var BasTranslator = (function () {
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

  Script.prototype.fromGas = function (gasSpec) {
    this._gasSpec = gasSpec;
    for (var objName in this._gasSpec) {
      try {
        var type = this.typeToBas(this._gasSpec[objName].type);
        this._basSpec.defs[objName] = {
          'type': type,
          'properties': {}
        };
      } catch (e) {
        console.log(e);
      }
    }
  };
  
  Script.prototype.fromBas = function () {
    throw new Error('Not implemented');
  };

  Script.prototype._outputDefProperties = function (obj) {
    var propText = [];
    for (var propName in obj) {
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
            this._outputDefProperties(prop.value) + '}');
          break;
      }
    }
    return propText.join('\n');
  };

  Script.prototype.toBas = function () {
    var output = [];
    for (var key in this._basSpec) {
      var defData = 'def ' + this._basSpec[key].type + ' ' + key + ' {\n' +
        this._outputDefProperties(this._basSpec[key]) + '}';
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
    
  };
})();