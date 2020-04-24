var ToggleBtn = (function () {
  function ToggleBtn(btn, defaultValue) {
    this._dom = btn;
    this._state = defaultValue ? true : false;
    this._callback = null;

    this._dom.addEventListener('click', (function () {
      this.set(!this.get());
      this._dom.blur();
    }).bind(this));

    this.set(this._state);
  }

  ToggleBtn.prototype.listen = function (listener) {
    if (typeof listener === 'function') {
      this._callback = listener;
    }
  }

  ToggleBtn.prototype.set = function (state) {
    _ToggleClass(this._dom, 'active', state);
    this._state = state;
    this._onChange();
  }

  ToggleBtn.prototype.get = function () {
    return this._state;
  }

  ToggleBtn.prototype._onChange = function () {
    if (this._callback !== null) {
      this._callback(this.get());
    }
  }

  return ToggleBtn;
})();
