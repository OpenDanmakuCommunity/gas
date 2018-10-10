var SaveLoad = (function () {
  var EXPORT_FORMATS = ['gas', 'mode7', 'bas', 'htmlcss'];
  var IMPORT_FORMATS = ['gas'];

  var _flattenObject = function (object, excludeKeys) {
    var flat = {};
    var exclude = Array.isArray(excludeKeys) ? excludeKeys.slice(0) : [];
    for (var key in object) {
      if (typeof object[key] === 'string' || typeof object[key] === 'number' ||
        typeof object[key] === 'boolean' || object[key] === null ||
        exclude.indexOf(key) >= 0) {
        flat[key] = object[key];
      } else if (typeof object[key] === 'undefined') {
        // Do nothing
      } else if (typeof object[key] === 'object') {
        if (Array.isArray(object[key])) {
          flat[key] = object[key].slice(0);
        } else {
          var flattened = _flattenObject(object[key]);
          for (var flatkey in flattened) {
            flat[key + '.' + flatkey] = flattened[flatkey];
          }
        }
      }
    }
    return flat;
  };

  var Importer = function (spec, P, reporter) {
    this._spec = spec;
    this._P = P;
    this._loadedMetadata = false;
    this._objQueue = [];
    this._layerQueue = [];
    this._animationQueue = [];
    this._progressTotal = 0;
    this._progress = 0;
    this._reporter = reporter;

    this._init();
  };

  Importer.prototype._init = function () {
    // Add progress total for metadata
    this._progressTotal += 1;
    for (var objName in this._spec.objects) {
      this._objQueue.push(objName);
      this._progressTotal += 1;
    }
    for (var i = 0; i < this._spec.layers.length; i++) {
      this._layerQueue.push(this._spec.layers[i]);
      this._progressTotal += 1;
    }
    if ('anchors' in this._spec.animation) {
      for (var i = 0; i < this._spec.animation.anchors.length; i++) {
        this._animationQueue.push(this._spec.animation.anchors[i].time);
        this._progressTotal += 1;
      }
    }
  };

  Importer.prototype.progress = function () {
    return this._progressTotal > 0 ? (this._progress / this._progressTotal) : 0;
  };

  Importer.prototype.hasNext = function () {
    return !this._loadedMetadata ||
      this._objQueue.length + this._layerQueue.length +
        this._animationQueue.length > 0;
  };

  Importer.prototype.next = function () {
    if (!this._loadedMetadata) {
      // Populate the global time
      this._loadedMetadata = true;
      return 'Metadata';
    } else if (this._objQueue.length > 0) {
      var objName = this._objQueue.shift();
      this._progress += 1;
      var obj = this._spec.objects[objName];
      // Flatten the object
      var objSpec = _flattenObject(obj, ['content']);
      // Fix the color
      if ('font.color' in objSpec) {
        objSpec['font.color'] = Primitives.Color.from(objSpec['font.color']);
      }
      this._P.emit('objects.add', {
        'name': objName,
        'spec': objSpec
      });
      return objName;
    } else if (this._layerQueue.length > 0) {
      var layer = this._layerQueue.shift();
      if (layer.name !== 'default') {
        // We need to create the layer
        this._P.emit('layers.add', layer.name);
      }
      for (var i = 0; i < layer.components.length; i++) {
        var objectName = layer.components[layer.components.length - i - 1];
        var objectHigher = (i === 0 ? null :
          layer.components[layer.components.length - i])
        this._P.emit('objects.reflow', {
          'source': objectName,
          'target': objectHigher,
          'sourceLayer': 'default',
          'targetLayer': layer.name
        });
      }
      this._progress += 1;
      return 'Layer:' + layer.name;
    } else if (this._animationQueue.length > 0) {
      var anchorTime = this._animationQueue.shift();
      this._progress += 1;
      return 'Anchor @ ' + anchorTime;
    }
  };

  Importer.prototype.initiate = function () {
    setTimeout((function () {
      if (this.hasNext()) {
        try {
          var output = this.next();
          if (typeof this._reporter === 'function') {
            this._reporter(output, this.progress());
          }
          this.initiate();
        } catch (e) {
          this._P.emit('import.fail', e);
        }
      } else {
        this._P.emit('import.complete');
      }
    }).bind(this), 100);
  };

  var Exporter = function (format) {
      this._format = format;
  };

  Exporter.prototype.exportGasScript = function () {
    var base = {
      'objects': {},
      'layers': [],
      'animation': {},
      'metadata': {}
    };
    // Populate the objects
    ReprTools.allObjectNames().forEach(function (objName) {
      base.objects[objName] = ReprTools.getObject(objName).serialize();
    });
    // Populate the layers
    LayerTools.allLayerNamesOrdered().forEach(function (layerName) {
      base.layers.push({
        'name': layerName,
        'components': LayerTools.getLayer(layerName).components.slice(0)
      });
    });
    // Populate the animations
    // TODO: Write this
    // Populate the metadata
    base.metadata = _deepCopy(Repr.workspace.metadata);
    return base;
  };

  Exporter.prototype.exportBasScript = function () {
    // First get the GAS Script
    var raw = this.exportGasScript();
    return BasTranslator.toBas(raw);
  };

  Exporter.prototype.export = function () {
    switch(this._format) {
      case 'mode7':
      case 'htmlcss':
        throw new Error('Not implemented');
      case 'bas':
        return this.exportBasScript();
      case 'gas':
      default:
        return JSON.stringify(this.exportGasScript());
    }
  };

  Exporter.prototype.name = function () {
    var extension = '.txt';
    if (this._format === 'mode7') {
      extension = '.xml';
    } else if (this._format === 'htmlcss') {
      extension = '.html';
    }
    return 'exported-' + this._format + '-' + Date.now() + extension;
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
          }).catch(function (e) {
            console.error(e);
            alert(e);
          });
        };
      })(this, IMPORT_FORMATS[i]));
    }
    P.listen('import.prompt', (function (format) {
      this._modalImport.container.style.display = '';
      this._modalImport.prompt.style.display = '';
      return format;
    }).bind(this));

    // Bind to stuff in the prompt
    var _importCache = null;
    P.bind(this._modalImport.filePicker, 'change', 'import.prompt.pick');
    P.listen('import.prompt.pick', (function (e) {
      var files = e.event.target.files;
      if (files.length > 0) {
        // Disable the text area
        this._modalImport.textArea.setAttribute('disabled', 'disabled');
      } else {
        this._modalImport.textArea.deleteAttribute('disabled');
      }
      var fr = new FileReader();
      fr.addEventListener('load', function (event) {
        _importCache = event.target.result;
      });
      fr.addEventListener('error', function () {
        _importCache = null;
      })
      fr.readAsText(files[0]);
      return e;
    }).bind(this));
    P.bind(this._modalImport.textArea, 'change', 'import.prompt.entry');
    P.listen('import.prompt.entry', (function (e) {
      _importCache = this._modalImport.textArea.value;
      return e;
    }).bind(this));

    // Bind to bottom buttons in prompt
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
      try {
        var data = JSON.parse(_importCache);
        return P.emit('import.start', data).then(P.next(e));
      }
      catch (e) {
        alert('Malformed input file!');
        return P.emit('import.prompt.cancel').then(P.next(e));
      }
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
          }).catch(function (e) {
            console.error(e);
            alert(e);
          });
        };
      })(this, EXPORT_FORMATS[i]));
    }
    P.listen('export.prompt', (function (format) {
      var exporter = new Exporter(format.type);
      var data = exporter.export();
      var blob = new Blob([data], {type: 'text/plain'});
      var a = _Create('a', {
        'href': URL.createObjectURL(blob),
        'download': exporter.name()
      });
      a.click();
      return format;
    }).bind(this));
  };

  SaveLoad.prototype.bind = function (P) {
    this.bindImport(P);
    this.bindExport(P);

    P.listen('import.start', (function (spec) {
      this._modalImport.progress.style.display = '';
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
    P.listen('import.fail', (function (message) {
      this._modalImport.container.style.display = 'none';
      this._modalImport.progress.style.display = 'none';
      this._modalImport.progressBar.style.width = '0%';
      this._modalImport.progressLabel.innerText = '';
      return P.emit('trace.error', message).then(P.next(message));
    }).bind(this));
  };

  return SaveLoad;
})();
