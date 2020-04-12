# Sprite 绘图对象
绘图对象表示一个基于图像的弹幕。不同的系统可以根据图像定义进行不同的操作。由于图像属于高级弹幕，
有些播放器处于安全性和技术上完全不支持（如 BAS 只支持 `SVGSprite` 的基于path的一部分）。

有关 Sprite 的具体属性，可以参考[总属性目录](Properties.md)。以下几个章节我们会具体介绍
Sprite 的 `content` 字段的实现。

## 根类型 Base class
````JSON
{
  "type": "Sprite",
  "content": null
}
````

根类型的绘图对象不包括任何内容，

## 子类型 Subclasses
