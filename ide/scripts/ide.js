(function () {
  if (!Repr || !Pettan || !_Create || !_CreateP || !ReprTools) {
    alert('Error: Some libraries were not loaded! Cannot proceed.');
    return;
  }

  /** Environment Variables **/
  var PANELS = ['toolbox', 'ordering', 'playback', 'export', 'import',
    'library', 'animation', 'properties', 'layers'];
  var RESET_COMPONENTS = ['reset.editor'];
  var RENDER_COMPONENTS = ['render.editor'];
  var P = new Pettan();
  var T = new Timer();

  /** Initialize Reactive Environment **/
  window.addEventListener('load', function () {
    // Bind all the miniwindows
    PANELS.forEach(function (name) {
      var mWin = new MiniWindow($(name));
      mWin.bind(P);
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
        'recBtn': $('playback-rec')
      }, {
        'ruler': $('ruler'),
        'slider': $('slider'),
        'sliderValue': $('slider-value')
      });
    playback.bind(P);

    var saveLoad = new SaveLoad({
      'gas': $('io-export-gas'),
      'mode7': $('io-export-mode7'),
      'bas': $('io-export-bas'),
      'htmlcss': $('io-export-htmlcss')
    }, {
      'gas': $('io-import-gas'),
    });
    saveLoad.bind(P);

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
