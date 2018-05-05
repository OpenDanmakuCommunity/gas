# Generic Animation Script (Static) 通用动画语法（静态）
GAS静态语法（之后称作GAS-S）为“定义型”语法，也就是说整个弹幕的生存周期的动作都是被预先定义
的“无状态”动画。**给出静态语法的对象定义和目前生存时间可以唯一的渲染出屏幕状态。**

大部分高级弹幕都可以通过 GAS 静态语法进行表述，包括很多本身不需要状态的 BiliScript
（原版 Bilibili 代码弹幕语法）都可以通过运行编译到固定的静态定义。新的 BAS 语法也可以编译
成无损的 GAS 定义。

参考如下限制：
- BiliScript 可以通过在某个运行时运行然后“拍平”渲染成 GAS-S 定义
    （有损：会失去交互相关功能 和 基于播放器状态的功能）
- GAS-S 弹幕可以通过 “GAS 兼容库” 在兼容传统 BiliScript 引擎中运行
    （无损：但是需要 Runtime 有图片支持，如 Bitmap，来支持图片相关的 GAS 功能）
- BAS 弹幕（目前）可以静态编译成 GAS-S 弹幕定义（无需运行拍平）
    （无损：GAS静态语法功能是BAS超集）
- GAS-S 弹幕定义可以在一定情况下转译成 BAS 弹幕
    （有损：GAS静态语法功能目前是BAS的超集，BAS不支持的会在编译时被抛弃。）

无损转化次序：
BiliScript  &larr; Generic Animation Script  &larr;  Bilibili Animation Script

## 语法
GAS-S基础定义基于 JSON 对象，方便各种平台进行导入。基础对象包括如下四个区：

### `objects`
Objects区由 JSON POJO（标准Object）表示，用来存储这条弹幕会显示的所有对象。key为对象的名字
value为对象的定义。

目前有如下几种类型对象：

- TextObject 文字对象
    - `Text`
    - `RichText`
- SpriteObject 小图像对象
    - `SVGSprite`
    - `BinarySprite`
    - `AnimatedSprite`
- FrameObject 子舞台对象
    - `Frame`
    - `Reference`

GAS-S弹幕至少应该有一个对象定义在此，否则视为空弹幕。

### `layers`
Layers区由 JSON Array 表示。每一个元素都是一个“图像层”定义，依次从最低到最高层。较高的一
层内的对象（object）总会在较低的一层之上。层之间还可定义覆盖模式。在metadata里可以定义不属于
任何一层的 object 的显示模式。

示例：
````
[
    {
        "name": "layer-0",
        "components": ["object1", "object2"]
    },
    {
        "name": "layer-1",
        "components": ["object3", "object4", "object5"]
    }
]
````

### `animation`
Animation区由 JSON POJO 表示。包括如下值段：

- `groups`: {} 动画小组
- `anchors`: [] 关键帧锚点

Animation区可以为空，那样表示整个 GAS-S弹幕是静态弹幕

### `metadata`
其余信息
