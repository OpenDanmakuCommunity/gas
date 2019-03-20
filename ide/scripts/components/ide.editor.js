var Editor = (function () {
  var DEFAULTS = {
    'text': {
      'type': 'Text',
      'position.axis': 'top-left',
      'transform.scale': 1,
      'transform.rotX': 0,
      'transform.rotY': 0,
      'transform.rotZ': 0,
      'opacity': 1,
      'visible': 'true',
      'font.decoration': ['outline'],
      'font.color': Primitives.Color.fromNumber(0xffffff),
      'font.orientation': 'horizontal-tb',
      'content': '(Text Here)',
    },
    'sprite': {
      'type': 'Sprite',
      'position.axis': 'top-left',
      'size.width': 1,
      'size.height': 1,
      'transform.scale': 1,
      'transform.rotX': 0,
      'transform.rotY': 0,
      'transform.rotZ': 0,
      'opacity': 1,
      'visible': 'true',
      'image.repeat': 'no-repeat',
      'image.stretchMode': 'contain',
    },
    'button': {
      'type': 'Button',
      'position.axis': 'top-left',
      'size.width': 1,
      'size.height': 1,
      'transform.scale': 1,
      'transform.rotX': 0,
      'transform.rotY': 0,
      'transform.rotZ': 0,
      'opacity': 1,
      'visible': 'true',
      'font.decoration': ['outline'],
      'font.color': Primitives.Color.fromNumber(0xffffff),
      'font.orientation': 'horizontal-tb',
      'content': 'Button Label',
    },
    'frame': {
      'type': 'Frame',
      'position.axis': 'top-left',
      'size.width': 1,
      'size.height': 1,
      'transform.scale': 1,
      'transform.rotX': 0,
      'transform.rotY': 0,
      'transform.rotZ': 0,
      'opacity': 1,
      'visible': 'true',
    },
  }

  /*** START EDITOR CLASS ***/
  var Editor = function (timer, workArea, canvas, workAreaConfigButtons) {
    if (!ReprTools || !Repr || !_Create || !Selection) {
      throw new Error('Environment not loaded correctly!');
    }
    this.T = timer;

    this.tools = ['select', 'draw', 'text', 'sprite', 'button', 'frame'];
    this.selectedTool = 'select';

    this._workArea = workArea;
    this._canvas = canvas;
    this._workAreaConfigButtons = workAreaConfigButtons;

    this._isBound = false;
    this._isPreviewMode = false;
    this._zoomFactor = 1;

    // Generate the tool _toolStates
    this._toolStates = {}
    for (var i = 0; i < this.tools.length; i++) {
      this._toolStates[this.tools[i]] = {
        'dragging': null,
        'moving': null,
        'box': null
      };
    }
    
    // Default the drawing attributes
    this._toolStates['draw']['attrs'] = {
      'stroke': '#000000',
      'stroke-width': 1,
      'stroke-linecap': '',
      'fill': 'none'
    };
    this._toolStates['draw']['mode'] = 'path';
  };

  Editor.prototype._translateOffsets = function (x, y) {
    var workAreaBox = this._workArea.getBoundingClientRect();
    return {
      'x': (x - workAreaBox.left + this._workArea.scrollLeft) / this._zoomFactor,
      'y': (y - workAreaBox.top + this._workArea.scrollTop) / this._zoomFactor,
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
    // General parameters for the event
    var cursor = this._translateOffsets(e.event.clientX, e.event.clientY);
    var targetName = null;
    var _target = e.event.target;
    while (_target !== this._canvas && _target !== this._workArea &&
      _target !== null) {

      if (_target.hasAttribute('ide-object-name')) {
        targetName = _target.getAttribute('ide-object-name');
        break;
      } else {
        _target = _target.parentElement;
      }
    }
    var toolState = this._toolStates[this.selectedTool];

    // Tool specific items.
    switch (this.selectedTool) {
      case 'draw':
        if (targetName !== null) {
          var type = ReprTools.getObjectType(targetName);
          if (type !== 'Sprite' && type !== 'SVGSprite') {
            // Can't draw on non-sprite
            return this.P.emit('trace.error',
              'Cannot use draw tool on non-SVG sprite!').then(this.P.next(e));
          }
          var sprite = ReprTools.getObject(targetName);
          var drawContext = sprite.getContext();

          if (drawContext !== null) {
            // Pass the tool attrs into the context 
            drawContext.recoverTool(toolState.mode);
            drawContext.recoverToolAttrs(toolState.attrs);
            toolState.drawContext = drawContext;
            toolState.taget = targetName;
            var canvasPos =
              this._canvasPosition(e.event.clientX, e.event.clientY);
            toolState.dragging = canvasPos;
            drawContext.initiate(
              canvasPos.x - sprite._pm.getProp('position.x'),
              canvasPos.y - sprite._pm.getProp('position.y'));
            return this.P.emit('object.setProperty', {
                'objectName': targetName,
                'time': this.T.time(),
                'propertyName': 'content',
                'value': drawContext,
              }).then(this.P.next(e));
          }
        }
        return e;
      case 'select':
        if (targetName !== null) {
          if (e.event.ctrlKey) {
            var newSelection = Selection.multiSelect(targetName, 'toggle');
            return this.P.emit('objects.select', newSelection).then(
              this.P.next(e));
          } else {
            if (Selection.isSelected(targetName)) {
              // Don't change selection
              toolState.moving = cursor;
              return e;
            } else {
              return this.P.emit(
                'objects.select',
                targetName).then((function (){
                  toolState.moving = cursor;
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
            if (toolState.box !== null && toolState.box.DOM !== null) {
                this._workArea.removeChild(toolState.box.DOM);
            }
            toolState.box = {
              'anchor': cursor,
              'drag': null,
              'DOM': null,
            };
          }).bind(this)).then(this.P.next(e));
        }
      case 'text':
      case 'sprite':
      case 'button':
      case 'frame':
        if (targetName !== null) {
          // Clicking on existing item
          if (ReprTools.objectExists(targetName) &&
            ReprTools.typeAsTool(ReprTools.getObjectType(targetName),
              this.selectedTool)) {
            // Same type as current tool, enter move mode

            return this.P.emit('objects.select', targetName).then(
              this.P.next(e));
          }
        }
        var position = this._canvasPosition(e.event.clientX, e.event.clientY);
        var objectBase = _deepCopy(DEFAULTS[this.selectedTool]);
        objectBase['position.x'] = position.x;
        objectBase['position.y'] = position.y;

        if (this.selectedTool === 'sprite' ||
          this.selectedTool === 'button' ||
          this.selectedTool === 'frame') {
          // Immediately resize
          toolState.dragging = this._translateOffsets(e.event.clientX,
            e.event.clientY);
        }

        var objectData = {
          'name': ReprTools.getUniqueName(objectBase.type),
          'spec': objectBase
        };

        return this.P.emit('objects.add', objectData).catch(function (err) {
            alert(err);
          }).then(this.P.next(e));
      default:
        return e;
    }
  };
  Editor.prototype._onUnset = function (e) {
    // Reset moving and dragging flags
    var toolState = this._toolStates[this.selectedTool];
    if (toolState.moving !== null) {
      // Move finished
      var time = this.T.time();
      Promise.all(Selection.get().map((function (object) {
        var x = ReprTools.getObject(object)._pm.getProp('position.x');
        var y = ReprTools.getObject(object)._pm.getProp('position.y');
        // Round
        x = Math.round(x);
        y = Math.round(y);
        return this.P.emit('object.setProperty', {
          'objectName': object,
          'time': time,
          'propertyName': 'position.x',
          'value': x
        }).then((function () {
          // only set the second after the first has completed
          return this.P.emit('object.setProperty', {
            'objectName': object,
            'time': time,
            'propertyName': 'position.y',
            'value': y
          });
        }).bind(this));
      }).bind(this))).then((function () {
        if (Selection.count() > 0) {
          return this.P.emit('properties.load', Selection.get());
        }
        return;
      }).bind(this));
      toolState.moving = null;
    }
    if (toolState.dragging !== null) {
      if (this.selectedTool === 'draw') {
        // Send the draw back into the context
        var canvasPos =
          this._canvasPosition(e.event.clientX, e.event.clientY);
        toolState.drawContext.release(
          canvasPos.x - toolState.dragging.x,
          canvasPos.y - toolState.dragging.y);
        toolState.drawContext.commit();
      } else {
        var time = this.T.time();
        Promise.all(Selection.get().map((function (object) {
          var width = ReprTools.getObject(object)._pm.getProp('size.width');
          var height = ReprTools.getObject(object)._pm.getProp('size.height');
          // Round
          width = Math.round(width);
          height = Math.round(height);
          return this.P.emit('object.setProperty', {
            'objectName': object,
            'time': time,
            'propertyName': 'size.width',
            'value': width
          }).then((function () {
            return this.P.emit('object.setProperty', {
              'objectName': object,
              'time': time,
              'propertyName': 'size.height',
              'value': height
            });
          }).bind(this));
        }).bind(this))).then((function () {
          if (Selection.count() > 0) {
            return this.P.emit('properties.load', Selection.get());
          }
          return;
        }).bind(this));
      }
      toolState.dragging = null;
    }
    if (toolState.box !== null && typeof toolState.box !== 'undefined') {
      if (toolState.box.DOM !== null) {
        this._workArea.removeChild(toolState.box.DOM);
      }
      toolState.box = null;
    }
  };
  Editor.prototype._onLeave = function (e) {
    this._onUnset(e);
  };
  Editor.prototype._onUp = function (e) {
    if (e.event.button !== 0) {
      return e;
    }
    this._onUnset(e);
  };
  Editor.prototype._onMove = function (e) {
    if (e.event.buttons !== 1) {
      return e; // No button down, skip event
    }
    var currentPosition = this._translateOffsets(e.event.clientX,
      e.event.clientY);
    var toolState = this._toolStates[this.selectedTool];
    if (this.selectedTool === 'select') {
      if (toolState.box !== null) {
        // Draw a select box
        toolState.box.drag = {
          'x': currentPosition.x,
          'y': currentPosition.y,
        };

        var tx = Math.min(toolState.box.drag.x, toolState.box.anchor.x);
        var ty = Math.min(toolState.box.drag.y, toolState.box.anchor.y);
        var bx = Math.max(toolState.box.drag.x, toolState.box.anchor.x);
        var by = Math.max(toolState.box.drag.y, toolState.box.anchor.y);
        if (toolState.box.DOM === null) {
          toolState.box.DOM = _Create('div', {
            'className': 'selection',
            'style': {
              'top':  ty + 'px',
              'left': tx + 'px',
              'width': (bx - tx) + 'px',
              'height': (by - ty) + 'px'
            }
          });
          this._workArea.appendChild(toolState.box.DOM);
        } else {
          toolState.box.DOM.style.top =  ty + 'px';
          toolState.box.DOM.style.left =  tx + 'px';
          toolState.box.DOM.style.width =  (bx - tx) + 'px';
          toolState.box.DOM.style.height = (by - ty) + 'px';
        }
        return e;
      } else if (toolState.moving) {
        var deltaX = currentPosition.x - toolState.moving.x;
        var deltaY = currentPosition.y - toolState.moving.y;
        ReprTools.callOnGroup(Selection.get(), '_move', deltaX, deltaY);
        toolState.moving = currentPosition;
        return e;
      }  else if (toolState.dragging) {
        var width = currentPosition.x - toolState.dragging.x;
        var height = currentPosition.y - toolState.draggingy;
        ReprTools.callOnGroup(Selection.get(), '_resize',
          this.T.time(), width, height);
        return e;
      } else {
        return e;
      }
    } else if (this.selectedTool === 'draw') {
      if (toolState.dragging) {
        var canvasPos =
          this._canvasPosition(e.event.clientX, e.event.clientY);
        toolState.drawContext.drag(
          canvasPos.x - toolState.dragging.x,
          canvasPos.y - toolState.dragging.y);
        toolState.drawContext.commit();
      }
    } else {
      if(toolState.dragging !== null) {
        var width = currentPosition.x - toolState.dragging.x;
        var height = currentPosition.y - toolState.dragging.y;
        ReprTools.callOnGroup(Selection.get(), '_resize',
          this.T.time(), width, height);
      }
      return e;
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
    var backgrounds = ['black', 'white', 'checkered'];
    for (var i = 0; i < backgrounds.length; i++) {
      var background = backgrounds[i];
      P.bind(this._workAreaConfigButtons.display[background], 'click',
        'editor.controls.background.' + background);
      P.listen('editor.controls.background.' + background, (function (bg) {
        return function (e) {
          return P.emit('editor.canvas.background.set', bg).then(
            P.next(e));
        };
      })(background));
    }

    P.listen('editor.canvas.background.set', (function (type) {
      if (backgrounds.indexOf(type) >= 0) {
        // Reset work area
        _ToggleClass(this._canvas, backgrounds, false);
        // Reset buttons
        _ToggleClass(backgrounds.map((function (name) {
            return this._workAreaConfigButtons.display[name];
          }).bind(this)), 'selected', false);
        _ToggleClass(this._canvas, type, true);
        
        // Select the buttons
        _ToggleClass(this._workAreaConfigButtons.display[type], 
          'selected', true);
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
    P.bind(this._workAreaConfigButtons.display.preview, 'click',
      'editor.canvas.previewMode.toggle');
    P.listen('editor.canvas.previewMode.toggle', (function () {
      this._isPreviewMode = !this._isPreviewMode;
      _ToggleClass(this._canvas, 'preview', this._isPreviewMode);
      _ToggleClass(this._workAreaConfigButtons.display.preview, 'selected',
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
    P.listen('editor.canvas.zoom.set', (function (zoom) {
      this._zoomFactor = zoom;
      this._canvas.style.zoom = '' + zoom;
      return zoom;
    }).bind(this));
    P.listen('editor.canvas.perspective.set', (function (perspective) {
      this._canvas.style.perspective = perspective;
      this._canvas.style.webkitPerspective = perspective;
      return perspective;
    }).bind(this));
  };

  Editor.prototype._bindDrawingButtons = function (P) {
    var modes = ['select', 'path', 'rect', 'ellipse'];
    for (var i = 0; i < modes.length; i++) {
      var mode = modes[i];
      P.bind(this._workAreaConfigButtons.drawing[mode], 'click',
        'editor.drawing.mode.' + mode);
      P.listen('editor.drawing.mode.' + mode, (function (modeName, self){
        return function (e) {
          _ToggleClass(modes.map((function (name) {
              return this._workAreaConfigButtons.drawing[name];
            }).bind(self)), 'selected', false);
          _ToggleClass(self._workAreaConfigButtons.drawing[modeName],
            'selected', true);
          return P.emit('tool.configure', {
            'toolName': 'draw',
            'attrName': 'mode',
            'value': modeName
          }).then(
            P.next(e));
        };
      })(mode, this));
    };
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
          }).then(P.next(e));
        }
      })(this, toolName));
    }
    // Add binding for changing class
    P.listen('tool.change', (function (tool) {
      this.selectedTool = tool.to;
      var btnToolFrom = $('tool-' + tool.from);
      var btnToolTo = $('tool-' + tool.to);
      _ToggleClass(btnToolFrom, 'selected', false);
      _ToggleClass(btnToolTo, 'selected', true);
      // Show or hide the drawing toolbar
      if (tool.to === 'draw') {
        _ToggleClass(this._workAreaConfigButtons.drawing.toolbar, 
          'hidden', false);
      } else {
        _ToggleClass(this._workAreaConfigButtons.drawing.toolbar, 
          'hidden', true);
      }
      return P.emit('trace.log','Change to tool ' + tool.to).then(
        P.next(tool));
    }).bind(this));
    P.listen('tool.configure', (function (config) {
      if (!(config.toolName in this._toolStates)) {
        this._toolStates[config.toolName] = {};
      }
      var toolConfig = this._toolStates[config.toolName];
      toolConfig[config.attrName] = config.value;
      return P.emit('trace.log', config.toolName + '.' + config.attrName + 
        '=' + config.value).then(P.next(config));
    }).bind(this));
    P.listen('reset.editor.tools', (function () {
      for (var i = 0; i < this.tools.length; i++) {
        _ToggleClass($('tool-' + this.tools[i]), 'selected', false);
      }
      return;
    }).bind(this));
  };

  Editor.prototype._bindPlayback = function (P) {
    P.listen('timeline.update', (function (time) {
      return time;
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

    // Listen on reorder events
    P.listen('objects.reflow', (function (spec) {
      if (spec.sourceLayer === spec.targetLayer) {
        var source = ReprTools.getObject(spec.source);
        var sourceParent = source.DOM.parentElement;
        sourceParent.insertBefore(source.DOM,
          spec.target === null ? null :
            ReprTools.getObject(spec.target).DOM);
      }
      return spec;
    }).bind(this));

    // Listen on object property updates
    P.listen('object.setProperty', (function (spec) {
      var time = 'time' in spec ? spec.time : this.T.time();
      return P.emit('object.provisionFrame', {
        'objectName': spec.objectName,
        'time': time,
        'propertyName': spec.propertyName
      }).then(function () {
        var object = ReprTools.getObject(spec.objectName);
        try {
          object.setProperty(time, spec.propertyName, spec.value);
        } catch (e) {
          return P.emit('trace.error', 'Set property: ' + spec.objectName +
            '.' + spec.propertyName + ' = ' + spec.value.toString() +
            ' failed.').then(
              function () {
                throw e;
              }).then(P.next(spec));
        }
        return P.emit('trace.log',
          'Set property: ' + spec.objectName + '.' + spec.propertyName + ' = ' +
            spec.value.toString()).then(P.emit('object.propertyUpdated', {
              'time': time,
              'objectName': spec.objectName,
              'propertyName': spec.propertyName,
              'value': spec.propertyValue
            }));
      }).then(P.next(spec));
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
        if (this.selectedTool === 'select') {
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
        } else {
          P.emit('trace.warn',
            'This tool does not support the delete action.');
          return key;
        }
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
    // Bind the drawing buttons
    this._bindDrawingButtons(P);

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
