(function () {
  if (!Repr || !Pettan || !_Create || !_CreateP || !ReprTools) {
    alert('Error: Some libraries were not loaded! Cannot proceed.');
    return;
  }

  /** Environment Variables **/
  var PANELS = ['toolbox', 'ordering', 'playback', 'export', 'import',
    'library', 'animation', 'properties', 'macros', 'layers'];
  var RESET_COMPONENTS = ['reset.editor'];
  var RENDER_COMPONENTS = ['render.editor'];
  var P = new Pettan();
  var T = new Timer();

  /** Initialize Reactive Environment **/
  window.addEventListener('load', function () {
    // Bind all the miniwindows
    var panelManager = {};
    PANELS.forEach(function (name) {
      var mWin = new MiniWindow($(name));
      mWin.bind(P);
      panelManager[name] = mWin;
    });

    // Bind logging actions
    var logger = new Logger($('messages'));
    logger.bind(P);

    // Create and bind to Editor
    var editor = new Editor(T, $('work-area'), $('canvas'), {
      'bgBlack': $('editor-bg-black'),
      'bgWhite': $('editor-bg-white'),
      'bgCheckered': $('editor-bg-checkered'),
      'configPreview': $('editor-config-preview'),
      'width': $('editor-config-width'),
      'height': $('editor-config-height'),
    });
    editor.bind(P);

    // Create and bind to Playback controls
    var playback = new Playback(T, {
        'playBtn': $('playback-play-pause'),
        'stopBtn': $('playback-stop'),
        'recBtn': $('playback-rec'),
        'ffBtn': $('playback-ff-pin'),
        'rwBtn': $('playback-rw-pin'),
      }, {
        'ruler': $('ruler'),
        'slider': $('slider'),
        'sliderValue': $('slider-value')
      });
    playback.bind(P);

    var saveLoad = new SaveLoad({
      'gas': $('io-import-gas'),
    }, {
      'gas': $('io-export-gas'),
      'mode7': $('io-export-mode7'),
      'bas': $('io-export-bas'),
      'htmlcss': $('io-export-htmlcss')
    }, {
      'container': $('import-ui'),
      'prompt': $('import-ui-prompt'),
      'progress': $('import-ui-progress'),
      'progressBar': $('import-ui-progress-bar'),
      'progressLabel': $('import-ui-progress-label'),
      'btnCancel': $('import-ui-btn-cancel'),
      'btnImport': $('import-ui-btn-import'),
      'filePicker': $('import-ui-file'),
      'textArea': $('import-ui-textarea'),
    }, {
      
    });
    saveLoad.bind(P);

    // Create and bind to the timeline controls
    var timeline = new TimelineManager($('tracks'), playback);
    timeline.bind(P);

    // Create and bind to the Assets Library
    var assetsLibrary = new AssetsLibrary($('library-import'),
      $('library-inner'));
    assetsLibrary.bind(P);

    // Create and bind to the Animations Manager
    var animationManager = new AnimationManager(panelManager.animation,
      $('animation-inner'));
    animationManager.bind(P);

    // Create and bind to the properties panel
    var propertiesManager = new PropertyManager(
      panelManager.properties, $('properties-inner'));
    propertiesManager.bind(P);

    // Create and bind the layer panel
    var layerManager = new LayerManager($('layers-inner'), {
      'add': $('layers-add'),
      'orderUp': $('order-up'),
      'orderDown': $('order-down')
    });
    layerManager.bind(P);

    // Create and bind the macros panel
    var macroManager = new MacroManager($('macros-inner'));
    macroManager.bind(P);

    // Bind global keydown listener
    P.bind(document.body, 'keydown', 'body.keydown');
    P.listen('body.keydown', function (e) {
      var key = {
        'key': e.event.key,
        'ctrlKey': e.event.ctrlKey,
        'altKey': e.event.altKey,
        'shiftKey': e.event.shiftKey
      };
      if (document.activeElement !== null) {
        switch (document.activeElement.tagName.toUpperCase()) {
            case 'INPUT':
            case 'TEXTAREA':
            case 'BUTTON':
            case 'SELECT':
              key.input = true;
              break;
            default:
              key.input = false;
              e.event.preventDefault();
              break;
        }
      } else {
        key.input = false;
        e.event.preventDefault();
      }
      return P.emit('global.keydown', key).then(P.next(e));
    });

    // Bind the listener for global render and reset
    P.listen('reset', function () {
      return Promise.all(RESET_COMPONENTS.map(function (component) {
        return P.emit(component);
      }));
    });
    P.listen('render', function () {
      return Promise.all(RENDER_COMPONENTS.map(function (component) {
        return P.emit(component);
      }));
    });

    // Render the UI
    P.emit('render').then(function () {
      logger.log('Generic Animation Comment IDE -- Initialization Complete');
    }).catch(function (e) {
      logger.warn(e);
    });

    // Expose the pettan instance
    // TODO: Remove in production
    window.pet = P;
  });
})();
