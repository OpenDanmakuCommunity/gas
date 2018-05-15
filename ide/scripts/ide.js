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
    var editor = new Editor($('work-area'), $('canvas'), {
      'bgBlack': $('editor-bg-black'),
      'bgWhite': $('editor-bg-white'),
      'bgCheckered': $('editor-bg-checkered'),
      'configPreview': $('editor-config-preview'),
      'width': $('editor-config-width'),
      'height': $('editor-config-height'),
    });
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

    // Create and bind to the timeline controls
    var timeline = new TimelineManager($('tracks'), playback);
    timeline.bind(P);

    // Create and bind to the Assets Library
    var assetsLibrary = new AssetsLibrary($('library-import'),
      $('library-inner'));
    assetsLibrary.bind(P);

    // Create and bind to the properties panel
    var propertiesManager = new PropertyManager($('properties-inner'));
    propertiesManager.bind(P);

    // Bind global keydown listener
    P.bind(document.body, 'keydown', 'global.keydown');

    // Bind the listener for global render and reset
    P.listen('reset', function () {
      return Promise.all(RESET_COMPONENTS);
    });
    P.listen('render', function () {
      return Promise.all(RENDER_COMPONENTS);
    });

    // Render the UI
    P.emit('render').then(function () {
      trace('Generic Animation Comment IDE -- Initialization Complete');
    }).catch(function (e) {
      trace(e);
    });
    window.pet = P;
  });
})();
