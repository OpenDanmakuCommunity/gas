(function () {
  const examplesDir = '../../docs/static/examples/sprites/';
  const demos = {
    'svgp-azureus': 'svgp-azureus-motions.json',
    'svgp-spinner': 'svgp-spinner.json',
    'svg-azureus': 'svg-azureus.json'
  };
  const REF_CTX = {
    'stroke': '#72DEC9',
    'stroke-width': 1,
    'fill': '#72DEC9'
  };
  const P = new Pettan();
  const T = new Timer();

  var duration = 2000, broadcast = null, currentSprite = null;

  function load(src, canvas, rlm, infoBox, tv) {
    if (broadcast !== null) {
      broadcast.pause(); // Stop broadcast so it can be gc'd
    }
    canvas.root().clear();
    if (typeof src === 'string') {
      var promise = fetch(src).then(function (resp) {
        return resp.json();
      }).then(function (svgp) {
        return new SVGP(svgp, [0, 0, 640, 480], true);
      })
    } else {
      var promise = Promise.resolve(new SVGP(src, [0, 0, 640, 480], true));
    }
    return promise.then(function (sprite) {
      sprite.draw(canvas, 0);

      tv.load(canvas.root());
      tv.hover(function (state, c) {
        var box = canvas.asInternalBox(c.item().getBoundingClientRect());
        box['name'] = c.name();
        rlm.drawBoxes('bounding-boxes', state === 'enter' ? [ box ] : []);
      });

      infoBox.innerText = sprite.toString();
      broadcast = T.broadcast(100, function (t) {
        sprite.update((t % duration) / duration);
      });
      currentSprite = sprite;
    });
  }

  window.addEventListener('load', function () {
    const canvas = new SvgCanvas($('canvas'), {}),
        underlay = new SvgCanvas($('underlay'), REF_CTX),
        overlay = new SvgCanvas($('overlay'), REF_CTX);
    const infoBox = $('info-box');

    // Load the various managers
    const rlm = new ReferenceLayerManager(overlay, underlay);
    const tv = new TreeView($('tree-view'));

    // Bind the toggle buttons
    const playToggle = new ToggleBtn($('toggle-play'), false),
      treeToggle = new ToggleBtn($('toggle-tree'), false);

    playToggle.listen(function (play) {
      if (play) {
        T.start();
      } else {
        T.stop();
      }
    });

    const btnOpen = $('tool-open'), btnImport = $('tool-import'),
      btnExport = $('tool-export');
    const fileOpen = $('file-json'), fileImport = $('file-svg');

    btnOpen.addEventListener('click', function (e) {
      fileOpen.click();
      e.target.blur();
    });
    btnImport.addEventListener('click', function (e) {
      fileImport.click();
      e.target.blur();
    });
    btnExport.addEventListener('click', function (e) {
      if (currentSprite === null) {
        alert('No sprite currently loaded.');
      } else {
        var blob = new Blob([currentSprite.toJSON()], {type: 'text/json'});
        var a = _Create('a', {
          'href': URL.createObjectURL(blob),
          'download': 'export-' + Date.now() + '.json'
        });
        a.click();
      }
      e.target.blur();
    });

    fileImport.addEventListener('change', function (e) {
      const fileList = this.files;
      if (fileList.length > 0) {
        const file = fileList[0];
        const reader = new FileReader();
        reader.onload = function (e) {
          var svgReader = new SVGReader(e.target.result);
          load(svgReader.import(), canvas, rlm, infoBox, tv);
        };
        reader.readAsText(file);
      }
    });

    fileOpen.addEventListener('change', function (e) {
      const fileList = this.files;
      if (fileList.length > 0) {
        const file = fileList[0];
        const reader = new FileReader();
        reader.onload = function (e) {
          load(JSON.parse(e.target.result), canvas, rlm, infoBox, tv);
        }
        reader.readAsText(file);
      }
    });

    // Default things
    load(examplesDir + demos['svgp-azureus'], canvas, rlm, infoBox, tv)
      .then(function (sprite) {
        treeToggle.listen(function (show) {
          $('tree-view-box').style.display = show ? '' : 'none';
        });
      });

    window.addEventListener('resize', function () {
      rlm.resize();
      if (currentSprite !== null) {
        // Do something
      }
    });
  });
})();
