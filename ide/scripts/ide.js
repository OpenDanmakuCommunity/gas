(function () {
  if (!Repr || !Pettan) {
    alert('Error: Some libraries were not loaded!');
    return;
  }

  /** Environment Variables **/
  var RESET_COMPONENTS = ['reset.editor'];
  var RENDER_COMPONENTS = ['render.editor'];
  var P = new Pettan();
  var T = new Timer();

  /** Helpers **/
  function trace(message) {
    return P.emit('trace', message);
  }

  /** Initialize Reactive Environment **/
  window.addEventListener('load', function () {
    // Bind logging actions
    P.listen('trace', function (message) {
      var hist = _CreateP(message, {
        'draggable': 'false'
      });

      hist.addEventListener('dblclick', (function (srepr) {
        return function () {
          if(confirm('Are you sure you want to rewind to this point in history?\n' +
            'This feature is experimental and may break!')) {

            trace('Rewind history: Experimental');
            Repr = JSON.parse(srepr);
            P.emit('reset').then(function () {
              return P.emit('render');
            });
          }
        };
      })(JSON.stringify(Repr)));

      $('messages').insertBefore(hist, $('messages').firstChild);
      // Remove extra
      while ($('messages').childElementCount > Repr.uiState.config.historyMax) {
        $('messages').removeChild($('messages').lastChild);
      };
      return Promise.resolve(message);
    });

    // Create and bind to the Editor
    var editor = new Editor($('work-area'), $('canvas'));
    editor.bind(P);

    // Bind to playback buttons
    P.bind($('playback-play-pause'), 'click', 'playback.toggle');
    P.listen('playback.toggle', function (e) {
      if (T.isRunning) {
        return P.emit('timer.stop').then(Promise.resolve(e));
      } else {
        return P.emit('timer.start').then(Promise.resolve(e));
      }
      return e;
    });
    P.bind($('playback-stop'), 'click', 'playback.stop');
    P.listen('playback.stop', function (e) {
      return P.emit('timer.stop').then(P.emit('timer.seek', 0));
    })
    
    // Bind to ruler position
    P.bind($('ruler'), 'mousedown', 'playback.seek');
    P.bind($('ruler'), 'mousemove', 'playback.scrub');
    P.listen('playback.seek', function (e) {
      if (e.event.button !== 0) {
        return e;
      }
      return P.emit('timer.seek', ReprTools.pixelsToTime(e.event.offsetX));
    });
    P.listen('playback.scrub', function (e) {
      if (e.event.buttons !== 1) {
        return e;
      }
      return P.emit('timer.seek', ReprTools.pixelsToTime(e.event.offsetX));
    });

    // Bind to the object creation
    P.listen('objects.add', function (spec) {
      // Create the objects
      var objInst = GFactory.createFromSpec(spec);
      ReprTools.addObject(spec.name, objInst);

      $('canvas').appendChild(objInst.DOM);
      var label = _Create('div',{
          'className': 'row-label',
          'tabindex': 3,
        }, [_CreateP(objInst.name)]);
      var track = _Create('div',{
          'className': 'track',
        });
      var objRow = _Create('div', {
          'className': 'row',
          'ide-object-name': objInst.name,
          'style': {
            'width': (200 + ReprTools.timeToPixels(ReprTools.duration())) + 'px'
          }
        }, [
          label,
          track
      ]);
      $('tracks').insertBefore(objRow, $('tracks').firstChild);

      ReprTools.bindTrack(objInst.name, {
        'row': objRow,
        'label': label,
        'labelText': label.firstChild,
        'track': track,
      });
      P.bind(label, 'mousedown', 'track.' + objInst.name + '.click');
      P.listen('track.' + objInst.name + '.click', function (e) {
        if (e.event.ctrlKey) {
          return P.emit('objects.select', 
            ReprTools.multiSelect(objInst.name, 'toggle')).then(
              Promise.resolve(e));
        } else {
          return P.emit('objects.select', objInst.name).then(
            Promise.resolve(e));
        }
      });

      trace('Created [' + objInst.type + '] object "' + objInst.name + '"');

      P.emit('objects.change', {
        'name': objInst.name,
        'action': 'add'
      });
      return spec;
    });
    P.listen('objects.remove', function (name) {
      return name;
    }); 
    P.listen('objects.change', function (change) {
      if (change.action === 'add') {
        P.emit('objects.select', change.name);
      } else if (change.action === 'remove') {
        
      } else if (change.action === 'rename') {
        ReprTools.renameObject(change.oldName, change.newName);
        // Rebind all the listeners
        P.rename('track.' + change.oldName + '.click',
          'track.' + change.newName + '.click');
      } else if (change.action === 'update'){
        
      }
      return change;
    });
    P.listen('objects.select', function (objectNames) {
      ReprTools.setSelected(objectNames);
      return objectNames;
    });

    // Deal with the slider
    P.listen('slider.update', function (time) {
      $('slider').style.left = (200 + ReprTools.timeToPixels(time)) + 'px';
      $('slider-value').innerText = (time / 1000).toFixed(3);
      return time;
    });

    // Bind the timer event
    P.listen('timer.start', function () {
      T.start();
    });
    P.listen('timer.stop', function () {
      T.stop();
    });
    P.listen('timer.seek', function (time) {
      T.set(time);
      return P.emit('timer.time', time);
    });
    P.listen('timer.time', function (time) {
      var updates = [];
      updates.push(P.emit('slider.update', time));
      if (time > ReprTools.duration()) {
        updates.push(P.emit('timer.stop').then(P.emit('timer.seek', ReprTools.duration())));
      }
      return Promise.all(updates);
    });
    T.broadcast(10, function (time) {
      P.emit('timer.time', time);
    });
    
    // Bind the listener for global render and reset
    P.listen('reset', function () {
      return Promise.all(RESET_COMPONENTS);
    });
    P.listen('render', function () {
      return Promise.all(RENDER_COMPONENTS);
    });

    P.emit('render').then(function () {
      trace('Generic Animation Comment IDE -- Initialization Complete');
    }).catch(function (e) {
      trace(e);
    });

    window.pet = P;
  });
})();