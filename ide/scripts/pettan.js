/** Pettan.js -Event Library- v0.2 **/
var Pettan = (function () {
  var Pettan = function () {
    this.bindings = {};
    this.nativeBindings = {};
  };

  Pettan.prototype.bind = function (item, nativeEventName, eventName) {
    if (typeof item === 'undefined' || typeof nativeEventName === 'undefined'
      || typeof eventName === 'undefined') {

      throw new Error('Insufficient parameters');
    }
    var self = this;
    if (!(eventName in this.nativeBindings)) {
      this.nativeBindings[eventName] = [];
    }
    var currentNativeBinding = {
      'eventName': eventName
    };
    this.nativeBindings[eventName].push(currentNativeBinding);
    item.addEventListener(nativeEventName, function (e) {
      self.emit(currentNativeBinding.eventName, {
        'type': 'NativeEvent',
        'event': e,
        'object': this,
        'name': currentNativeBinding.eventName
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
    if (eventName in this.bindings) {
      delete this.bindings[eventName];
    }
    if (eventName in this.nativeBindings) {
      delete this.nativeBindings[eventName];
    }
  };

  Pettan.prototype.rename = function (eventOldName, eventNewName) {
    if (eventNewName in this.bindings &&
      this.bindings[eventNewName].length !== 0) {

      throw new Error('Cannot rename to ' + eventNewName + '. ' +
        'A non-empty listener group with the same name already exists.');
    }
    // Find native binding
    if (eventOldName in this.nativeBindings) {
      if (eventNewName in this.nativeBindings &&
        this.nativeBindings[eventNewName].length !== 0) {

        throw new Error('Cannot rename native bindings for ' + eventOldName +
          ' to ' + eventNewName + '. Naming conflict at target.');
      }
      this.nativeBindings[eventOldName].forEach(function (boundObject) {
        boundObject.eventName = eventNewName;
      });
      this.nativeBindings[eventNewName] = this.nativeBindings[eventOldName];
      delete this.nativeBindings[eventOldName];
    }
    if (eventOldName in this.bindings) {
      this.bindings[eventNewName] = this.bindings[eventOldName];
      delete this.bindings[eventOldName];
    }
  };

  Pettan.prototype.next = function (value) {
    return function () {
      return value;
    };
  };
  return Pettan;
})();
