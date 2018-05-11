var TimelineManager = (function () {
  var TimelineManager = function (timeline, playback) {
    this._timeline = timeline;
    this._playback = playback;

    this._tracks = {};
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
      _ToggleClass(this._tracks[item].row, 'selected', false);
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

  TimelineManager.prototype._createTrack = function (P, spec) {
    console.log('Created track for ' + spec.name);
    var label = _Create('div',{
        'className': 'row-label',
        'tabindex': 3,
      }, [_CreateP(spec.name)]);
    var track = _Create('div',{
        'className': 'track',
      });
    var objRow = _Create('div', {
        'className': 'row',
        'ide-object-name': spec.name,
        'style': {
          'width': this._playback.offsetTimeToPixels(
            this._playback.getDuration()) + 'px'
        }
      }, [
        label,
        track
    ]);

    // Bind actions
    P.bind(label, 'mousedown', 'track.' + spec.name + '.click');
    P.bind(label, 'dblclick', 'track.' + spec.name + '.dblclick');

    var binding = {
      'name': spec.name,
      'row': objRow,
      'label': label,
      'labelText': label.firstChild,
      'track': track,
      'pins': []
    };

    this._timeline.insertBefore(objRow, this._timeline.firstChild);
    this._createBinding(spec.name, binding);

    // Bind handlers
    P.listen('track.' + spec.name + '.click', function (e) {
      if (e.event.ctrlKey) {
        return P.emit('objects.select',
          Selection.multiSelect(binding.name, 'toggle')).then(
            Promise.resolve(e));
      } else {
        return P.emit('objects.select', binding.name).then(
          Promise.resolve(e));
      }
    });
    P.listen('track.' + spec.name + '.dblclick', function (e) {
      var name = prompt('Please input new name', binding.name);
      if (typeof name === 'string' && name !== null && name.length > 1 
        && name != binding.name) {

        console.log('Initiating rename ' + binding.name + ' to ' + name);
        return P.emit('objects.rename', {
          'oldName': binding.name,
          'newName': name
        }).catch(function (err) {
          console.log(err);
          alert(err);
        }).then(Promise.resolve(e));
      }
    });
  };

  TimelineManager.prototype._insertPin = function (name, start, end, isAnimated) {
    if (!(name in this._tracks)) {
      throw new Error('Could not find track ' + name);
    }
    if (end <= start) {
      throw new Error('End time must be after start time');
    }
    var pinDom = _Create('div', {
        'className': 'pin' + (!isAnimated ? ' static' : ''),
        'style': {
          'left': this._playback.timeToPixels(start) + 'px',
          'width': this._playback.timeToPixels(end - start) + 'px'
        }
      }, [
        _Create('div', {
          'className': 'mark'
        })
      ])
    var pin = {
      'dom': pinDom,
      'start': start,
      'end': end
    }
    this._tracks[name].pins.push(pin);
    this._tracks[name].track.appendChild(pinDom);
  };
  TimelineManager.prototype._removePin = function () {
    
  };
  TimelineManager.prototype._firstGap = function (name, time) {
    //
  };

  TimelineManager.prototype._renameTrack = function (P, oldName, newName) {
    if (newName in this._tracks) {
      throw new Error('Naming conflict. ' + newName + ' already exists!');
    }
    P.rename('track.' + oldName + '.click', 'track.' + newName + '.click');
    P.rename('track.' + oldName + '.dblclick', 'track.' + newName + '.dblclick');
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

  TimelineManager.prototype._bindPin = function (P) {
    P.listen('timeline.rec', (function (timeObj) {
      Selection.get().forEach((function (item) {
        this._insertPin(item, 0, timeObj.time, false);
      }).bind(this));
    }).bind(this));
  };

  TimelineManager.prototype.bind = function (P) {
    // Bind object creation
    P.listen('tracks.add', (function (spec) {
      this._createTrack(P, spec);
      return spec;
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
  };

  return TimelineManager;
})();