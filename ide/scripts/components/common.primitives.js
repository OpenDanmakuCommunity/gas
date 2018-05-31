var Primitives = (function () {
  var Primitives = {};

  var Color = function () {
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 1;
  }

  Color.prototype.fromRgba = function (r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = (typeof a === 'number') ? a : 1;
  };

  Color.prototype.fromNumber = function (rgb) {
    this.r = (rgb>>16) &0x0ff;
    this.g = (rgb>>8)  &0x0ff;
    this.b = (rgb)     &0x0ff;
  };

  Color.prototype.fromString = function (rgbStr) {
    if (rgbStr.indexOf('#') === 0) {
      var str = rgbStr.substring(1);
      if (str.length === 3) {
        str = str.replace(new RegExp('(.)(.)(.)', 'g'), '$1$1$2$2$3$3');
      }
      this.fromNumber(parseInt(str, 16));
    } else if (rgbStr.indexOf('rgb(') === 0) {
      var str = rgbStr.substring(4);
      var nums = str.substring(0, str.length - 1).split(',').map(function (num) {
        return parseInt(num, 10);
      });
      this.fromRgba(nums[0], nums[1], nums[2]);
    } else if (rgbStr.indexOf('rgba(') === 0) {
      var str = rgbStr.substring(5);
      var nums = str.substring(0, str.length - 1).split(',').map(function (num) {
        return parseFloat(num, 10);
      });
      this.fromRgba(nums[0], nums[1], nums[2], nums[3]);
    } else {
      throw new Error('Unrecognized color format');
    }
  };

  Color.prototype.setAlpha = function (alpha) {
    this.a = alpha;
  };

  Color.prototype.toNumber = function () {
    return ((this.r & 0x0ff) << 16)|((this.g & 0x0ff) << 8)|(this.b & 0x0ff);
  };

  Color.prototype.toString = function (notation) {
    if (this.a === 1 || notation === 'hash') {
      // Use hash notation
      var color = this.toNumber().toString(16);
      while (color.length < 6) {
        color = '0' + color;
      }
      return '#' + color;
    } else {
      return 'rgba(' +
        this.r + ',' + this.g + ',' + this.b + ',' + this.a + ')';
    }
  };


  Primitives.Color = Color;
  return Primitives;
})();
