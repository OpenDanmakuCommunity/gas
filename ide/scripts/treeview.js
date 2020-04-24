var TreeView = (function () {
  function TNode(item, dom) {
    this.item = item;
    this.dom = dom;
  }

  function TreeView(dom) {
    this._dom = dom;
    this._hover = null;
    this._click = null;
    this._base = [];
  }

  TreeView.prototype._recursiveBuild = function (treelike, dom) {
    return treelike.children().map((function (child) {
      var childDesc = this._recursiveBuild(child);
      var childDom = _Create('li', {});

      if (childDesc.length > 0) {
        var childLabel = _Create('span', {
          'className': 'branch'
        },[ _Create('text', child.toString()) ]);
        var descDom = _Create('ul', {
          'className': 'nested'
        });
        childDesc.forEach(function (tnode) {
          descDom.appendChild(tnode.dom);
        });
        childDom.appendChild(childLabel);
        childDom.appendChild(descDom);
        childLabel.addEventListener('click', (function (desc, label) {
          return (function () {
            console.log(desc);
            if (desc.className === 'nested') {
              desc.className = 'active';
              label.className = 'branch down';
            } else {
              desc.className = 'nested';
              label.className = 'branch';
            }
          }).bind(self);
        })(descDom, childLabel));
      } else {
        var childLabel = _Create('span', {
          'className': 'leaf'
        },[ _Create('text', child.toString()) ]);
        childDom.appendChild(childLabel);
      }
      childLabel.addEventListener('click', (function (c, self) {
        return (function () {
          if (this._click !== null) {
            this._click(c);
          }
        }).bind(self);
      })(child, this));
      childLabel.addEventListener('mouseenter', (function (c, self) {
        return (function () {
          if (this._hover !== null) {
            this._hover('enter', c);
          }
        }).bind(self);
      })(child, this));
      childLabel.addEventListener('mouseleave', (function (c, self) {
        return (function () {
          if (this._hover !== null) {
            this._hover('leave', c);
          }
        }).bind(self);
      })(child, this));
      return new TNode(child, childDom);
    }).bind(this));
  }

  TreeView.prototype.load = function (treelike) {
    this._dom.innerHTML = '';
    // Build
    this._base = this._recursiveBuild(treelike, this._dom);
    this._base.forEach((function (tnode) {
      this._dom.appendChild(tnode.dom)
    }).bind(this));
  }

  TreeView.prototype.hover = function (listener) {
    this._hover = listener;
  }

  TreeView.prototype.click = function (listener) {
    this._click = listener;
  }

  return TreeView;
})();
