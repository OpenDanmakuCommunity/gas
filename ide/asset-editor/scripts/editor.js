(function () {
  var P = new Pettan();
  var T = new Timer();

  window.addEventListener('load', function () {
    var canvas = new SvgCanvas($('canvas'), {}),
        underlay = new SvgCanvas($('underlay'), {}),
        overlay = new SvgCanvas($('overlay'), {
          'stroke': '#72DEC9',
          'stroke-width': 1,
          'stroke-linecap': '',
          'fill': 'none'
        });

    // Draw Crosshairs on the overlay
    var oc = overlay.context();
    overlay.makeGroup('crosshair')
      .draw(oc.line('45%', '50%', '55%', '50%'))
      .draw(oc.line('50%', '45%', '50%', '55%'));

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
      window.exampleSprite = sprite;

      var dur = 2000;

      var start = Date.now();
      setInterval(function () {
        var t = (Date.now() - start) % dur / dur;
        sprite.update(t);
      }, 300);
    });
  });
})();
