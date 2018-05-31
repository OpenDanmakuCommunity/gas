var Editor = (function () {
  var DEFAULTS = {
    'text': {
      'type': 'Text',
      'content': '(Text Here)',
      'font.decoration': ['outline'],
      'position.axis': 'top-left',
      'font.color': 0xffffff,
      'font.orientation': 'horizontal-tb',
      'transform.scale': 1,
      'transform.rotX': 0,
      'transform.rotY': 0,
      'transform.rotZ': 0,
    },
    'sprite': {
      'type': 'Sprite',
      'size.width': 1,
      'size.height': 1,
      'position.axis': 'top-left',
      'transform.scale': 1,
      'transform.rotX': 0,
      'transform.rotY': 0,
      'transform.rotZ': 0,
      'image.repeat': 'no-repeat',
      'image.stretchMode': 'contain',
    },
    'button': {
      'type': 'Button',
      'content': 'Button Label',
      'size.width': 1,
      'size.height': 1,
      'font.decoration': ['outline'],
      'font.color': 0xffffff,
      'font.orientation': 'horizontal-tb',
      'position.axis': 'top-left',
      'transform.scale': 1,
      'transform.rotX': 0,
      'transform.rotY': 0,
      'transform.rotZ': 0,
    },
    'frame': {
      'type': 'Frame',
      'size.width': 1,
      'size.height': 1,
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
  };

  /*** START EDITOR CLASS ***/
  var Editor = function (timer, workArea, canvas, workAreaConfigButtons) {
    if (!ReprTools || !Repr || !_Create || !Selection) {
      throw new Error('Environment not loaded correctly!');
    }
    this.T = timer;

    this.tools = ['select', 'text', 'sprite', 'button', 'frame'];
    this.selectedTool = 'select';

    this._workArea = workArea;
    this._canvas = canvas;
    this._workAreaConfigButtons = workAreaConfigButtons;

    this._isPreviewMode = false;

    this._draggingStart = null;
    this._movingStart = null;
    this._selectBox = null;
    this._isBound = false;
    this._zoomFactor = 1;
  };

  Editor.prototype._translateOffsets = function (x, y) {
    var workAreaBox = this._workArea.getBoundingClientRect();
    return {
      'x': x - workAreaBox.left + this._workArea.scrollLeft,
      'y': y - workAreaBox.top + this._workArea.scrollTop,
    };
  };
  Editor.prototype._canvasPosition = function (x, y) {
    var workAreaRelPos = this._translateOffsets(x, y);
    return {
      'x': workAreaRelPos.x - this._canvas.offsetLeft,
      'y': workAreaRelPos.y - this._canvas.offsetTop
    };
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
            var newSelection = Selection.multiSelect(ideName, 'toggle');
            return this.P.emit('objects.select', newSelection).then(
              this.P.next(e));
          } else {
            if (Selection.isSelected(ideName)) {
              // Don't change selection
              this._movingStart = this._translateOffsets(e.event.clientX,
                e.event.clientY);
              return e;
            } else {
              return this.P.emit('objects.select', ideName).then((function (){
                this._movingStart = this._translateOffsets(e.event.clientX,
                  e.event.clientY);
              }).bind(this)).then(this.P.next(e));
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
              'position': this._translateOffsets(e.event.clientX,
                e.event.clientY),
              'size': null,
              'DOM': null,
            }
          }).bind(this)).then(this.P.next(e));
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
              this.P.next(e));
          }
          return e;
        }
        var position = this._canvasPosition(e.event.clientX, e.event.clientY);
        var objectBase = _deepCopy(DEFAULTS[this.selectedTool]);
        objectBase['position.x'] = position.x;
        objectBase['position.y'] = position.y;

        if (this.selectedTool === 'sprite' ||
          this.selectedTool === 'button') {
          // Sprites are inherently resizable, allow dragsize immediately
          this._draggingStart = this._translateOffsets(e.event.clientX,
            e.event.clientY);
        }

        var objectData = {
          'name': ReprTools.getUniqueName(objectBase.type),
          'spec': objectBase
        };

        return this.P.emit('objects.add', objectData).catch(function (err) {
            console.log(err);
            alert(err);
          }).then(this.P.next(e));

      case 'frame':
      default:
        return e;
    }
  };
  Editor.prototype._onUnset = function () {
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
  Editor.prototype._onLeave = function (e) {
    this._onUnset();
    if (Selection.count() > 0) {
      return this.P.emit('properties.load', Selection.get());
    } else {
      return e;
    }
  };
  Editor.prototype._onUp = function (e) {
    if (e.event.button !== 0) {
      return e;
    }
    this._onUnset();
    if (Selection.count() > 0) {
      return this.P.emit('properties.load', Selection.get());
    } else {
      return e;
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
    var currentPosition = this._translateOffsets(e.event.clientX,
      e.event.clientY);
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
        ReprTools.callOnGroup(Selection.get(), 'move', this.T.time(), deltaX, deltaY);
        this._movingStart = currentPosition;
      } else if (this._draggingStart !== null) {
        // Something selected to be resized
        var width = currentPosition.x - this._draggingStart.x;
        var height = currentPosition.y - this._draggingStart.y;
        ReprTools.callOnGroup(Selection.get(), 'resize', this.T.time(), width, height);
      }
    } else {
      // Non-selection tool.
      if (this._draggingStart !== null) {
        var width = currentPosition.x - this._draggingStart.x;
        var height = currentPosition.y - this._draggingStart.y;
        ReprTools.callOnGroup(Selection.get(), 'resize', this.T.time(), width, height);
      }
    }
  };
  Editor.prototype._onSelect = function (oldSelection, newSelection) {
    oldSelection.forEach(function (selection) {
      if (ReprTools.objectExists(selection)) {
        ReprTools.getObject(selection).setFocus(false);
      }
    });
    newSelection.forEach(function (selection) {
      ReprTools.getObject(selection).setFocus(true);
    });
  };


  Editor.prototype._bindConfigButtons = function (P) {
    P.bind(this._workAreaConfigButtons.bgBlack, 'click',
      'editor.controls.bgBlack');
    P.bind(this._workAreaConfigButtons.bgWhite, 'click',
      'editor.controls.bgWhite');
    P.bind(this._workAreaConfigButtons.bgCheckered, 'click',
      'editor.controls.bgCheckered');
    P.listen('editor.controls.bgBlack', function (e) {
      return P.emit('editor.canvas.background.set', 'black').then(
        P.next(e));
    });
    P.listen('editor.controls.bgWhite', function (e) {
      return P.emit('editor.canvas.background.set', 'white').then(
        P.next(e));
    });
    P.listen('editor.controls.bgCheckered', function (e) {
      return P.emit('editor.canvas.background.set', 'checkered').then(
        P.next(e));
    });

    P.listen('editor.canvas.background.set', (function (type) {
      if (type === 'black' || type === 'white' || type === 'checkered') {
        // Reset work area
        _ToggleClass(this._canvas, ['black', 'white', 'checkered'], false);
        // Reset buttons
        _ToggleClass([
          this._workAreaConfigButtons.bgBlack,
          this._workAreaConfigButtons.bgWhite,
          this._workAreaConfigButtons.bgCheckered
        ], 'selected', false);
        _ToggleClass(this._canvas, type, true);

        switch(type) {
          case 'black':
            _ToggleClass(this._workAreaConfigButtons.bgBlack, 'selected', true);
            break;
          case 'white':
            _ToggleClass(this._workAreaConfigButtons.bgWhite, 'selected', true);
            break;
          case 'checkered':
            _ToggleClass(this._workAreaConfigButtons.bgCheckered, 'selected', true);
            break;
        }
        return type;
      } else {
        throw new Error('Unrecognized background settings');
      }
    }).bind(this));

    P.listen('reset.editor.canvas.background', function () {
      return P.emit('editor.canvas.background.set', 'black');
    });
    P.listen('reset.editor.canvas.perspective', (function () {
      return P.emit('editor.canvas.perspective.set',
        this._canvas.offsetWidth / 2 / Math.tan(Math.PI/180 * 27.5));
    }).bind(this));
    // Bind the preview button
    P.bind(this._workAreaConfigButtons.configPreview, 'click',
      'editor.canvas.previewMode.toggle');
    P.listen('editor.canvas.previewMode.toggle', (function () {
      this._isPreviewMode = !this._isPreviewMode;
      _ToggleClass(this._canvas, 'preview', this._isPreviewMode);
      _ToggleClass(this._workAreaConfigButtons.configPreview, 'selected',
        this._isPreviewMode);
    }).bind(this));

    // Bind the size adjustments
    P.bind(this._workAreaConfigButtons.width, 'change', 'editor.controls.width');
    P.bind(this._workAreaConfigButtons.height, 'change', 'editor.controls.height');
    P.listen('editor.controls.width', function (e) {
      return P.emit('editor.canvas.width.set', e.event.target.value).then(
        P.next(e));
    });
    P.listen('editor.controls.height', function (e) {
      return P.emit('editor.canvas.height.set', e.event.target.value).then(
        P.next(e));
    });
    P.listen('editor.canvas.width.set', (function (width) {
      this._canvas.style.width = width + 'px';
      return width;
    }).bind(this));
    P.listen('editor.canvas.height.set', (function (height) {
      this._canvas.style.height = height + 'px';
      return height;
    }).bind(this));
    P.listen('editor.canvas.perspective.set', (function (perspective) {
      this._canvas.style.perspective = perspective;
      this._canvas.style.webkitPerspective = perspective;
      return perspective;
    }).bind(this));
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
            return P.emit('trace.log','Change to tool ' + toolName);
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
      return P.next();
    });
  };

  Editor.prototype._bindPlayback = function (P) {
    P.listen('timeline.update', (function (time) {

    }).bind(this));
  };

  Editor.prototype._bindObjectActions = function (P) {
    // Listen on add object events
    P.listen('objects.add', (function (data) {
      console.log('Creating object [' + data.spec.type + ']' + data.name);
      // This creates objects
      var objInst = GFactory.createFromSpec(data.name, data.spec);
      ReprTools.addObject(data.name, objInst);
      this._canvas.appendChild(objInst.DOM);

      return P.emit('tracks.add', data).then(P.emit('objects.added', {
          'name': data.name,
          'inst': objInst
        })).then(P.next(data));
    }).bind(this));

    P.listen('objects.remove', (function (objName) {
      Selection.remove(objName); // Un-select the item
      this._canvas.removeChild(ReprTools.getObject(objName).DOM);
      ReprTools.removeObject(objName);
      return P.emit('objects.select', Selection.get()).then(
        P.emit('objects.removed', {
          'name': objName
        })).then(P.next(objName));
    }).bind(this));

    P.listen('objects.rename', function (nameSpec) {
      ReprTools.renameObject(nameSpec.oldName, nameSpec.newName);
      return P.emit('objects.renamed', nameSpec).then(P.next(nameSpec));
    });

    // Listen on select object events
    P.listen('objects.select', function (objectNames) {
      var newSelection = objectNames;
      if (!Array.isArray(objectNames)) {
        if (typeof objectNames === 'string') {
          newSelection = [objectNames]
        } else {
          throw new Error('Illegal value for setting selected!');
        }
      } else {
        newSelection = objectNames.slice(0);
      }
      newSelection = newSelection.filter(function (item) {
        return ReprTools.objectExists(item);
      });
      // Filter them
      var originalSelection = Selection.get();

      // Set selected items
      Selection.set(newSelection);
      // Emit new event
      return P.emit('selection.change', {
        'from': originalSelection,
        'to': newSelection,
      }).then(P.next(objectNames));
    });

    // Listen on object property updates
    P.listen('object.setProperty', (function (spec) {
      ReprTools.getObject(spec.objectName).setProperty(
        ('time' in spec ? spec.time : this.T.time()),
        spec.propertyName,
        spec.value);
      return P.emit('trace.log',
        'Set property: ' + spec.objectName + '.' + spec.propertyName + ' = ' +
          spec.value).then(P.next(spec));
    }).bind(this));

    // Bind post-events
    P.listen('objects.added', (function (objData) {
      return P.emit('trace.log',
        'Created [' + objData.inst.type + '] object "' + objData.name + '"').then(
          P.emit('objects.select', objData.name)).then(
            P.next(objData));
    }).bind(this));
    P.listen('selection.change', (function (changes) {
      this._onSelect(changes.from, changes.to);
      return changes;
    }).bind(this));
  };

  Editor.prototype._bindKeyboard = function (P) {
    P.listen('global.keydown', (function (key) {
      if (key.input) {
        return key;
      }
      if (key.key === 'Delete') {
        if (Selection.count() === 0) {
          return key; // Nothing to remove
        }
        if (!confirm('You are about to remove ' + Selection.count() +
          ' items.\nAre you sure? (Action cannot be reversed)')) {
          return key;
        }
        return Selection.get().reduce(function (currentValue, objectName) {
          return currentValue.then(P.emit('objects.remove', objectName));
        }, Promise.resolve()).then(P.next(key));
      } else if (key.key === 'a' && key.ctrlKey) {
        return P.emit('objects.select', 
          ReprTools.allObjectNames()).then(P.next(key));
      } else if (key.key === 'ArrowUp' || key.key === 'ArrowDown' ||
        key.key === 'ArrowLeft' || key.key === 'ArrowRight') {

        // TODO: allow fine grained movement
        return key;
      } else {
        return key;
      }
    }).bind(this));
  };

  Editor.prototype.bind = function (P) {
    if (this._isBound) {
      throw new Error('Cannot bind an editor more than once');
    }
    this.P = P;

    // Bind the keyboard
    this._bindKeyboard(P);
    // Bind the object actions
    this._bindObjectActions(P);
    // Bind the playback events
    this._bindPlayback(P);
    // Bind the buttons and queue up the renderer
    this._bindToolButtons(P);
    // Bind the config buttons
    this._bindConfigButtons(P);

    P.listen('reset.editor', function () {
      return Promise.all([
        P.emit('reset.editor.tools'),
        P.emit('reset.editor.canvas.background'),
      ]);
    });

    // Bind the work area
    P.bind(this._workArea, 'mousedown', 'editor.work-area.down');
    P.bind(this._workArea, 'mouseup', 'editor.work-area.up');
    P.bind(this._workArea, 'mouseleave', 'editor.work-area.leave');
    P.bind(this._workArea, 'mousemove', 'editor.work-area.move');

    P.listen('editor.work-area.down', this._onDown.bind(this));
    P.listen('editor.work-area.up', this._onUp.bind(this));
    P.listen('editor.work-area.leave', this._onLeave.bind(this));
    P.listen('editor.work-area.move', this._onMove.bind(this));

    this._isBound = true;
    P.listen('render.editor', (function () {
      return this._render(P).then(P.next());
    }).bind(this));
    return;
  };

  Editor.prototype._render = function (P) {
    return Promise.all([
      P.emit('tool.change', {
        'from': this.selectedTool,
        'to': this.selectedTool
      }),
      P.emit('reset.editor.canvas.background'),
      P.emit('reset.editor.canvas.perspective'),
    ]);
  };

  return Editor;
})();
