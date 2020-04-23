(function () {
  var REF_CTX = {
    'stroke': '#72DEC9',
    'stroke-width': 1,
    'fill': '#72DEC9'
  };
  var P = new Pettan();
  var T = new Timer();

  window.addEventListener('load', function () {
    var canvas = new SvgCanvas($('canvas'), {}),
        underlay = new SvgCanvas($('underlay'), REF_CTX),
        overlay = new SvgCanvas($('overlay'), REF_CTX);
    var infoBox = $('info-box');

    // Load the various managers
    var rlm = new ReferenceLayerManager(overlay, underlay);

    var examplesDir = '../../docs/static/examples/sprites/';
    var demos = {
      'svgp-azureus': 'svgp-azureus-motions.json',
      'svgp-spinner': 'svgp-spinner.json',
      'svg-azureus': 'svg-azureus.json'
    };

    fetch(examplesDir + demos['svgp-azureus']).then(function (resp) {
      return resp.json();
    }).then(function (svgp) {
      var sprite = new SVGP(svgp, [0, 0, 640, 480]);
      sprite.draw(canvas, 0);
      // Update the other viewBoxes
      overlay.setViewBox.apply(overlay, sprite.viewBox());
      // Update info-box
      infoBox.innerText = sprite.toString();
      window.exampleSprite = sprite;

      var dur = 2000;

      var start = Date.now();
      setInterval(function () {
        var t = (Date.now() - start) % dur / dur;
        sprite.update(t);
      }, 300);
    });

    window.rlm = rlm;
  });
})();
