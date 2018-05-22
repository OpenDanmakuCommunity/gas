var Logger = (function () {
  var Logger = function (logBox) {
    this._logBox = logBox;
    this.historyMax = 48;
  };

  Logger.prototype._toElement = function (message) {
    var hist = _CreateP(message, {
      'draggable': 'false'
    });
    this._logBox.insertBefore(hist, this._logBox.firstChild);

    while (this._logBox.childElementCount > this.historyMax) {
      this._logBox.removeChild(this._logBox.lastChild);
    };
    return hist;
  };

  Logger.prototype.log = function (message) {
    var log = this._toElement(message);
    log.className = 'log';
    console.log(message);
  };

  Logger.prototype.warn = function (message) {
    var log = this._toElement(message);
    log.className = 'warning';
    console.warn(message);
  };

  Logger.prototype.error = function (message) {
    var log = this._toElement(message);
    log.className = 'error';
    console.error(message);
  };

  Logger.prototype.bind = function (P) {
    P.listen('trace.log', (function (message) {
      this.log(message);
      return message;
    }).bind(this));
    P.listen('trace.warn', (function (message) {
      this.warn(message);
      return message;
    }).bind(this));
    P.listen('trace.error', (function (message) {
      this.error(message);
      return message;
    }).bind(this));
  };

  return Logger;
})();
