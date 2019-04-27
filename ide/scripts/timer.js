/** Re-usable timer **/
var Timer = (function () {
  var Broadcast = function (timer, interval, listener) {
    this._timer = timer;
    this._interval = interval;
    this._listener = listener;
    this._intervalId = setInterval(this._onInterval.bind(this), interval);
  };

  Broadcast.prototype.pause = function () {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
    }
    this._intervalId = null;
  };

  Broadcast.prototype.start = function () {
    if (this._intervalId === null) {
      this._intervalId =
        setInterval(this._onInterval.bind(this), this._interval);
    }
  };

  Broadcast.prototype._onInterval = function () {
    if (this._timer.isRunning) {
      this._listener(this._timer.time());
    }
  };

  var Timer = function () {
    this._startTime = -1;
    this._time = 0;
    this.isRunning = false;
  };

  Timer.prototype.start = function () {
    if (!this.isRunning) {
      this._startTime = Date.now() - this._time;
      this.isRunning = true;
    }
  };
  
  Timer.prototype.stop = function () {
    if (this.isRunning) {
      this._time = Date.now() - this._startTime;
      this._startTime = -1;
      this.isRunning = false;
    }
  };

  Timer.prototype.set = function (time) {
    this._time = time;
    this._startTime = Date.now() - time;
  }

  Timer.prototype.time = function () {
    if (this.isRunning) {
      this._time = Date.now() - this._startTime;
    }
    return this._time;
  }

  Timer.prototype.broadcast = function (resolution, listener) {
    return new Broadcast(this, resolution, listener);
  };

  return Timer;
})();
