var Editor = (function () {
  var DEFAULTS = {
    'text': {
      'type': 'Text'
    },
    'sprite': {
      'type': 'Sprite',
      'size': {
        'width': 1,
        'height': 1
      }
    },
    'button': {
      'type': 'Button',
      'size': {
        'width': 1,
        'height': 1
      }
    },
    'frame': {
      'type': 'Frame'
    },
  }

  var _deepCopy = function (obj) {
    if (Array.isArray(obj)) {
      return obj.slice(0).map(function (item) {
        return _deepCopy(item);
      });
    }
    if (typeof obj === 'number' || typeof obj === 'string' ||
      typeof obj === 'boolean' || obj === null) {
      return obj;
    }
    var newObj = {};
    for (var key in obj) {
      newObj[key] = _deepCopy(obj[key]);
    }
    return newObj;
  }

  /*** START EDITOR CLASS ***/
  var Editor = function (workArea, canvas) {
    if (!ReprTools || !Repr || !_Create) {
      throw new Error('Environment not loaded correctly!');
    }
    this.tools = ['select', 'text', 'sprite', 'button', 'frame'];
    this.selectedTool = 'select';
    this._workArea = workArea;
    this._canvas = canvas;

    this._draggingStart = null;
    this._movingStart = null;
    this._selectBox = null;
    this._isBound = false;
  };

  Editor.prototype._translateOffsets = function (x, y, target) {
    while (target.parentNode !== null && target !== this._workArea) {
      x += target.offsetLeft;
      y += target.offsetTop;
      target = target.parentNode;
    }
    if (target !== this._workArea) {
      throw new Error('Offset Translation Failed');
    }
    return {
      'x': x,
      'y': y,
    }
  };
  Editor.prototype._canvasPosition = function (x, y, item) {
    if (item !== this._canvas && item !== this._workArea) {
      throw new Error('Cannot decode position not in work-area');
    }
    x = x - (item === this._canvas ? 0 : this._canvas.offsetLeft);
    y = y - (item === this._canvas ? 0 : this._canvas.offsetTop);
    return {'x': x, 'y': y};
  };

  Editor.prototype._onDown = function (e) {
    if (e.event.button !== 0) {
      return e;
    }
    switch (this.selectedTool) {
      case 'select':
        if (e.event.target !== this._canvas &&
          e.event.target !== this._workArea) {

          var ideName = e.event.target.getAttribute('ide-object-name');
          if (e.event.ctrlKey) {
            var newSelection = ReprTools.multiSelect(ideName, 'toggle');
            return this.P.emit('objects.select', newSelection).then(
              Promise.resolve(e));
          } else {
            if (ReprTools.isSelected(ideName)) {
              // Don't change selection
              this._movingStart = this._translateOffsets(
                e.event.offsetX, e.event.offsetY, e.event.target);
              return e;
            } else {
              return this.P.emit('objects.select', ideName).then((function (){
                this._movingStart = this._translateOffsets(
                  e.event.offsetX, e.event.offsetY, e.event.target);
              }).bind(this)).then(Promise.resolve(e));
            }
          }
        } else {
          // Clicked on blank
          if (e.event.ctrlKey) {
            // Ctrl pressed so do nothing
            return;
          }
          return this.P.emit('objects.select', []).then((function() {
            if (this._selectBox !== null) {
              if (this._selectBox.DOM !== null) {
                this._workArea.removeChild(this._selectBox.DOM);
              }
              this._selectBox = null;
            }
            this._selectBox = {
              'position': this._translateOffsets(
                e.event.offsetX, e.event.offsetY, e.event.target),
              'size': null,
              'DOM': null,
            }
          }).bind(this)).then(Promise.resolve(e));
        }
      case 'text':
      case 'sprite':
      case 'button':
        if (e.event.target !== this._canvas &&
          e.event.target !== this._workArea) {
          // Clicking on existing item
          var objName = e.event.target.getAttribute('ide-object-name');
          if (ReprTools.objectExists(objName) &&
            ReprTools.typeAsTool(ReprTools.getObjectType(objName),
              this.selectedTool)) {
            // Same type as current tool, enter move mode

            return this.P.emit('objects.select', objName).then(
              Promise.resolve(e));
          }
          return e;
        }
        var position = this._canvasPosition(e.event.offsetX,
          e.event.offsetY, e.event.target);
        var objectBase = _deepCopy(DEFAULTS[this.selectedTool]);
        objectBase.name = ReprTools.getUniqueName(objectBase.type);
        objectBase.position = position;

        if (this.selectedTool === 'sprite' ||
          this.selectedTool === 'button') {
          // Sprites are inherently resizable, allow dragsize immediately
          this._draggingStart = this._translateOffsets(
            e.event.offsetX, e.event.offsetY, e.event.target);
        }

        return this.P.emit('objects.add', objectBase).catch(function (err) {
            alert(err);
          }).then(Promise.resolve(e));

      case 'frame':
      default:
        return e;
    }
  };
  Editor.prototype._onUp = function (e) {
    if (e.event.button !== 0) {
      return e;
    }
    // Reset moving and draggind flags
    this._movingStart = null;
    this._draggingStart = null;

    if (this._selectBox !== null) {
      if (this._selectBox.DOM !== null) {
        this._workArea.removeChild(this._selectBox.DOM);
      }
      this._selectBox = null;
    }
  };
  Editor.prototype._onMove = function (e) {
    if (e.event.buttons !== 1) {
      return e; // Not dragging, just moving
    }
    if (this._draggingStart === null && this._movingStart === null &&
      this._selectBox === null) {

      return e; // Not not dragging anything
    }
    var currentPosition = this._translateOffsets(
        e.event.offsetX, e.event.offsetY, e.event.target);
    if (this.selectedTool === 'select') {
      if (this._selectBox !== null) {
        // Draw a select box
        this._selectBox.size = {
          'width': Math.max(currentPosition.x - this._selectBox.position.x, 1),
          'height': Math.max(currentPosition.y - this._selectBox.position.y, 1),
        }
        if (this._selectBox.DOM === null) {
          this._selectBox.DOM = _Create('div', {
            'className': 'selection',
            'style': {
              'top':  this._selectBox.position.y + 'px',
              'left': this._selectBox.position.x + 'px',
              'width': this._selectBox.size.width + 'px',
              'height': this._selectBox.size.height + 'px'
            }
          });
          this._workArea.appendChild(this._selectBox.DOM);
        } else {
          this._selectBox.DOM.style.width = this._selectBox.size.width + 'px';
          this._selectBox.DOM.style.height = this._selectBox.size.height + 'px';
        }
        return e;
      } else if (this._movingStart !== null) {
        // Something selected to be moved
        var deltaX = currentPosition.x - this._movingStart.x;
        var deltaY = currentPosition.y - this._movingStart.y;
        ReprTools.callOnSelection('move', deltaX, deltaY);
        this._movingStart = currentPosition;
      } else if (this._draggingStart !== null) {
        // Something selected to be resized
        var width = currentPosition.x - this._draggingStart.x;
        var height = currentPosition.y - this._draggingStart.y;
        ReprTools.callOnSelection('resize', width, height);
      }
    } else {
      // Non-selection tool.
      if (this._draggingStart !== null) {
        var width = currentPosition.x - this._draggingStart.x;
        var height = currentPosition.y - this._draggingStart.y;
        ReprTools.callOnSelection('resize', width, height);
      }
    }
  };

  Editor.prototype._bindToolButtons = function (P) {
    for (var i = 0; i < this.tools.length; i++) {
      var toolName = this.tools[i];
      var id = 'tool.' + toolName + '.click';
      P.bind($('tool-' + toolName), 'click', id);
      P.listen(id, (function (self, toolName) {
        return function (e) {
          try {
            e.event.target.blur();
          } catch (err) {}
          return P.emit('tool.change', {
            'from': self.selectedTool,
            'to': toolName
          }).then(function (tool) {
            self.selectedTool = toolName;
            return P.emit('trace','Change to tool ' + toolName);
          });
        }
      })(this, toolName));
    }
    // Add binding for changing class
    P.listen('tool.change', function (tool) {
      var toolFrom = $('tool-' + tool.from);
      var toolTo = $('tool-' + tool.to);
      _ToggleClass(toolFrom, 'selected', false);
      _ToggleClass(toolTo, 'selected', true);
      return tool;
    });
    P.listen('reset.editor.tools', function () {
      for (var i = 0; i < tools.length; i++) {
        _ToggleClass($('tool-' + this.tools[i]), 'selected', false);
      }
    });
  };

  Editor.prototype.bind = function (P) {
    if (this._isBound) {
      throw new Error('Cannot bind an editor more than once');
    }
    this.P = P;

    // Bind the buttons and queue up the renderer
    this._bindToolButtons(P);
    P.listen('reset.editor', function () {
      return Promise.all([
        P.emit('reset.editor.tools')
      ]);
    });

    // Bind the work area
    P.bind(this._workArea, 'mousedown', 'work-area.down');
    P.bind(this._workArea, 'mouseup', 'work-area.up');
    P.bind(this._workArea, 'mouseleave', 'work-area.leave');
    P.bind(this._workArea, 'mousemove', 'work-area.move');

    P.listen('work-area.down', this._onDown.bind(this));
    P.listen('work-area.up', this._onUp.bind(this));
    P.listen('work-area.leave', this._onUp.bind(this));
    P.listen('work-area.move', this._onMove.bind(this));

    this._isBound = true;
    return this.render(P);
  };

  Editor.prototype.render = function (P) {
    return P.emit('tool.change', {
      'from': this.selectedTool,
      'to': this.selectedTool
    });
  };

  return Editor;
})();
