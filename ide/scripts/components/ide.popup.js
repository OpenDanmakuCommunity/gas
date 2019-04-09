var Popup = (function () {
  var Popup = function (spec) {
    this._group = spec.group;
    this._prompt = spec.prompt;
    this._body = spec.body;
    this._okBtn = spec.okBtn;
  };
  
  Popup.prototype.bind = function (P) {
    P.bind(this._okBtn, 'click', 'popup.ok.click');

    P.listen('popup.show', (function (msg) {
      if (typeof msg === 'string') {
        this._body.innerText = msg;
      } else if (msg === null || typeof msg === 'undefined') {
        this._body.innerText = '';
      } else if (typeof msg === 'object') {
        this._prompt.style.width = msg.width + 'px';
        this._prompt.style.height = msg.height + 'px';
        this._body.innerText = msg.text;
      }
      return P.emit('popup.open').then(P.next(msg));
    }).bind(this));

    P.listen('popup.ok.click', (function (msg) {
      return P.emit('popup.close').then(P.next(msg));
    }).bind(this));

    P.listen('popup.open', (function (msg) {
      this._group.style.display = '';
      return msg;
    }).bind(this));

    P.listen('popup.close', (function (msg) {
      this._group.style.display = 'none';
      return msg;
    }).bind(this));
  };
  
  return Popup;
})();
