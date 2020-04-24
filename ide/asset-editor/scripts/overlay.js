var ReferenceLayerManager = (function () {
  function ReferenceLayerManager(overlay, underlay) {
    this._overlay = overlay;
    this._underlay = underlay;
    this._logLines = 0;
    this._crosshair = this._overlay.makeGroup('crosshair');
    this._console = this._underlay.makeGroup('console');
    this._groups = {};
  }

  ReferenceLayerManager.prototype.drawBoxes = function (group, items) {
    if (!(group in this._groups)) {
      this._groups[group] = this._overlay.makeGroup(group);
    }
    var g = this._groups[group];
    g.clear();
    var ctx = this._overlay.context().fork().setAttribute('fill', 'none'),
      tctx = this._overlay.context().fork().setAttribute('stroke', 'none');
    items.forEach(function(box) {
      g.draw(ctx.rect(box.x, box.y, box.width, box.height))
        .draw(tctx.text(box.x, box.y, box.name));
    });
  }

  ReferenceLayerManager.prototype.toggleCrosshair = function (show) {
    var context = this._overlay.context().fork()
      .setAttribute('fill', 'none');
    this._crosshair.clear();
    if (show) {
      this._crosshair
        .draw(context.line('45%', '50%', '55%', '50%'))
        .draw(context.line('50%', '45%', '50%', '55%'));
    }
  }

  ReferenceLayerManager.prototype.log = function (text) {
    var ctx = this._underlay.context().fork()
      .setAttribute('alignment-baseline', 'hanging')
      .setAttribute('fill', '#000')
      .setAttribute('stroke', 'none')
      .setAttribute('font-size', 9);
    this._console.draw(ctx.text(0, this._logLines * 9, text));
    this._logLines += 1;
  }

  ReferenceLayerManager.prototype.clearLog = function () {
    this._console.clear();
  }

  return ReferenceLayerManager;
})();
