/** Pettan.js -Event Library- v0.2 **/
var Pettan = (function () {
  var Pettan = function () {
    this.bindings = {};
  };

  Pettan.prototype.bind = function (item, nativeEventName, eventName) {
    var self = this;
    item.addEventListener(nativeEventName, function (e) {
      self.emit(eventName, {
        'type': 'NativeEvent',
        'event': e,
        'object': this
      });
    });
  };

  Pettan.prototype.emit = function (eventName, data) {
    var promise = Promise.resolve(data);
    if (eventName in this.bindings) {
      for (var i = 0; i < this.bindings[eventName].length; i++) {
        promise = promise.then(this.bindings[eventName][i]);
      }
    }
    return promise;
  };

  Pettan.prototype.listen = function (eventName, handler) {
    if (!(eventName in this.bindings)) {
      this.bindings[eventName] = [];
    }
    this.bindings[eventName].push(handler);
  };

  // Drop all bindings for event
  Pettan.prototype.drop = function (eventName) {
    this.bindings[eventName] = [];
  }

  Pettan.prototype.rename = function (eventOldName, eventNewName) {
    if (eventNewName in this.bindings &&
      this.bindings[eventNewName].length !== 0) {

      throw new Error('Cannot rename to ' + eventNewName + '. ' + 
        'A non-empty listener group with the same name already exists.');
    }
    this.bindings[eventNewName] = this.bindings[eventOldName];
    delete this.bindings[eventOldName];
  }
  return Pettan;
})();