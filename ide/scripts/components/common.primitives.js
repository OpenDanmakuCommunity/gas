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

  Color.prototype.fromHsva = function (hue, saturation, brightness, a) {
    var r, g, b;
    if (saturation == 0) {
      r = g = b = 1;
    } else {
      var h = (hue % 360) / 60;
      var i = h | 0;
      var f = h - i;
      var p = 1 - saturation;
      var q = 1 - saturation * f;
      var t = 1 - saturation * (1 - f);
      switch (i) {
        case 0: r = 1; g = t; b = p; break;
        case 1: r = q; g = 1; b = p; break;
        case 2: r = p; g = 1; b = t; break;
        case 3: r = p; g = q; b = 1; break;
        case 4: r = t; g = p; b = 1; break;
        case 5: r = 1; g = p; b = q; break;
      }
    }
    r *= 255 * brightness;
    g *= 255 * brightness;
    b *= 255 * brightness;
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = (typeof a === 'number') ? a : 1;
  };

  Color.prototype.fromNumber = function (rgb) {
    this.r = (rgb>>16) &0x0ff;
    this.g = (rgb>>8)  &0x0ff;
    this.b = (rgb)     &0x0ff;
    this.a = 1;
  };

  Color.prototype.fromString = function (colorStr) {
    colorStr = colorStr.trim().toLowerCase();
    if (colorStr.indexOf('#') === 0) {
      var str = colorStr.substring(1);
      if (str.length === 3) {
        str = str.replace(new RegExp('(.)(.)(.)', 'g'), '$1$1$2$2$3$3');
      }
      this.fromNumber(parseInt(str, 16));
    } else if (colorStr.indexOf('rgb(') === 0) {
      var str = colorStr.substring(4);
      var nums = str.substring(0, str.length - 1).split(',').map(function (num) {
        return parseInt(num, 10);
      });
      this.fromRgba(nums[0], nums[1], nums[2]);
    } else if (colorStr.indexOf('rgba(') === 0) {
      var str = colorStr.substring(5);
      var nums = str.substring(0, str.length - 1).split(',').map(function (num) {
        return parseFloat(num, 10);
      });
      this.fromRgba(nums[0], nums[1], nums[2], nums[3]);
    } else if (colorStr.indexOf('hsl(') === 0) {
      var str = colorStr.substring(4);
      var nums = str.substring(0, str.length - 1).split(',').map(function (num) {
        num = num.trim()
        if (num.endsWith('%')) {
          return parseFloat(num.substring(0, num.length - 1)) / 100;
        } else {
          return parseFloat(num);
        }
      });
      var h = nums[0], s_hsl = nums[1], l = nums[2];
      var v = l + s_hsl * Math.min(l, 1 - l);
      var s_hsv = (v === 0) ? 0 : (2 - 2 * l / v);
      this.fromHsva(h, s_hsv, v);
    } else if (colorStr.indexOf('hsla(') === 0) {
      var str = colorStr.substring(5);
      var nums = str.substring(0, str.length - 1).split(',').map(function (num) {
        num = num.trim()
        if (num.endsWith('%')) {
          return parseFloat(num.substring(0, num.length - 1)) / 100;
        } else {
          return parseFloat(num);
        }
      });
      var h = nums[0], s_hsl = nums[1], l = nums[2];
      var v = l + s_hsl * Math.min(l, 1 - l);
      var s_hsv = (v === 0) ? 0 : (2 - 2 * l / v);
      this.fromHsva(h, s_hsv, v, nums[3]);
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

  Color.prototype.toRgba = function () {
    return [this.r, this.g, this.b, this.a];
  };

  Color.prototype.toHsva = function () {
    var sr = this.r / 255, sg = this.g / 255, sb = this.b / 255;
    var smax = Math.max(sr, sg, sb), smin = Math.min(sr, sg, sb);
    var delta = smax - smin;
    var h = 0;
    if (delta > 0) {
      if (smax === sr) {
        h = 60 * ((sg - sb) / delta);
      } else if (smax === sg) {
        h = 60 * (2 + (sb - sr) / delta);
      } else if (smax === sb) {
        h = 60 * (4 + (sr - sg) / delta);
      }
    }
    h = h < 0 ? (h + 360) : h;
    var s = (smax === 0) ? 0 : (delta / smax);
    var v = smax;
    return [h, s, v, this.a];
  };

  Color.prototype.serialize = function () {
    return this.toNumber();
  };

  Color.prototype.clone = function () {
    var color = new Color();
    color.fromRgba(this.r, this.g, this.b, this.a);
    return color;
  };

  Color.fromNumber = function (num) {
    var color = new Color();
    color.fromNumber(num);
    return color;
  };

  Color.fromString = function (str) {
    var color = new Color();
    color.fromString(str);
    return color;
  };

  Color.from = function (thing) {
    if (typeof thing === 'string') {
      return Color.fromString(thing);
    } else if (typeof thing === 'number') {
      return Color.fromNumber(thing);
    } else {
      throw new Error('Unknown color format');
    }
  };

  Primitives.Color = Color;
  return Primitives;
})();
