# Sprite 绘图对象
绘图对象表示一个基于图像的弹幕。不同的系统可以根据图像定义进行不同的操作。由于图像属于高级弹幕，
有些播放器处于安全性和技术上完全不支持（如 BAS 只支持 `SVGSprite` 的基于path的一部分）。

有关 Sprite 的具体属性，可以参考[总属性目录](Properties.md)。以下几个章节我们会具体介绍
Sprite 的 `content` 字段的实现。

## 根类型 Base class
````JSON
{
  "type": "Sprite",
  "alt": "This is a sprite with nothing in it",
  "content": null
}
````

根类型的绘图对象不包括任何内容，在渲染时不会产生可视的效果，但是参与布局。其中 `alt` 字段可以
用来提供图片的 `alt text` 以便于读屏软件等实用，该字段未必所有渲染源都支持。

## 子类型 Subclasses
不同类型的 Sprite 子类的 `type` 参数会不同，主要包括如下三类：

- [AnimatedSprite](Sprites/AnimatedSprite.md)
- [BinarySprite](Sprites/BinarySprite.md)
- [SVGSprite](Sprites/SVGSprite.md)

这些 Sprite 子类主要区别在于 `content` 字段内的内容格式。在分别各自的文档种会有具体说明。

### 常规信息 Shared Information
在各种子类 Sprite 的 `content` 字段下，都会允许包括如下元信息。这些信息不参与渲染过程，但是
方便作者进行内容的追踪。以 `__` 开头的字段会被忽略，许多这样的字段也会以 `__` 结尾，
虽然后者不是必要的。

- `__author__` 作者信息，可包含用于寻找作者的信息和著作权信息。
- `__desc__` 描述，用于描述图像的信息，不参与渲染或可视化或无障碍功能，可能被编辑IDE使用。
