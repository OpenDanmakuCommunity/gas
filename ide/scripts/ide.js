(function () {
  if (!Repr || !Pettan) {
    alert('Error: Some libraries were not loaded!');
    return;
  }

  /** Environment Variables **/
  var renderQueue = [];
  var resettables = [];
  var P = new Pettan();
  var T = new Timer();

  /** Helpers **/
  function trace(message) {
    P.emit('trace', message);
  }
  function queueRender (action, value) {
    renderQueue.push({
      'action': action,
      'value': value
    });
  }
  
  /** Binding Helpers **/
  function bindToolButtons (tools) {
    for (var i = 0; i < tools.length; i++) {
      var toolName = tools[i];
      var id = 'tool.' + toolName + '.click';
      P.bind($('tool-' + toolName), 'click', id);
      P.listen(id, (function (toolName) {
        return function () {
          return P.emit('tool.change', {
            'from': Repr.uiState.selectedTool,
            'to': toolName
          }).then(function (e) {
            Repr.uiState.selectedTool = toolName;
            trace('Change to tool ' + toolName);
            return e;
          });
        }
      })(toolName));
    }
    // Add binding for changing class
    P.listen('tool.change', function (tool) {
      var toolFrom = $('tool-' + tool.from);
      var toolTo = $('tool-' + tool.to);
      _ToggleClass(toolFrom, 'selected', false);
      _ToggleClass(toolTo, 'selected', true);
      return Promise.resolve(tool);
    });
    P.listen('reset.tool', function () {
      for (var i = 0; i < tools.length; i++) {
        _ToggleClass($('tool-' + tools[i]), 'selected', false);
      }
      return Promise.resolve();
    });
    resettables.push('tool');
  }

  /** Initialize Reactive Environment **/
  window.addEventListener('load', function () {
    // Bind logging actions
    P.listen('trace', function (message) {
      var hist = _CreateP(message);

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

    // Bind to the tooltip buttons
    bindToolButtons(['select', 'text', 'sprite', 'button', 'frame']);
    queueRender('tool.change', function () { 
      return {'from': Repr.uiState.selectedTool, 
        'to': Repr.uiState.selectedTool};
    });
    
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

    // Bind to the work area 
    P.bind($('work-area'), 'mousedown', 'work-area.down');
    P.bind($('work-area'), 'mouseup', 'work-area.up');
    P.listen('work-area.down', function (e) {
      if (e.event.button !== 0) {
        return e;
      }
      if (Repr.uiState.selectedTool === 'select') {
        // Select items
        if (e.event.target !== $('canvas') &&
          e.event.target !== $('work-area')) {
          // Clicked on existing item
          var ideName = e.event.target.getAttribute('ide-object-name');
          if (e.event.ctrlKey) {
            var newSelection = ReprTools.multiSelect(ideName, 'toggle');
            return P.emit('objects.select', newSelection);
          } else {
            return P.emit('objects.select', ideName);
          }
        } else {
          if (!e.event.ctrlKey) {
            return P.emit('objects.select', []);
          }
        }
        return e;
      } else {
        // Create items
        if (e.event.target !== $('canvas') &&
          e.event.target !== $('work-area')) {
          // Clicked on existing item
          var objName = e.event.target.getAttribute('ide-object-name');
          console.log(objName);

          if (ReprTools.objectExists(objName)) {
            if (ReprTools.typeAsTool(ReprTools.getObjectType(objName), 
              Repr.uiState.selectedTool)) {
              return P.emit('objects.select', objName);
            }
          }
          return e;
        }
        var x = e.event.offsetX - 
          (e.event.target === $('canvas') ? 0 : $('canvas').offsetLeft);
        var y = e.event.offsetY - 
          (e.event.target === $('canvas') ? 0 : $('canvas').offsetTop);
        switch (Repr.uiState.selectedTool) {
          case 'text':
            P.emit('objects.add', {
              'type': 'Text',
              'name': ReprTools.getUniqueName('Text'),
              'position': {
                'x': x,
                'y': y,
              }
            }).catch(function (e) {
              alert(e);
            });
            return;
          case 'sprite':
          case 'button':
          case 'frame':
          default:
            return e;
        }
      }
      return e;
    });
    
    // Bind to the object creation
    P.listen('objects.add', function (spec) {
      // Create the objects
      var objInst = GFactory.createFromSpec(spec);
      ReprTools.addObject(spec.name, objInst);

      $('canvas').appendChild(objInst.DOM);
      var label = _Create('div',{
          'className': 'row-label',
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
      $('tracks').appendChild(objRow);

      ReprTools.bindTrack(objInst.name, {
        'row': objRow,
        'label': label,
        'labelText': label.firstChild,
        'track': track,
      });
      P.bind(label, 'click', 'track.' + objInst.name + '.click');

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

    // Bind some resets
    P.listen('reset', function () {
      var reset = [];
      for (var i = 0; i < resettables.length; i++) {
        reset.push(P.emit('reset.' + resettables[i]));
      }
      return Promise.all(reset);
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
    
    // After every binding is done, we emit a render event
    P.listen('render', function () {
      var actions = [];
      for (var i = 0; i < renderQueue.length; i++) {
        if (typeof renderQueue[i].value === 'function') {
          actions.push(P.emit(renderQueue[i].action, renderQueue[i].value()));
        } else {
          actions.push(P.emit(renderQueue[i].action, renderQueue[i].value));
        }
      }
      return Promise.all(actions);
    });

    P.emit('render').then(function () {
      return;//return P.emit('timer.start');
    }).then(function () {
      trace('Generic Animation Comment IDE -- Initialization Complete');
    }).catch(function (e) {
      console.log(e);
    });
    
    window.pt = P;
  });
})();