var TimelineManager = (function () {
  var TimelineManager = function (timeline, playback) {
    if (!ReprTools || !Repr || !_Create || !Selection) {
      throw new Error('Environment not loaded correctly!');
    }
    this._timeline = timeline;
    this._playback = playback;

    this.trackBuffer = 100;
    this._tracks = {};
    this._selectedPins = [];
  };

  TimelineManager.prototype._createBinding = function (name, trackSpec) {
    if (name in this._tracks) {
      throw new Error('Track with name ' + name + ' already exists.');
    }
    this._tracks[name] = trackSpec;
  };

  TimelineManager.prototype._renameBinding = function (oldName, newName) {
    if (newName in this._tracks) {
      throw new Error('Naming conflict renaming ' + oldName + ' to ' + newName);
    }
    this._tracks[newName] = this._tracks[oldName];
    this._tracks[newName].name = newName;
    delete this._tracks[oldName];
  };

  TimelineManager.prototype._removeBinding = function (name) {
    delete this._tracks[name];
  };

  TimelineManager.prototype._onSelect = function (oldSelection, newSelection) {
    oldSelection.forEach((function (item) {
      if (item in this._tracks) {
        _ToggleClass(this._tracks[item].row, 'selected', false);
      }
    }).bind(this));
    newSelection.forEach((function (item) {
      _ToggleClass(this._tracks[item].row, 'selected', true);
    }).bind(this));
    if (newSelection.length > 0){
      try {
        this._tracks[newSelection[newSelection.length - 1]].scrollIntoView();
      } catch (e) {}
    }
  };

  /** Pin Related **/
  TimelineManager.prototype._createPinDom = function (
    name, start, end, isAnimated) {

    return _Create('div', {
        'className': 'pin' + (!isAnimated ? ' static' : ''),
        'style': {
          'left': this._playback.timeToPixels(start) + 'px',
          'width': this._playback.timeToPixels(end - start) + 'px'
        }
      }, [
        _Create('div', {
          'className': 'tail'
        }),
        _Create('div', {
          'className': 'mark'
        })
      ]);
  };
  TimelineManager.prototype._editPin = function (P, name, pin, start, end,
    isAnimated) {

    // Update isAnimated status
    if (isAnimated === true || isAnimated === false) {
      pin.dom.style.className = 'pin' + (!isAnimated ? ' static' : '');
    }

    if (start !== pin.start || end !== pin.end) {
      // Resizing the pin
      var oldName = pin.name;
      var oldTime = pin.end;
      pin.start = start;
      pin.end = end;
      pin.name = 'pin-' + pin.start + '-' + pin.end;
      P.rename('track.' + name + '.pin.' + oldName + '.click',
        'track.' + name + '.pin.' + pin.name + '.click');
      pin.dom.style.left = this._playback.timeToPixels(pin.start) + 'px';
      pin.dom.style.width = this._playback.timeToPixels(
        pin.end - pin.start) + 'px';
      return P.emit('timeline.pins.resized', {
        'objectName': name,
        'time': oldTime,
        'start': pin.start,
        'end': pin.end
      });
    } else {
      return Promise.resolve();
    }
  };
  TimelineManager.prototype._insertPin = function (P, name, start,
    end, isAnimated) {

    if (!(name in this._tracks)) {
      throw new Error('Could not find track ' + name);
    }
    if (end <= start) {
      throw new Error('End time must be after start time');
    }
    // Check if the pin can actually be inserted
    if (!this._canPin(name, start, end)) {
      throw new Error('Cannot pin ' + start + '->' + end +
        ': Overlaps existing pin.');
    }

    var pin = {
      'dom': this._createPinDom(name, start, end, isAnimated),
      'start': start,
      'end': end,
      'name': 'pin-' + start + '-' + end,
    };
    this._tracks[name].pins.push(pin);
    // Maintain the pins sorted by end time
    this._tracks[name].pins.sort(function (a, b) {
      if (a.end !== b.end) {
        return a.end > b.end ? 1 : -1;
      } else if (a.start !== b.start) {
        return a.start > b.start ? 1 : -1;
      } else {
        return 0;
      }
    });
    // Figure out where to insert this DOM
    var index = this._tracks[name].pins.indexOf(pin);
    if (index < this._tracks[name].pins.length - 1) {
      var nextPin = this._tracks[name].pins[index + 1];
      this._tracks[name].track.insertBefore(pin.dom, nextPin.dom);
    } else {
      this._tracks[name].track.appendChild(pin.dom);
    }
    // Bind the events
    P.bind(pin.dom, 'mousedown', 'track.' + name + '.pin.' + pin.name +
      '.click');
    P.listen('track.' + name + '.pin.' + pin.name + '.click', (function (e) {
      var idx = {
        'pin': pin.name,
        'end': pin.end,
        'track': name
      };
      var selected = null;
      var currentPinSelected = this._selectedPins.some(function (item) {
        return item.pin === idx.pin && item.track === idx.track;
      });
      if (e.event.ctrlKey) {
        selected = this._selectedPins.slice(0).filter(function (pin){
          return pin.pin !== idx.pin || pin.track !== idx.track;
        });
        if (!currentPinSelected) {
          selected.push(idx);
        }
      } else {
        selected = (currentPinSelected && this._selectedPins.length === 1) ?
          [] : [idx];
      }
      // Also unset the selection of Objects
      return P.emit('timeline.pins.select', selected).then(P.next(e));
    }).bind(this));
    // Emit a post-pin event
    return P.emit('timeline.pins.added', {
      'objectName': name,
      'start': start,
      'end': end
    });
  };

  TimelineManager.prototype._findPinIndex = function (name, end) {
    if (!(name in this._tracks)) {
      throw new Error('_findPinIndex: ' + name + ' has no track!');
    }
    for (var i = 0; i < this._tracks[name].pins.length; i++) {
      var pin = this._tracks[name].pins[i];
      if (pin.end < end) {
        continue;
      }
      if (pin.start < end) {
        return i;
      } else {
        return i - 1;
      }
    }
    return this._tracks[name].pins.length - 1;
  };

  TimelineManager.prototype._removePin = function (P, name, end) {
    // Find the pin in the UI, must be exact
    var pin = null, index = null;
    for (var i = 0; i < this._tracks[name].pins.length; i++) {
      pin = this._tracks[name].pins[i];
      if (pin.end === end) {
        index = i;
        break;
      } else if (pin.end < end) {
        // Past search
        pin = null;
        index = null;
        break;
      }
    }
    if (index === null || pin === null) {
      throw new Error('_removePin: Could not find anchor @' + name);
    }
    // Find the pin in the object's own timeline
    var object = ReprTools.getObject(name);
    object._pm.removeKeyFrame(end, true);
    // Remove pin from DOM
    if (index === this._tracks[name].pins.length - 1) {
      // Removing last pin
      this._tracks[name].track.removeChild(pin.dom);
    } else {
      // Get the next pin
      var nextPin = this._tracks[name].pins[i + 1];
      this._editPin(P, name, nextPin, pin.start, nextPin.end);
      // Remove this pin
      this._tracks[name].track.removeChild(pin.dom);
    }
    // Debind
    P.drop('track.' + name + '.pin.' + pin.name + '.click');
    // Remove pin from list
    this._tracks[name].pins.splice(index, 1);
    return P.emit('timeline.pins.removed', {
      'objectName': name,
      'end': end
    });
  };

  TimelineManager.prototype._splitPin = function (P, name, end, isAnimated) {
    // Find the pin involved
    var index = this._findPinIndex(name, end);
    if (index < 0) {
      // No existing pin, we can just add but only if non-zero time
      if (end === 0) {
        return Promise.resolve();
      }
      return this._insertPin(P, name, 0, end, isAnimated);
    } else {
      var pin = this._tracks[name].pins[index];
      if (pin.end === end) {
        // No need to do anything
        return this._editPin(P, name, pin, pin.start, pin.end, isAnimated);
      } else if (pin.end < end) {
        // Just create a new pin
        return this._insertPin(P, name, pin.end, end, isAnimated);
      } else {
        // Need to break old pin
        var oldStart = pin.start;
        console.log(JSON.stringify(this._tracks[name].pins));
        return this._editPin(P, name, pin, end, pin.end).then((function () {
          console.log(JSON.stringify(this._tracks[name].pins));
          return this._insertPin(P, name, oldStart, end, isAnimated);
        }).bind(this));
      }
    }
  };

  TimelineManager.prototype._canPin = function (name, start, end) {
    var pins = this._tracks[name].pins;
    if (pins.length === 0) {
      return true;
    } else {
      for (var i = 0; i < pins.length; i++) {
        if (pins[i].end <= start) {
          continue;
        }
        // This is the first pin after last fitting one
        if (pins[i].start >= end) {
          return true;
        } else {
          console.log([pins[i].start, pins[i].end]);
          return false;
        }
      }
      // No pin after this pin
      return true;
    }
  };

  TimelineManager.prototype._lastPin = function (name, time) {
    for (var i = 0; i < this._tracks[name].pins.length; i++) {
      if (this._tracks[name].pins[i].end <= time) {
        continue;
      } else {
        // First one that's larger
        return i > 0 ? this._tracks[name].pins[i - 1] : null;
      }
    }
    // No pins after
    return this._tracks[name].pins.length > 0 ?
      this._tracks[name].pins[this._tracks[name].pins.length - 1] : null;
  };

  TimelineManager.prototype._setSelectedPins = function (pins) {
    this._selectedPins.forEach((function (idx) {
      this._tracks[idx.track].pins.forEach(function (pin) {
        if (pin.name === idx.pin) {
          _ToggleClass(pin.dom, 'active', false);
        }
      })
    }).bind(this));

    pins.forEach((function (idx) {
      this._tracks[idx.track].pins.forEach(function (pin) {
        if (pin.name === idx.pin) {
          _ToggleClass(pin.dom, 'active', true);
        }
      })
    }).bind(this));
    this._selectedPins = pins;
  };

  /** Track Related **/
  TimelineManager.prototype._createTrack = function (P, name, spec) {
    var label = _Create('div',{
        'className': 'row-label',
        'tabindex': 3,
      }, [_CreateP(name)]);
    var track = _Create('div',{
        'className': 'track',
      });
    var objRow = _Create('div', {
        'className': 'row',
        'ide-object-name': name,
        'style': {
          'width': (this._playback.offsetTimeToPixels(
            this._playback.getDuration()) + this.trackBuffer) + 'px'
        }
      }, [
        label,
        track
    ]);

    // Bind actions
    P.bind(label, 'mousedown', 'track.' + name + '.click');
    P.bind(label, 'dblclick', 'track.' + name + '.dblclick');

    var binding = {
      'name': name,
      'row': objRow,
      'label': label,
      'labelText': label.firstChild,
      'track': track,
      'pins': []
    };

    this._timeline.insertBefore(objRow, this._timeline.firstChild);
    this._createBinding(name, binding);

    // Bind handlers
    P.listen('track.' + name + '.click', function (e) {
      if (e.event.ctrlKey) {
        return P.emit('objects.select',
          Selection.multiSelect(binding.name, 'toggle')).then(
            P.next(e));
      } else {
        return P.emit('objects.select', binding.name).then(
          P.next(e));
      }
    });
    P.listen('track.' + name + '.dblclick', function (e) {
      var name = prompt('Please input new name', binding.name);
      if (typeof name === 'string' && name !== null && name.length > 1
        && name != binding.name) {

        console.log('Initiating rename ' + binding.name + ' to ' + name);
        return P.emit('objects.rename', {
          'oldName': binding.name,
          'newName': name
        }).catch(function (err) {
          alert(err);
        }).then(P.next(e));
      }
    });
  };

  TimelineManager.prototype._renameTrack = function (P, oldName, newName) {
    if (newName in this._tracks) {
      throw new Error('Naming conflict. ' + newName + ' already exists!');
    }
    // Rename track events
    P.rename('track.' + oldName + '.click', 'track.' + newName + '.click');
    P.rename('track.' + oldName + '.dblclick',
      'track.' + newName + '.dblclick');

    // Rename track's pin events
    for (var i = 0; i < this._tracks[oldName].pins.length; i++) {
      var pinName = this._tracks[oldName].pins[i].name;
      P.rename('track.' + oldName + '.pin.' + pinName,
        'track.' + newName + '.pin.' + pinName);
    }

    // Rename the selected pins
    this._selectedPins.forEach(function (pin) {
      if (pin.track === oldName) {
        pin.track = newName;
      }
    });

    // Rename the track binding
    this._renameBinding(oldName, newName);
    // Get the binding
    this._tracks[newName].labelText.innerText = newName;
    this._tracks[newName].row.setAttribute('ide-object-name', newName);
  };

  TimelineManager.prototype._removeTrack = function (P, name) {
    // Drop Listeners
    P.drop('track.' + name + '.click');
    P.drop('track.' + name + '.dblclick');
    this._timeline.removeChild(this._tracks[name].row);

    this._removeBinding(name);
  };

  TimelineManager.prototype._rescaleTracks = function (duration) {
    for (var track in this._tracks) {
      this._tracks[track].row.style.width = (this._playback.offsetTimeToPixels(
        this._playback.getDuration()) + this.trackBuffer) + 'px';
    }
  };

  /** Binding related **/
  TimelineManager.prototype._bindMove = function (P) {
    // Bind provision of frame
    P.listen('object.provisionFrame', (function (spec) {
      console.log('Provisioning time ' + spec.time + ' ' + spec.propertyName);
      return this._splitPin(P, spec.objectName, spec.time).then(P.next(spec));
    }).bind(this));
  };

  TimelineManager.prototype._bindPin = function (P) {
    // Add pin action
    P.listen('timeline.rec', (function (timeObj) {
      var promises = Selection.get().map((function (objectName) {
        var lastPin = this._lastPin(objectName, timeObj.time);
        var newPin = {
          'objectName': objectName,
          'start': (lastPin === null ? 0 : lastPin.end),
          'end': timeObj.time,
          'animated': false
        };
        return P.emit('timeline.pins.add', newPin);
      }).bind(this));
      return Promise.all(promises).then(P.next(timeObj));
    }).bind(this));

    P.listen('timeline.selectPin', (function (spec) {
      // Find the object
      if (!spec.objectName in this._tracks) {
        throw new Error(spec.objectName + ' not in timeline.');
      }
      var pins = this._tracks[spec.objectName].pins;
      for (var i = 0; i < pins.length; i++) {
        if (pins[i].start < spec.time && pins[i].end >= spec.time) {
          return P.emit('timeline.pins.select', [{
            'pin': pins[i].name,
            'end': pins[i].end,
            'track': spec.objectName
          }]).then(P.next(spec));
        }
      }
      return spec;
    }).bind(this));

    P.listen('timeline.pins.add', (function (pin) {
      this._insertPin(P, pin.objectName, pin.start, pin.end, pin.animated);
      return pin;
    }).bind(this));

    P.listen('timeline.pins.select', (function (selection) {
      this._setSelectedPins(selection);
      P.emit('timeline.pins.selected', selection);
      return selection;
    }).bind(this));

    P.listen('timeline.pins.notify.selected', (function () {
      P.emit('timeline.pins.selected', this._selectedPins);
    }).bind(this));
  };

  TimelineManager.prototype.bind = function (P) {
    // Bind object creation
    P.listen('tracks.add', (function (data) {
      this._createTrack(P, data.name, data.spec);
      return data;
    }).bind(this));

    // Bind object selection
    P.listen('selection.change', (function (changes) {
      this._onSelect(changes.from, changes.to);
      return changes;
    }).bind(this));
    // Bind object renaming
    P.listen('objects.rename', (function (nameSpec) {
      this._renameTrack(P, nameSpec.oldName, nameSpec.newName);
      return nameSpec;
    }).bind(this));
    // Bind object removal
    P.listen('objects.remove', (function (objName) {
      this._removeTrack(P, objName);
      return objName;
    }).bind(this));

    // Bind pin controls
    this._bindPin(P);
    this._bindMove(P);

    // Bind rescaling of the timeline
    P.listen('timeline.duration.set', (function (newDuration) {
      this._rescaleTracks();
      return newDuration;
    }).bind(this));
    P.listen('timeline.scale.set', (function (scale) {
      this._rescaleTracks();
      return scale;
    }).bind(this));
  };

  return TimelineManager;
})();
