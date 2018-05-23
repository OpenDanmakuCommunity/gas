var SaveLoad = (function () {
  var EXPORT_FORMATS = ['gas', 'mode7', 'bas', 'htmlcss'];
  var IMPORT_FORMATS = ['gas'];
  var SaveLoad = function (exportButtons, importButtons) {
    this._exportButtons = exportButtons;
    this._importButtons = importButtons;
  };

  SaveLoad.prototype.bindImport = function (P) {
    for (var i = 0; i < IMPORT_FORMATS.length; i++) {
      P.bind(this._importButtons[IMPORT_FORMATS[i]], 'mousedown',
        'import.' + IMPORT_FORMATS[i] + '.trigger');
    }
  };

  SaveLoad.prototype.bindExport = function (P) {
    for (var i = 0; i < EXPORT_FORMATS.length; i++) {
      P.bind(this._exportButtons[EXPORT_FORMATS[i]], 'mousedown',
        'export.' + EXPORT_FORMATS[i] + '.trigger');
    }
  };

  SaveLoad.prototype.bind = function (P) {
    this.bindImport(P);
    this.bindExport(P);
  };

  return SaveLoad;
})();