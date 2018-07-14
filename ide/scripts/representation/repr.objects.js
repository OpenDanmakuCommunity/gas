// Singleton factory
var GFactory = new function () {
  this.createFromSpec = function (name, spec) {
    switch (spec.type) {
      case 'Text':
      case 'RichText':
        return new GText(name, spec);
      case 'Button':
        return new GButton(name, spec);
      case 'Sprite':
      case 'SVGSprite':
      case 'AnimatedSprite':
      case 'BinarySprite':
        return new GSprite(name, spec);
      default:
        throw new Error('Spec had type ' + spec.type +
          ' but it was not recognized.');
    }
  };
};
