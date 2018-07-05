var SaveLoad = (function () {
  var EXPORT_FORMATS = ['gas', 'mode7', 'bas', 'htmlcss'];
  var IMPORT_FORMATS = ['gas'];

  var Importer = function (spec, P, reporter) {
    this._spec = spec;
    this._P = P;
    this._objQueue = [];
    this._layerQueue = [];
    this._animationQueue = [];
    this._progressTotal = 0;
    this._progress = 0;
    this._reporter = reporter;

    this._init();
  };

  Importer.prototype._init = function () {
    for (var objName in this._spec.objects) {
      this._objQueue.push(objName);
      this._progressTotal += 1;
    }
  };

  Importer.prototype.progress = function () {
    return this._progressTotal > 0 ? (this._progress / this._progressTotal) : 0;
  };

  Importer.prototype.hasNext = function () {
    return this._objQueue.length + this._layerQueue.length + 
      this._animationQueue.length > 0;
  };

  Importer.prototype.next = function () {
    if (this._objQueue.length > 0) {
      var objName = this._objQueue.shift();
      this._progress += 1;
      return objName;
    } else if (this._layerQueue.length > 0) {
      
    } else if (this._animationQueue.length > 0) {
      // All loaded!
    }
  };

  Importer.prototype.initiate = function () {
    setTimeout((function () {
      if (this.hasNext()) {
        var output = this.next();
        if (typeof this._reporter === 'function') {
          this._reporter(output, this.progress());
        }
        this.initiate();
      } else {
        this._P.emit('import.complete');
      }
    }).bind(this), 100);
  };

  var SaveLoad = function (importButtons, exportButtons, modalImport, modalExport) {
    this._importButtons = importButtons;
    this._exportButtons = exportButtons;
    this._modalImport = modalImport;
    this._modalExport = modalExport;
  };

  SaveLoad.prototype.importGas = function (spec) {
    return new Importer(spec);
  };

  SaveLoad.prototype.bindImport = function (P) {
    for (var i = 0; i < IMPORT_FORMATS.length; i++) {
      P.bind(this._importButtons[IMPORT_FORMATS[i]], 'mousedown',
        'import.' + IMPORT_FORMATS[i] + '.trigger');
      P.listen('import.' + IMPORT_FORMATS[i] + '.trigger', (function (self, format) {
          return function () {
            return P.emit('import.prompt', {
            'type': format
          });
        };
      })(this, IMPORT_FORMATS[i]));
    }
    P.listen('import.prompt', (function (format) {
      this._modalImport.container.style.display = '';
      this._modalImport.prompt.style.display = '';
      return format;
    }).bind(this));
    P.bind(this._modalImport.btnCancel, 'click', 'import.prompt.cancel');
    P.listen('import.prompt.cancel', (function (e) {
      this._modalImport.container.style.display = 'none';
      this._modalImport.prompt.style.display = 'none';
      return e;
    }).bind(this));

    P.bind(this._modalImport.btnImport, 'click', 'import.prompt.start');
    P.listen('import.prompt.start', (function (e) {
      this._modalImport.container.style.display = '';
      this._modalImport.prompt.style.display = 'none';
      this._modalImport.progress.style.display = '';
      return P.emit('import.start', {
        'objects': {
          'foo': {},
          'bar': {},
          'baz': {},
          'baza': {},
          'bazb': {},
          'bazc': {},
          'bazd': {},
        }
      }).then(P.next(e));
    }).bind(this));
  };

  SaveLoad.prototype.bindExport = function (P) {
    for (var i = 0; i < EXPORT_FORMATS.length; i++) {
      P.bind(this._exportButtons[EXPORT_FORMATS[i]], 'mousedown',
        'export.' + EXPORT_FORMATS[i] + '.trigger');
      P.listen('export.' + EXPORT_FORMATS[i] + '.trigger', (function (self, format) {
        return function () {
            return P.emit('export.prompt', {
            'type': format
          });
        };
      })(this, EXPORT_FORMATS[i]));
    }
    P.listen('export.prompt', (function (format) {
      return format;
    }).bind(this));
  };

  SaveLoad.prototype.bind = function (P) {
    this.bindImport(P);
    this.bindExport(P);

    P.listen('import.start', (function (spec) {
      var importer = new Importer(spec, P, (function (output, progress) {
        this._modalImport.progressLabel.innerText = output;
        this._modalImport.progressBar.style.width = 
          (Math.round(progress * 1000) / 10) + '%';
      }).bind(this));
      
      importer.initiate();
      return spec;
    }).bind(this));
    P.listen('import.complete', (function () {
      this._modalImport.container.style.display = 'none';
      this._modalImport.progress.style.display = 'none';
      this._modalImport.progressBar.style.width = '0%';
      this._modalImport.progressLabel.innerText = '';
    }).bind(this));
  };

  return SaveLoad;
})();
