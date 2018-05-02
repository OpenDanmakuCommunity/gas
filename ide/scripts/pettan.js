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
        'object': self
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
  return Pettan;
})();