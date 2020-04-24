# Objects 对象
````JSON
{
  "[name]": {
    "type": "[type]"
  }
}
````

GAS对象列表由普通POJO（键值型）对象定义，键对应对象名称，值则为对象定义。由于是映射型对象，
合法的定义不会出现重名对象。

## 对象名称 `[name]`
原则对象名上只支持 `[a-zA-Z0-9-_@]` 这些符号。如使用之外的符号（如 `.,:|` 或汉字）
可能在一些系统上产生非预期的结果。有些系统会自动转换不合规的对象名到合规的对象名，另一些则可
能报错拒绝播放。

## 对象类型 `type`
所有对象定义都必须包括该键值。这个值定义了对象的类型，用于本质上决定如何渲染对象。由于GAS弹幕
的平台支持有所不同，支持的对象类型也有所不同。这里我们将只会简单介绍默认实现下支持的对象。

目前默认实现支持如下几种类型对象：
- [TextObject](TextObject.md) 文字对象
    - `Text` 普通文字
    - `RichText` 格式文字
    - `Button` 按钮 （注：按钮和文字对象没有本质区别，只有定义了
        [交互](../InteractionHints.md) 才有实际按钮意义。同样，别的东西定义了交互也会变
        成按钮类似的东西。
- [SpriteObject](SpriteObject.md) 图像对象
    - `Sprite` 空图像
    - `SVGSprite` SVG图像
    - `BinarySprite` 二进制位图
    - `AnimatedSprite` 动画图像
- [FrameObject](FrameObject.md) 子舞台对象
    - `Frame` 子舞台
    - `Reference` 公共锚点
