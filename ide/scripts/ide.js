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

  function bindToolButtons (tools) {
    for (var i = 0; i < tools.length; i++) {
      var toolName = tools[i];
      var id = 'tool.' + toolName + '.click';
      P.bind($('tool-' + toolName), 'click', id);
      P.listen(id, (function (toolName) {
        return function () {
          return P.emit('tool.changed', {
            'from': Repr.uiState.selectedTool,
            'to': toolName
          }).then(function () {
            Repr.uiState.selectedTool = toolName;
            trace('Change to tool ' + toolName);
          });
        }
      })(toolName));
    }
    // Add binding for changing class
    P.listen('tool.changed', function (tool) {
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

  function queueRender (action, value) {
    renderQueue.push({
      'action': action,
      'value': value
    });
  }

  /** Initialize Reactive Environment **/
  window.addEventListener('load', function () {
    // Bind logging actions
    P.listen('trace', function (message) {
      var hist = _Create('p', {}, [_Create('text', message)]);
      
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
    })
    // Bind to the tooltip buttons
    bindToolButtons(['select', 'text', 'sprite', 'button', 'frame'])
    queueRender('tool.changed', function () { 
      return {'from': Repr.uiState.selectedTool, 
        'to': Repr.uiState.selectedTool};
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
    });
  });
})();