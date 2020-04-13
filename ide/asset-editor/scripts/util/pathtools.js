var PathTools = (function () {
  function _tokenize (pathString) {
    return pathString.split(' ').reduce(function (acc, cur) {
      return acc.concat(cur.split(','));
    }, []).map(function (item) {
      var fl = parseFloat(item);
      return isNaN(fl) ? item : fl;
    });
  }

  var PathTools = new function () {
    /**
     * Transforms a list of paths of the same object into an interpolated expression
     */
    this.pathsToInterpolated = function (dArray) {
      if (!Array.isArray(dArray) || dArray.length < 1) {
        throw new Error('Need to provide an array of d-strings');
      }
      dArray = dArray.map(function (dString) { return _tokenize(dString); });
      var head = dArray[0], rest = dArray.slice(1);
      var tokensV = [];
      head.forEach(function (startVal) {
        tokensV.push([startVal]);
      });
      rest.forEach(function (d) {
        if (d.length !== tokensV.length) {
          throw new Error('Mismatched paths!');
        }
        for (var i = 0; i < tokensV.length; i++) {
          tokensV[i].push(d[i]);
        }
      });// Verticalize
      return tokensV.map(function (tok) {
        // Collapse constant values
        if (tok.every(function (t) {return t === tok[0];})) {
          return tok[0];
        } else {
          return tok;
        }
      }).map(function (tok) {
        return Array.isArray(tok) ? {
          'type': 'interpolate-linear',
          'on': '$t',
          'src': tok
        } : tok;
      });
    };

    /**
     * Makes all relative coordinates absolute
     */
    this.toAbsolute = function (d) {
      var tokens = _tokenize(d), newTokens = [];
      var x = 0, y = 0, next = null;
      tokens.forEach(function (tok) {
        if (typeof tok === 'string') {
          // This is a command
          if (tok === 'z' || tok === 'Z') {
            newTokens.push(tok);
          } else if (tok === tok.toUpperCase()) {
            next = 'absX';
            newTokens.push(tok);
          } else {
            next = 'relX';
            newTokens.push(tok.toUpperCase());
          }
        } else if (next === 'absX') {
          x = tok;
          next = 'absY';
        } else if (next === 'absY') {
          y = tok;
          newTokens.push(x);
          newTokens.push(y);
          next = 'absX';
        } else if (next === 'relX') {
          x += tok;
          next = 'relY';
        } else if (next === 'relY') {
          y += tok;
          newTokens.push(x);
          newTokens.push(y);
          next = 'relX';
        }
      });
      return newTokens.join(' ');
    };
  }
  return PathTools;
})();
