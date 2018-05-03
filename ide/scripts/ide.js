(function () {
  if (!Repr || !Pettan) {
    alert('Error: Some libraries were not loaded!');
    return;
  }

  /** Environment Variables **/
  var renderQueue = [];
  var resettables = [];
  var P = new Pettan();

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
            var idx = Repr.uiState.selectedObjects.indexOf(ideName);
            var oldObjs = Repr.uiState.selectedObjects.slice(0);
            if (idx < 0) {
              oldObjs.push(ideName);
              return P.emit('objects.select', oldObjs);
            } else {
              oldObjs.splice(idx, 1);
              return P.emit('objects.select', oldObjs);
            }
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
              'name': 'Text-' + (Repr.uiState.lastIndex ++),
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
      if (!'name' in spec || typeof spec.name !== 'string') {
        return Promise.reject(new Error('Spec did not have a name.'));
      }
      if (name in Repr.workspace.objects) {
        return Promise.reject(new Error('Spec named object already exists'));
      }
      Repr.workspace.objects[spec.name] = GFactory.createFromSpec(spec);
      $('canvas').appendChild(Repr.workspace.objects[spec.name].DOM);
      trace('Created [' + spec.type + '] object "' + spec.name + '"');
      P.emit('objects.change', {
        'name': spec.name,
        'action': 'add'
      });
      return spec;
    });
    P.listen('objects.remove', function (name) {
      return name;
    }); 
    P.listen('objects.change', function (change) {
      if (change.action === 'add') {
        var objTrack = _Create('div', {
            'className': 'row',
          }, [
            _Create('div',{
                'className': 'row-label',
              }, [_CreateP(change.name)]),
            _Create('div',{
                'className': 'track',
              })
        ]);
        $('timeline').appendChild(objTrack);
        P.emit('objects.select', change.name);
      } else if (change.action === 'remove') {
        
      } else if (change.action === 'update'){
        
      }
      return change;
    });
    P.listen('objects.select', function (objsname) {
      var objects = Array.isArray(objsname) ? objsname : [objsname];
      objects = objects.filter(
        function (o) { return o in Repr.workspace.objects});

      for (var i = 0; i < Repr.uiState.selectedObjects.length; i++) { 
        var objname = Repr.uiState.selectedObjects[i];
        Repr.workspace.objects[objname].setFocus(false);
      }
      for (var j = 0; j < objects.length; j++){
        var objname = objects[j];
        Repr.workspace.objects[objname].setFocus(true);
      }
      Repr.uiState.selectedObjects = objects;
      return objsname;
    });

    // Bind some resets
    P.listen('reset', function () {
      var reset = [];
      for (var i = 0; i < resettables.length; i++) {
        reset.push(P.emit('reset.' + resettables[i]));
      }
      return Promise.all(reset);
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
      trace('Generic Animation Comment IDE -- Initialization Complete');
    }).catch(function (e) {
      console.log(e);
    });
    
    window.pt = P;
  });
})();