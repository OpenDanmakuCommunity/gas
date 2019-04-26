var CommandLine = (function () {
  var CommandLine = function (modal, inputArea, logger) {
    this._modal = modal;
    this._inputArea = inputArea;
    this._logger = logger;
    this._visible = false;
  };

  CommandLine.prototype.show = function () {
    this._modal.style.display = '';
    this._inputArea.focus();
    this._visible = true;
  };

  CommandLine.prototype.hide = function () {
    this._modal.style.display = 'none';
    this._inputArea.blur();
    this._visible = false;
  };

  CommandLine.prototype.clear = function () {
    this._inputArea.value = '';
  };

  CommandLine.prototype.execute = function (P) {
    var _c = this._inputArea.value.trim().split(' ');
    var command = _c.shift();
    var params = _c.join(' ');
    switch(command) {
      case '': {
        break;
      }
      case 'help': {
        this._logger.log('Command line help: \n' + 
          'help - displays this help message\n' + 
          'list - lists all available commands\n');
        this._logger.warn('The command line allows you to send arbitrary ' + 
          'messages to various end-points in the IDE.\nSending the wrong ' + 
          'commands may leave the IDE in an inconsistent state and may ' + 
          'result in loss of any unsaved work.');
        break;
      }
      case 'ls':
      case 'list': {
        var message = [];
        for(var name in P.bindings) {
          message.push(' -' +
            (name in P.nativeBindings ? ' [N] ' : ' ') + name);
        }
        if (params.length === 0) {
          this._logger.log('All commands: \n' + message.sort().join('\n'));
        } else {
          this._logger.log('Commands starting with "' + params + '": \n' +
            message.sort().filter(function (item) {
              return item.indexOf(' - ' + params) === 0;
            }).join('\n'));
        }
        break;
      }
      default: {
        if (!(command in P.bindings)) {
          this._logger.warn('Command "' + command + '" not found!');
        } else {
          try {
            P.emit(command, params.length > 0 ? JSON.parse(params) : null);
          } catch (e) {
            this._logger.error(e);
          }
        }
        break;
      }
    }
  };

  CommandLine.prototype.bind = function (P) {
    P.bind(this._inputArea, 'keydown', 'commandline.input.key');
    P.listen('commandline.input.key', (function (e) {
      if (e.event.key === 'Enter') {
        this.execute(P);
        this.clear();
        this.hide();
      }
      return e;
    }).bind(this));
    P.listen('global.keydown', (function (key) {
      if (key.input) {
        return key;
      }
      if ((key.key === 'c' || key.key === '\xE7') && key.altKey) {
        this.show();
      }
      return key;
    }).bind(this));
  };

  return CommandLine;
})();
