var MiniWindow = (function () {
  var MiniWindow = function (mWindow, name) {
    this._window = mWindow;
    this._titleBar = null;

    var headings = this._window.getElementsByTagName('h1');
    if (headings.length >= 0) {
      this._titleBar = headings[0];
    }
    this._name = (typeof name === 'string' && name !== null) ?
      name : this._getName();
  };

  MiniWindow.prototype._getName = function () {
    if (this._window.getAttribute('id') !== null) {
      return this._window.getAttribute('id');
    } else {
      return 'binding-created-' + Date.now();
    }
  };

  MiniWindow.prototype._bindTitleBar = function (P) {
    if (this._titleBar === null) {
      return;
    }
    P.bind(this._titleBar, 'mousedown', 'miniwindow.' + this._name +
      '.title.dblclick');
    P.listen('miniwindow.' + this._name + '.title.dblclick', (function (e) {
      _ToggleClass(this._window, 'collapse',
        this._window.className.split(' ').indexOf('collapse') < 0);
      return e;
    }).bind(this));
  };

  MiniWindow.prototype.bind = function (P) {
    this._bindTitleBar(P);
  };

  return MiniWindow;
})();
