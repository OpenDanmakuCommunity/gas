var PropManager = (function () {
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
    var newObj = {};
    for (var key in obj) {
      newObj[key] = _deepCopy(obj[key]);
    }
    return newObj;
  };

  var PropManager = function (base, anchorsInst) {
    this._baseSpec = base;
    this.anchors = anchorsInst;
  };

  PropManager.prototype._getSpecIndex = function (time) {
    if (time <= 0) {
      return -1;
    }
    for (var i = 0; i < this.timeline.length; i++) {
      if (this.timeline.) {
        
      }
    }
  };

  PropManager.prototype.getProp = function (time, propertyName, default) {
    
  };

  PropManager.prototype.getProp = function (propertyName, def) {
    return propertyName in this.spec ? this.spec[propertyName] : def;
  };

  PropManager.prototype.setProp = function (propertyName, newValue) {
    this.spec[propertyName] = newValue;
  };

  return PropManager;
})();