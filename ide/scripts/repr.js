// Internal Representation for the IDE

var Repr = {
  'uiState': {
    'config': {
      'historyMax': 48,
    },
    'selectedTool': 'select',
    'selectedObjects': [],
    'selectedLayer': '',
    'timeline': {
      'playhead': 0
    },
    'lastIndex': 0,
  },
  'workspace': {
    'objects': {},
    'layers': {
      'default': []
    },
    'metadata': {}
  }
};
var GText = (function () {
  var GText = function (spec) {
    this.DOM = null;
    this._name = spec.name;
    this._text = 'Example';
    this._x = spec.position.x;
    this._y = spec.position.y;

    this.load();
  };
  
  GText.prototype.load = function () {
    if (this.DOM === null) {
      this.DOM = _Create('div', {
        'className': 'text',
        'ide-object-name': this._name
      }, [
        _Create('text', this._text)
      ]);
      this.DOM.style.position = 'absolute';
      this.DOM.style.top = this._y + 'px';
      this.DOM.style.left = this._x + 'px';
    }
  };
  
  GText.prototype.setFocus = function (hasFocus) {
    _ToggleClass(this.DOM, 'item-focus', hasFocus);
  };
  
  GText.prototype.stageItem = function () {
    
    return this.DOM;
  }
  return GText;
})();

var GSprite = (function () {
  var GSprite = function (pettan) {
    this.P = pettan;
  };
  return GSprite;
})();

var GButton = (function () {
  var GButton = function (pettan) {
    this.P = pettan;
  };
  return GButton;
})();

// Singleton factory
var GFactory = new function () {
  this.createFromSpec = function (spec) {
    switch (spec.type) {
      case 'Text':
      case 'RichText':
        return new GText(spec);
      case 'Button':
        return new GButton(spec);
      case 'Sprite':
        return new GSprite(spec);
      default:
        throw new Error('Spec had type ' + spec.type + ' but it was not recognized.');
    }
  };
};

