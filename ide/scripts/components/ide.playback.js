var Playback = (function () {
  var DEFAULT_PIXEL_CONVERSION = 10;
  var TIMELINE_LABEL_OFFSET = 200;

  var Playback = function (timer, playbackControls, timelineIndicators) {
    if (!ReprTools || !Repr || !_Create || !_ToggleClass) {
      throw new Error('Environment not loaded correctly!');
    }
    this.T = timer;

    this._scale = DEFAULT_PIXEL_CONVERSION;
    this._playBtn = playbackControls.playBtn;
    this._stopBtn = playbackControls.stopBtn;
    this._recBtn = playbackControls.recBtn;
    this._ffBtn = playbackControls.ffBtn;
    this._rwBtn = playbackControls.rwBtn;

    this._ruler = timelineIndicators.ruler;
    this._slider = timelineIndicators.slider;
    this._sliderValue = timelineIndicators.sliderValue;
  };

  Playback.prototype.getDuration = function () {
    return ReprTools.getDuration();
  };

  Playback.prototype.setDuration = function (duration) {
    ReprTools.setDuration(duration);
  };

  Playback.prototype.offsetTimeToPixels = function (time) {
    return this.timeToPixels(time) + TIMELINE_LABEL_OFFSET;
  };

  Playback.prototype.timeToPixels = function (time) {
    return Math.floor(time / this._scale);
  };

  Playback.prototype.pixelsToTime = function (pixel) {
    return Math.floor(pixel * this._scale);
  };

  Playback.prototype.findNextKeyFrame = function (objects, time) {
    var nearestTimes = objects.map(function (name) {
      return ReprTools.getObject(name)._pm.getKeyTime(time, 'after');
    }).filter(function (t) {
      return t >= 0;
    }).sort(function (a, b) {
      return a - b;
    });
    if (nearestTimes.length === 0) {
      return time;
    } else {
      return nearestTimes[0];
    }
  };

  Playback.prototype.findPreviousKeyFrame = function (objects, time) {
    var nearestTimes = objects.map(function (name) {
      return ReprTools.getObject(name)._pm.getKeyTime(time, 'before');
    }).filter(function (t) {
      return t >= 0;
    }).sort(function (a, b) {
      return b - a;
    });
    console.log(nearestTimes);
    if (nearestTimes.length === 0) {
      return time;
    } else {
      return nearestTimes[0];
    }
  };

  Playback.prototype.bindAnimation = function (P) {
    P.listen('timeline.update', function (time) {
      // Animate all the things
      ReprTools.allObjectNames().forEach(function (name) {
        var obj = ReprTools.getObject(name);
        if ('_pm' in obj) {
          obj._pm.time(time);
        }
      });
      return time;
    });
    P.listen('timeline.duration.set', (function (duration) {
      this.setDuration(duration);
      return duration;
    }).bind(this));
    P.listen('timeline.scale.set', (function (scale) {
      this._scale = Math.max(Math.round(scale), 1);
      return scale;
    }).bind(this));
  };

  Playback.prototype.bindTimer = function (P) {
    var T = this.T;
    P.listen('timer.start', (function () {
      T.start();
      _ToggleClass(this._playBtn, 'selected', true);
      return P.emit('timer.started');
    }).bind(this));
    P.listen('timer.stop', (function () {
      T.stop();
      _ToggleClass(this._playBtn, 'selected', false);
      return P.emit('timer.stopped');
    }).bind(this));
    P.listen('timer.seek', function (time) {
      T.set(time);
      return P.emit('timer.time', time);
    });
    P.listen('timer.time', (function (time) {
      var updates = [];
      updates.push(P.emit('slider.update', time));
      updates.push(P.emit('timeline.update', time));
      if (time > this.getDuration()) {
        updates.push(P.emit('timer.stop').then(
          P.emit('timer.seek', this.getDuration())));
      }
      return Promise.all(updates).then(P.next(time));
    }).bind(this));
    T.broadcast(10, function (time) {
      P.emit('timer.time', time);
    });
  };

  Playback.prototype.bind = function (P) {
    // Bind to playback buttons
    P.bind(this._playBtn, 'click', 'playback.toggle');
    P.listen('playback.toggle', (function (e) {
      try {
        e.event.target.blur();
      } catch (err) {}
      if (this.T.isRunning) {
        return P.emit('timer.stop').then(P.next(e));
      } else {
        return P.emit('timer.start').then(P.next(e));
      }
      return e;
    }).bind(this));
    P.bind(this._stopBtn, 'click', 'playback.stop');
    P.listen('playback.stop', function (e) {
      try {
        e.event.target.blur();
      } catch (err) {}
      return P.emit('timer.stop').then(P.emit('timer.seek', 0)).then(
        P.next(e));
    });
    P.bind(this._recBtn, 'click', 'playback.rec');
    P.listen('playback.rec', (function (e) {
      try {
        e.event.target.blur();
      } catch (err) {}
      return P.emit('timeline.rec', {
        'time': this.T.time(),
        'status': this.T.isRunning
      }).catch(function (err) {
        alert(err);
      }).then(P.next(e));
    }).bind(this));
    P.bind(this._ffBtn, 'click', 'playback.fastforward');
    P.listen('playback.fastforward', (function (e) {
      try {
        e.event.target.blur();
      } catch (err) {}
      var time = this.findNextKeyFrame(
          Selection.count() > 0 ? Selection.get() : ReprTools.allObjectNames(),
          this.T.time());
      return P.emit('timer.seek', time).then(P.next(e));
    }).bind(this));
    P.bind(this._rwBtn, 'click', 'playback.rewind');
    P.listen('playback.rewind', (function (e) {
      try {
        e.event.target.blur();
      } catch (err) {}
      var time = this.findPreviousKeyFrame(
          Selection.count() > 0 ? Selection.get() : ReprTools.allObjectNames(),
          this.T.time());
      return P.emit('timer.seek', time).then(P.next(e));
    }).bind(this));

    // Bind to the slider bar
    P.bind(this._ruler, 'mousedown', 'playback.seek');
    P.bind(this._ruler, 'mousemove', 'playback.scrub');
    P.listen('playback.seek', (function (e) {
      if (e.event.button !== 0) {
        return e;
      }
      return P.emit('timer.seek', this.pixelsToTime(e.event.offsetX));
    }).bind(this));
    P.listen('playback.scrub', (function (e) {
      if (e.event.buttons !== 1) {
        return e;
      }
      return P.emit('timer.seek', this.pixelsToTime(e.event.offsetX));
    }).bind(this));
    P.listen('slider.update', (function (time) {
      this._slider.style.left = this.offsetTimeToPixels(time) + 'px';
      this._sliderValue.innerText = (time / 1000).toFixed(3);
      return time;
    }).bind(this));

    // Bind to the keyboard
    P.listen('global.keydown', (function (key) {
      if (!key.input && key.key === ' ') {
        if (this.T.isRunning) {
          return P.emit('timer.stop').then(P.next(key));
        } else {
          return P.emit('timer.start').then(P.next(key));
        }
      }
      return key;
    }).bind(this));

    this.bindTimer(P);
    this.bindAnimation(P);
  };

  return Playback;
})();
