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
  var _setNested = function (object, nested, value) {
    var nested = nested.slice(0);
    var key = nested.shift();
    if (nested.length === 0) {
      object[key] = value;
      return;
    }
    if (key in object) {
      return _setNested(object[key], nested, value);
    } else {
      object[key] = {};
      return _setNested(object[key], nested, value);
    }
  }

  var PropManager = function (base, anchorsInst, onChange) {
    // Configuration
    this._withinKeyFrameBehavior = 'split';
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
    if (typeof time !== 'number' || isNaN(time)) {
      throw new Error('_getKeyFrameIndex: time must be non-NaN number');
    }
    if (time <= 0) {
      return -1;
    }
    for (var i = 0; i < this.anchors.length; i++) {
      if (this.anchors[i].end < time) {
        // This record is not affected
        continue;
      }
      // Implicit anchors[i].end >= time after this line
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
    return this.anchors.length - 1;
  };

  PropManager.prototype._getNextKeyFrameIndex = function (index) {
    if (index + 1 < this.anchors.length) {
      return index + 1;
    } else {
      return -1;
    }
  };

  PropManager.prototype._getPrevKeyFrameIndex = function (index) {
    if (index < 0) {
      return -1;
    } else {
      return index - 1;
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

  PropManager.prototype._inferEasing = function (easing, current, final) {
    var actualEasing = easing;
    // Unsupported
    if (!(actualEasing in EasingFunctions)) {
      console.log('Selected easing ' + easing + ' not available. ' +
        'Defaulting to linear.');
      actualEasing = 'linear';
    }
    // Cannot ease due to value type
    if (easing !== 'none' && (typeof current !== 'number' ||
        typeof final !== 'number')) {

      console.warn('Easing cannot be performed. start/end not a number.' +
        'Static easing (none) automatically enforced.');
      actualEasing = 'none';
    }
    return actualEasing;
  };

  PropManager.prototype._applySubframe = function (time) {
    if (this._keyFrameIndex < 0) {
      if (time !== 0) {
        throw new Error('_applySubframe: non-origin time for origin subframe.');
      }
      return;
    }
    var frameSpec = this.anchors[this._keyFrameIndex];
    time = Math.min(time, frameSpec.end); // Cap time

    for (var easing in frameSpec.spec) {
      for (var propName in frameSpec.spec[easing]) {
        var actualEasing = this._inferEasing(easing, this._keyFrame[propName],
          frameSpec.spec[easing][propName]);
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
      throw new Error('time: expects a non-NaN number!');
    }
    var frameIndex = this._getKeyFrameIndex(time);
    // Figure out what this frame is
    if (frameIndex < 0) {
      // We're at the start
      if (this._keyFrameIndex === frameIndex) {
        // Never left origin, do nothing
      } else {
        this._applyKeyFrame(frameIndex);
      }
    } else {
      var frame = this.anchors[frameIndex];
      if (frame.end < time) {
        // We're in a blank region
        if (this._keyFrameIndex === frameIndex) {
          // Entered by playing forwards
          this._applySubframe(frame.end);
        } else {
          // Entered by playing backwards
          this._applyKeyFrame(frameIndex);
          this._applySubframe(frame.end);
        }
      } else {
        // We're in a keyFrame
        if (this._keyFrameIndex === frameIndex) {
          // Check if we are in the last frame
          if (frameIndex === this.anchors.length - 1) {
            // Entering from past the last keyframe cannot be detected so we
            // force a safe rendering.
            this._applyKeyFrame(frameIndex);
            this._applySubframe(time);
          } else {
            // Entered by playing forwards
            this._applySubframe(time);
          }
        } else {
          // Entered by playing backwards
          this._applyKeyFrame(frameIndex);
          this._applySubframe(time);
        }
      }
    }
  };

  PropManager.prototype._getPropEasingAtIndex = function (index, propName) {
    for (var easing in this.anchors[index].spec) {
      if (propName in this.anchors[index].spec[easing]) {
        return easing;
      }
    }
    return null;
  };

  PropManager.prototype._getPropValueAtIndex = function (index, propName, def) {
    if (index === -1) {
      if (propName in this._baseSpec) {
        return this._baseSpec[propName];
      } else {
        return def;
      }
    } else {
      var easing = this._getPropEasingAtIndex(index, propName);
      if (easing !== null) {
        return this.anchors[index].spec[easing][propName];
      }
      // Did not find anything, move to last index
      return this._getPropValueAtIndex(index - 1, propName, def);
    }
  };

  PropManager.prototype.getPropAtTime = function (time, propName, def) {
    // Get the latest key
    var index = this._getKeyFrameIndex(time);
    var value = this._getPropValueAtIndex(index, propName, def);
    var easing = this._getPropEasingAtIndex(index, propName);
    if (easing === null) {
      // No need to apply microtime
      return value;
    } else {
      // Apply the micro time easing
      var actualEasing = this._inferEasing(easing, value,
        this.anchors[index].spec[easing][propName]);
      if (actualEasing === 'none') {
        if (time >= this.anchors[index].end) {
          return this.anchors[index].spec[actualEasing][propName];
        } else {
          return value;
        }
      } else {
        return EasingFunctions[actualEasing](time - this.anchors[index].start,
          value,
          this.anchors[index].spec[easing][propName] - value,
          this.anchors[index].end - this.anchors[index].start);
      }
    }
  };

  PropManager.prototype.getProp = function (propName, def) {
    return propName in this.spec ? this.spec[propName] : def;
  };

  PropManager.prototype.saveProp = function (
    time, propertyName, value, easing) {

    // Try to figure out the associated place to save the prop
    var index = this._getKeyFrameIndex(time);
    // Figure out if there's a frame after
    var nextIndex = this._getNextKeyFrameIndex(index);

    if (index < 0) {
      // If the next frame exists but doesn't have this prop, copy over current
      if (nextIndex >= 0 &&
        this._getPropEasingAtIndex(nextIndex, propertyName) === null) {
        this.anchors[nextIndex].spec['none'][propertyName] =
          this._baseSpec[propertyName];
      }
      // Update the base
      this._baseSpec[propertyName] = value;
      this._setProp(propertyName, value);
    } else {
      // This is the frame time is in or the frame before it
      var frame = this.anchors[index];
      if (frame.end <= time) {
        // Figure out the easing
        if (typeof easing !== 'string' || easing === null) {
          easing = 'none';
        }
        // Make sure the easing mode exists
        if (!(easing in this.anchors[index].spec)) {
          this.anchors[index].spec[easing] = {};
        }
        // Figure out if this property exists in different easing in current pin
        var currentEasing = this._getPropEasingAtIndex(index, propertyName);
        if (currentEasing !== easing && currentEasing !== null) {
          // Move old value over if it exists
          this.anchors[index].spec[easing][propertyName] =
            this.anchors[index].spec[currentEasing][propertyName];
          delete this.anchors[index].spec[currentEasing][propertyName];
        }
        // Update the next frame if it exists and doesnt have this property
        if (nextIndex >= 0 &&
          this._getPropEasingAtIndex(nextIndex, propertyName) === null) {
          this.anchors[nextIndex].spec['none'][propertyName] =
            this.anchors[index].spec[easing][propertyName];
        }
        // Update the current frame
        this.anchors[index].spec[easing][propertyName] = value;
        this._setProp(propertyName, value);
      } else {
        // We're in the middle of a frame!
        throw new Error('saveProp: ' + time + ' is within a frame.');
      }
    }
  };

  PropManager.prototype.getKeyTime = function (time, mode) {
    if (mode !== 'before' && mode !== 'after') {
      throw new Error('getKeyTime: Mode must be one of "before" or "after".');
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
    if (typeof time !== 'number' || isNaN(time)) {
      throw new Error('getKeyFrame: Time must be a non-NaN number!');
    }
    var index = this._getKeyFrameIndex(time);
    return index >= 0 ? this.anchors[index] : null;
  };

  PropManager.prototype.createKeyFrame = function (start, end) {
    if (typeof start !== 'number' || typeof end !== 'number') {
      throw new Error('createKeyFrame: Start and end must both be numbers!');
    }
    if (isNaN(start) || isNaN(end)) {
      throw new Error('createKeyFrame: Start or end cannot be NaN!');
    }
    if (end <= start) {
      throw new Error('createKeyFrame: end must greater than start');
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

  PropManager.prototype.resizeKeyFrame = function (time, start, end) {
    if (typeof time !== 'number' || isNaN(time)) {
      throw new Error('resizeKeyFrame: Time must be a non-NaN number.');
    }
    var index = this._getKeyFrameIndex(time);
    if (index < 0) {
      throw new Error('resizeKeyFrame: No frames at time ' + time);
    }
    var frame = this.anchors[index];
    frame.start = start;
    frame.end = end;
    this.anchors.sort(function (a, b) {
      return a.end > b.end ? 1 : (a.end < b.end ? -1 : 0);
    });
  };

  PropManager.prototype.splitKeyFrame = function (time) {
    if (typeof time !== 'number' || isNaN(time)) {
      throw new Error('splitKeyFrame: Time must be a non-NaN number.');
    }
    // Figure out the KeyFrame's location
    var index = this._getKeyFrameIndex(time);
    if (index < 0) {
      // No keyframe, so we just create a new one
      this.createKeyFrame(0, time);
      return;
    }
    var frame = this.anchors[index];
    if (frame.end === time) {
      // Should not be splitting a 0-len frame
      throw new Error('splitKeyFrame: Time = end for KeyFrame.');
    } else if (frame.end < time) {
      // In a blank, just create the frame.
      this.createKeyFrame(frame.end, time);
      return;
    }
    // Move the start time of the existing frame
    var oldStart = frame.start;
    frame.start = time;
    this.createKeyFrame(oldStart, time);
  };

  PropManager.prototype.removeKeyFrame = function (time, consumeBlank) {
    // Find the key frame
    if (typeof time !== 'number' || isNaN(time)) {
      throw new Error('removeKeyFrame: Time must be a non NaN number!');
    }
    for (var i = 0; i < this.anchors.length; i++) {
      if (this.anchors[i].start < time && this.anchors[i].end >= time) {
        if (i === this.anchors.length - 1) {
          // Last frame can be removed directly
          this.anchors.splice(i, 1);
        } else {
          if (consumeBlank) {
            this.anchors[i+1].start = this.anchors[i].start;
          }
          this.anchors.splice(i, 1);
        }
      }
    }
  };

  PropManager.prototype._serializeProp = function (prop) {
    if (typeof prop.serialize === 'function') {
      return prop.serialize();
    }
    return prop;
  };

  PropManager.prototype.serializeBase = function (src) {
    var baseObj = (typeof src === 'object' && src !== null) ? src : {};
    for (var keyName in this._baseSpec) {
      _setNested(baseObj, keyName.split('.'),
        this._serializeProp(this._baseSpec[keyName]));
    }
    return baseObj;
  };

  PropManager.prototype.serialize = function () {
    // Serialize the animations involved
    var keyframes = [];
    var frames = [];
    var lastFrameTime = 0;
    var lastFrameProperties = {};
    // Copy base
    for (var keyName in this._baseSpec) {
      lastFrameProperties[keyName] =
        this._serializeProp(this._baseSpec[keyName]);
    }
    // Iteratively copy
    this.anchors.forEach((function (anchor) {
      if (anchor.start !== lastFrameTime) {
        // We have a blank, we need to insert a reset. Should be very rare.
        keyframes.push(anchor.start);
        frames.push({});
      }
      lastFrameTime = anchor.end;
      lastFrameProperties = {};
      for (var keyName in anchor.spec) {
        lastFrameProperties[keyName] =
          this._serializeProp(anchor.spec[keyName]);
      }
      keyframes.push(anchor.end);
      frames.push(lastFrameProperties);
    }).bind(this));
    return {
      'keys': keyframes,
      'frames': frames
    };
  };

  return PropManager;
})();
