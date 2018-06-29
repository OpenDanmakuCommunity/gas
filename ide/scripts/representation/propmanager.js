var EasingFunctions = {
  'linear': function (t, b, c, d) {
    return t * c / d + b;
  },
  'quadratic': function (t, b, c, d) {
    t /= d / 2;
    if (t < 1) {
      return c / 2 * t * t + b;
    }
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
  },
  'cubic': function (t, b, c, d) {
    t /= d / 2;
    if (t < 1) {
      return c / 2 * t * t * t + b;
    }
    t -= 2;
    return c / 2 * (t * t * t + 2) + b;
  },
  'circular': function (t, b, c, d) {
    t /= d / 2;
    if (t < 1) {
      return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
    }
    t -= 2;
    return c / 2 * (Math.sqrt(1 - t * t) + 1) + b;
  },
  'sine': function (t, b, c, d) {
    return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
  },
  'exponential': function (t, b, c, d) {
    t /= d / 2;
    if (t < 1) {
      return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
    }
    t--;
    return c / 2 * ( -Math.pow(2, -10 * t) + 2 ) + b;
  },
  'none': null
};

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

  var PropManager = function (base, anchorsInst, onChange) {
    // This is the base spec (0-th key frame)
    this._baseSpec = base;
    // Anchors is a list of key frames
    this.anchors = anchorsInst;
    // onChange is delegator function to delegate upwards
    this._onPropChange = onChange;
    // This saves the properties RIGHT NOW
    this.spec = {};

    // This saves the current key-frame's properties
    this._keyFrame = null;
    this._keyFrameIndex = -1;
    this._applyProps(base);
  };

  // Pins are associated with region (startTime, endTime]
  PropManager.prototype._getKeyFrameIndex = function (time) {
    if (time <= 0) {
      return -1;
    }
    for (var i = 0; i < this.anchors.length; i++) {
      if (this.anchors[i].end < time) {
        // This record is not affected
        continue;
      }
      if (this.anchors[i].start < time) {
        // This is exactly the range
        return i;
      } else {
        // This is in a blank range and thus should be associated with the pin
        // before
        return i - 1;
      }
    }
    // All of the pins are before the current spec
    if (this.anchors.length === 0) {
      return -1;
    } else {
      // Blank range so use last pin
      return this.anchors.length - 1;
    }
  };

  PropManager.prototype._isConfigurable = function (time) {
    var recIdx = this._getKeyFrameIndex(time);
    if (recIdx === -1) {
      return true; // Configures the base time
    } else {
      if (this.anchors[recIdx].end === time) {
        return true; // The time is exactly at the end marker
      } else if (recIdx === this.anchors.length - 1 && this.anchors[recIdx].end < time) {
        return true;
      } else {
        return false;
      }
    }
  };

  // Set the property RIGHT NOW
  PropManager.prototype._setProp = function (propertyName, newValue) {
    this.spec[propertyName] = newValue;
    if (this._onPropChange !== null) {
      this._onPropChange(propertyName, newValue, this);
    }
  };

  PropManager.prototype._applyProps = function (props, keyFrame) {
    for (var propName in props) {
      if (keyFrame) {
        this._keyFrame[propName] = props[propName];
      }
      this._setProp(propName, props[propName]);
    }
  };

  PropManager.prototype._applyKeyFrame = function (index) {
    // TODO: Optimize KeyFrame stuff
    this._keyFrameIndex = index;
    this._keyFrame = {};
    this._applyProps(this._baseSpec, true);
    // Now run through the index
    for (var i = 0; i < index; i++) {
      for (var easing in this.anchors[i].spec) {
        this._applyProps(this.anchors[i].spec[easing], true);
      }
    }
  };

  PropManager.prototype._applySubframe = function (time) {
    if (this._keyFrameIndex < 0) {
      if (time !== 0) {
        throw new Error('Attempting to apply subframe at origin with ' +
          'non-origin time.');
      }
      return;
    }
    var frameSpec = this.anchors[this._keyFrameIndex];
    time = Math.min(time, frameSpec.end); // Cap time

    for (var easing in frameSpec.spec) {
      for (var propName in frameSpec.spec[easing]) {
        var actualEasing = easing;
        if (!(actualEasing in EasingFunctions)) {
          console.log('Selected easing ' + easing +
            ' not available. Defaulting to linear.');
          actualEasing = 'linear';
        }
        // Cannot ease due to value type
        if (easing !== 'none' &&
          (typeof this._keyFrame[propName] !== 'number' ||
          typeof frameSpec.spec[easing][propName] !== 'number')) {

          console.warn('Type ' + propName + ' cannot be eased. Not a number.' +
            'Static easing (none) automatically enforced.');
          actualEasing = 'none';
        }
        if (actualEasing === 'none') {
          if (time >= frameSpec.end) {
            this._setProp(propName, frameSpec.spec[easing][propName]);
          }
          // Otherwise don't bother with that value
        } else {
          // Use actual easing for easing but original value for params
          this._setProp(propName,
            EasingFunctions[actualEasing](time - frameSpec.start,
              this._keyFrame[propName],
              frameSpec.spec[easing][propName] - this._keyFrame[propName],
              frameSpec.end - frameSpec.start));
        }
      }
    }
  };

  PropManager.prototype.time = function (time) {
    // Figure out if the time requires a change in index
    if (typeof time !== 'number' || isNaN(time)) {
      throw new Error('PropManager.time expects a non-NaN number!');
    }
    var newIndex = this._getKeyFrameIndex(time);
    if (newIndex === this._keyFrameIndex) {
      // We are still on the same old frame
      if (this._keyFrameIndex < 0) {
        // We are before the first keyFrame
        if (this._keyFrame === null) {
          // Initialize the frame
          this._applyKeyFrame(newIndex);
        }
      } else {
        // Apply the subframes
        this._applySubframe(time);
      }
    } else {
      // Setup the new frame
      this._applyKeyFrame(newIndex);
      this._applySubframe(time);
    }
  };

  PropManager.prototype._getPropKeyByIndex = function (index, propName, def) {
    if (index === -1) {
      if (propName in this._baseSpec) {
        return this._baseSpec[propName];
      } else {
        return def;
      }
    } else {
      // Figure out if this is in the specified prop region
      for (var easing in this.anchors[index].spec) {
        if (propName in this.anchors[index].spec[easing]) {
          return this.anchors[index].spec[easing][propName];
        }
      }
      // Did not find anything,
      return this._getPropByIndex(index - 1, propName, def);
    }
  };

  PropManager.prototype.getPropAtTime = function (time, propName, def) {
    // Get the latest key
    var index = this._getKeyFrameIndex(time);
    var property = this._getPropKeyByIndex(index, propName, def);
    // Apply the micro time
  };

  PropManager.prototype.getProp = function (propName, def) {
    return propName in this.spec ? this.spec[propName] : def;
  };

  PropManager.prototype.saveProp = function (time, propertyName, value, easing) {
    if (!this._isConfigurable(time)) {
      throw new Error('Time ' + time + ' is in the middle of an animation!');
    }
    // Figure out what to update
    var index = this._getKeyFrameIndex(time);
    if (index < 0) {
      // Update the base
      this._baseSpec[propertyName] = value;
      this._setProp(propertyName, value);
    } else {
      // Update the pin in time
      if (typeof easing !== 'string' || easing === null) {
        easing = 'linear';
      }
      if (!(easing in this.anchors[index].spec)) {
        this.anchors[index].spec[easing] = {};
      }
      this.anchors[index].spec[easing][propertyName] = value;
      this._setProp(propertyName, value);
    }
  };

  PropManager.prototype.getKeyTime = function (time, mode) {
    if (mode !== 'before' && mode !== 'after') {
      throw new Error('Mode must be one of before, after');
    }
    var ends = this.anchors.map(function (a) { 
      return a.end;
    }).sort(function (a, b) {
      return a - b;
    });
    for (var i = 0; i < ends.length; i++) {
      if (mode === 'after') {
        if (ends[i] > time) {
          return ends[i];
        }
      } else {
        if (ends[i] >= time) { 
          if (i === 0) {
            return 0;
          } else {
            return ends[i - 1];
          }
        }
      }
    }
    return mode === 'before' ? (ends.length > 0 ? ends[ends.length - 1]: 0)
      : -1;
  };

  PropManager.prototype.getKeyFrame = function (time) {
    if (typeof time !== 'number') {
      throw new Error('Time must be a number!');
    }
    if (isNaN(time)) {
      throw new Error('Time cannot be NaN!');
    }
    for (var i = 0; i < this.anchors.length; i++) {
      if (this.anchors[i].start < time && this.anchors[i].end >= time) {
        return this.anchors[i];
      }
    }
    return null;
  };

  PropManager.prototype.createKeyFrame = function (start, end) {
    if (typeof start !== 'number' || typeof end !== 'number') {
      throw new Error('Start and end must both be numbers!');
    }
    if (isNaN(start) || isNaN(end)) {
      throw new Error('Start or end cannot be NaN!');
    }
    var keyFrame = {
      'start': start,
      'end': end,
      'spec': {
        'none': {}
      }
    };
    // Insert the keyFrame into the correct location
    this.anchors.push(keyFrame);
    this.anchors.sort(function (a, b) {
      return a.end > b.end ? 1 : (a.end < b.end ? -1 : 0);
    });
  };

  PropManager.prototype.splitKeyFrame = function (intermediate) {

  };

  return PropManager;
})();
