var LayerManager = (function () {
  var LayerManager = function (layerList) {
    if (!Repr || !_Create) {
      throw new Error('Global Stuff not loaded!');
    }
    
    this._layerList = layerList;
  };

  LayerManager.prototype.bind = function (P) {
    P.listen('layers.add', (function (layerName) {
      
    }).bind(this));
  };

  return LayerManager;
})();