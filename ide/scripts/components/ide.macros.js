var MacroManager = (function () {
  var DEFAULT_MACROS = [
    {
      'description': 'Explode/Implode Selected Elements',
      'macro': function (prompter, selection, reprTools) {
        var ratio = prompter.prompt('float',
          'Specify the explosion radius (<1 = implode, >1 = explode): ', 1.0);
      }
    }
  ];
  var MacroManager = function (macrosInner) {
    this._macrosInner = macrosInner;
  };

  MacroManager.prototype.bind = function (P) {

  };

  return MacroManager;
})();
