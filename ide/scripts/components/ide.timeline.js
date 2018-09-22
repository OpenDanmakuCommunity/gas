var TimelineManager = (function () {
  var TimelineManager = function (timeline, playback) {
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
  TimelineManager.prototype._insertPin = function (P, name, start, end, isAnimated) {
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
    var pinDom = _Create('div', {
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
      ])
    var pin = {
      'dom': pinDom,
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
    this._tracks[name].track.appendChild(pinDom);
    // Bind the events
    P.bind(pinDom, 'mousedown', 'track.' + name + '.pin.' + pin.name + '.click');
    P.listen('track.' + name + '.pin.' + pin.name + '.click', (function (e) {
      var idx = {
        'pin': pin.name,
        'end': pin.end,
        'track': name
      };
      var selection = null;
      var currentPinSelected = this._selectedPins.some(function (item) {
        return item.pin === idx.pin && item.track === idx.track;
      });
      if (e.event.ctrlKey) {
        selection = this._selectedPins.slice(0).filter(function (pin){
          return pin.pin !== idx.pin || pin.track !== idx.track;
        });
        if (!currentPinSelected) {
          selection.push(idx);
        }
      } else {
        selection = (currentPinSelected && this._selectedPins.length === 1) ?
          [] : [idx];
      }
      // Also unset the selection of Objects
      return P.emit('timeline.pins.select', selection).then(P.next(e));
    }).bind(this));
  };

  TimelineManager.prototype._removePin = function () {

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
    console.log('Created track for ' + name);
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
