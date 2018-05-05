(function () {
  if (!Repr || !Pettan) {
    alert('Error: Some libraries were not loaded!');
    return;
  }

  /** Environment Variables **/
  var RESET_COMPONENTS = ['reset.editor'];
  var RENDER_COMPONENTS = ['render.editor'];
  var P = new Pettan();

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
      return message;
    });

    // Create and bind to Editor
    var editor = new Editor($('work-area'), $('canvas'));
    editor.bind(P);

    // Create and bind to Playback controls
    var playback = new Playback({
        'playBtn': $('playback-play-pause'),
        'stopBtn': $('playback-stop'),
        'recBtn': $('playback-rec')
      }, {
        'ruler': $('ruler'),
        'slider': $('slider'),
        'sliderValue': $('slider-value')
      });
    playback.bind(P);

    // Create and bind to the Assets Library
    var assetsLibrary = new AssetsLibrary($('library-import'),
      $('library-inner'));
    assetsLibrary.bind(P);

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
            'width': playback.offsetTimeToPixels(playback.getDuration()) + 'px'
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
    P.listen('objects.change', function (change) {
      if (change.action === 'add') {
        return P.emit('objects.select', change.name).then(
          Promise.resolve(change));
      } else if (change.action === 'remove') {
        // Remove object
        $('canvas').removeChild(ReprTools.getObject(change.name));
        // Drop all the listeners
        P.drop('track.' + change.name + '.click');
        // Clear records in Repr
        ReprTools.removeObject(change.name);
        // Remove from selection if selected
        return P.emit('objects.select',
          ReprTools.multiSelect(change.name, 'remove'));
      } else if (change.action === 'rename') {
        ReprTools.renameObject(change.oldName, change.newName);
        // Rebind all the listeners
        return P.rename('track.' + change.oldName + '.click',
          'track.' + change.newName + '.click').then(Promise.resolve(change));
      } else if (change.action === 'update'){
        // Update some value
      }
      return change;
    });
    P.listen('objects.select', function (objectNames) {
      ReprTools.setSelected(objectNames);
      return objectNames;
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
