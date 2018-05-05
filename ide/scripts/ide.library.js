var AssetsLibrary = (function () {
  var AssetsLibrary = function (filePicker, libraryInner) {
    this._filePicker = filePicker;
    this._libraryInner = libraryInner;
    this._assetListItems = {};
    this._assets = {};
  };

  AssetsLibrary.prototype._autoName = function (filename) {
    var name = filename.replace(new RegExp("[^a-zA-Z0-9-_]","g"), '_');
    var proposedName = name, incr = 0;
    while (this.hasAsset(proposedName)) {
      proposedName = name + '-' + (incr++);
    }
    return proposedName;
  };

  AssetsLibrary.prototype._extractDataURI = function (dataUri) {
    // Check that the dataUri is correct
    if (dataUri.substring(0, 5).toLowerCase() !== 'data:') {
      throw new Error('Data URI illegal');
    }
    var data = dataUri.toString().substring(5).split(',');
    var type = data[0].split(';'),
        raw = data.slice(1).join(',');
    return {
      'type': type[0],
      'data': raw,
      'encoding': type.slice(1).join(';')
    };
  };

  AssetsLibrary.prototype._readFiles = function (files) {
    var promises = [];
    for (var i = 0, f; f = files[i]; i++) {
      promises.push(new Promise((function (file) {
        return function (resolve, reject) {
          var reader = new FileReader();
          reader.onload = function (evt) {
            resolve({
              'file': file,
              'data': evt.target.result
            });
          };
          reader.readAsDataURL(file);
        }
      })(f)));
    }
    return promises;
  };

  AssetsLibrary.prototype.hasAsset = function (assetName) {
    return assetName in this._assets;
  };

  AssetsLibrary.prototype.getAssetAsUri = function (assetName) {
    var asset = this._assets[assetName];
    return 'data:' + asset.type +
      (asset.encoding !== '' ? (';' + asset.encoding) : '') + ',' +
      asset.data;
  };

  AssetsLibrary.prototype.getAssetSummary = function (assetName) {
    var asset = this._assets[assetName];
    return {
      'name': assetName,
      'type': asset.type
    };
  };

  AssetsLibrary.prototype.renameAsset = function (oldName, newName) {
    if (newName in this._assets) {
      throw new Error('Asset with ' + assetName + ' already exists!');
    }
  };

  AssetsLibrary.prototype.removeAsset = function (assetName) {

  };

  AssetsLibrary.prototype.addAsset = function (assetName, assetData) {
    if (assetName in this._assets) {
      throw new Error('Asset with ' + assetName + ' already exists!');
    }
    console.log(assetData);
    this._assets[assetName] = assetData;
  };


  AssetsLibrary.prototype.bind = function (P) {
    P.bind(this._filePicker, 'change', 'library.filepicker.pick');
    P.listen('library.filepicker.pick', (function (e) {
      return Promise.all(
        this._readFiles(e.event.target.files)).then((function (files) {
          var promises = [];
          for (var i = 0, f; f = files[i]; i++) {
            var name = this._autoName(f.file.name);
            this.addAsset(name,
              this._extractDataURI(f.data));
            promises.push(P.emit('library.add', name));
          }
          return Promise.all(promises);
        }).bind(this)).catch(function (err) {
          alert(err);
        }).then(Promise.resolve(e));
    }).bind(this));

    P.listen('library.add', (function (assetName) {
      var URI = this.getAssetAsUri(assetName);
      var summary = this.getAssetSummary(assetName);
      var thumbnailImage = _Create('div', {
        'className': 'thumbnail',
        'style': {
          'background-image': 'url(' + URI + ')',
        }
      });
      var thumbnail = _Create('a', {
        'href': URI,
        'target': '_blank',
      }, [thumbnailImage]);
      var desc = _Create('div', {
        'className': 'description'
      }, [_Create('text',
        'Name: ' + summary.name + ' | Type: ' + summary.type)]);
      var item = _Create('div', {
        'className': 'image-group'
      }, [
        _Create('div', {
          'className': 'image',
        }, [thumbnail]),
        desc,
        _Create('div', {
          'className': 'clearfix'
        }),
      ]);
      this._libraryInner.insertBefore(item, this._libraryInner.firstChild);
      return assetName;
    }).bind(this));
  };

  return AssetsLibrary;
})();
