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
- BAS 弹幕（目前应该）可以静态编译成 GAS-S 弹幕定义（无需运行拍平）
    （无损：GAS静态语法功能目标是BAS超集）
- GAS-S 弹幕定义可以在一定情况下转译成 BAS 弹幕
    （有损：GAS静态语法功能目标是BAS的超集，BAS不支持的会在编译时被抛弃。）

无损转化次序：
BiliScript  &larr; Generic Animation Script  &larr;  Bilibili Animation Script

## 语法
GAS-S基础定义基于 JSON （POJO 对象)，方便各种平台进行导入。由于这个语法不需要进行动态解析，
整个动画都可以被静态分析和编译。

基础对象包括如下四个区：

### `objects` 对象
Objects 区由 JSON POJO（标准Object）表示，用来存储这条弹幕会显示的所有对象。键名（Key）为
对象的名字，键值（Value）为对象的定义。对象名大小写视为不同的对象，推荐使用 `camelCase` 命名
对象。

注意：原则对象名上只支持 `[a-zA-Z0-9-_@]` 这些符号。如使用之外的符号（如 `.,:|` 或汉字）
可能在一些系统上产生非预期的结果。有些系统会自动转换不合规的对象名到合规的对象名，另一些则可
能报错拒绝播放。

目前有如下几种类型对象：

- [TextObject](objects/TextObject.md) 文字对象
    - `Text` 普通文字
    - `RichText` 格式文字
    - `Button` 按钮 （注：按钮和文字对象没有本质区别，只有定义了
        [交互](InteractionHints.md) 才有实际按钮意义。同样，别的东西定义了交互也会变成按钮
        类似的东西。
- [SpriteObject](objects/SpriteObject.md) 图像对象
    - `Sprite` 空图像
    - `SVGSprite` SVG图像
    - `BinarySprite` 二进制位图
    - `AnimatedSprite` 动画图像
- [FrameObject](objects/FrameObject.md) 子舞台对象
    - `Frame` 子舞台
    - `Reference` 公共锚点

GAS-S弹幕至少应该有一个对象定义在此，否则视为空弹幕，解析器可以无视其余内容。有关 Objects 
特点可以参考 [Objects](Objects.md) 章节。

### `layers` 弹幕层
Layers 区由 JSON Array 表示。每一个元素都是一个“图像层”定义，依次从 **最低到最高层**。
较高的一层内的对象（object）总会在较低的一层之上。层之间还可定义覆盖模式。在 metadata
里可以定义不属于任何一层的 object 的显示模式。

示例：
````
[
    {
        "name": "default",
        "components": ["object1", "object2"]
    },
    {
        "name": "layer-1",
        "components": ["object3", "object4", "object5"]
    }
]
````

有关层的概念介绍请参考 [Layers](Layers.md) 章节。注：默认来讲所有 GAS 弹幕都需要有至少一个
层，否则不会显示任何对象。在元信息中可以定义无 Layer 策略来绕开这个限制 （虽然未必被所有
平台支持）。

### `animation` 动画信息
Animation 区由 JSON POJO 表示。包括如下值段：

- `groups`: `{}` 动画小组。可选。在解析时，对小组的操作会被拍平到单个对象上
  （如：小组平移会拍平到每个对象单独平移。对象内自定义的动画会覆盖 group 动画。） 由于这个功能
  不是必要的，很多 IDE 会直接把动画编译到对象内，不输出 groups。
- `anchors`: `[]` 关键帧锚点，具体需要参考 [Animation Anchors](Animation.md#Anchors)
  章节。

Animation区可以为空，那样则表示整个 GAS-S 弹幕是静态高级弹幕。有关细节请参考 
[Animation](Animation.md) 章节。

### `metadata` 元信息
元信息定义了许多整个动态弹幕的全局信息，和一些情况的处理参数。原则上元信息是可选的，不过由于
经常有关键信息，所以这个区域还是很重要的。这个信息区由 JSON POJO 表示。常见如下字段：

- `animation` 动画设置
    - `duration` 弹幕长度
    - `legacy` 渲染模式提示。`true` 时提示渲染软件采用传统渲染，否则部分动画可能会被系统
      采取 CSS 加速，然后可能在有的浏览器下不work。。。
- `layers` 层设置
    - `orphans` 如何处理不在任何层的对象。默认 `hide`。
- `interactions` 交互信息

有关常见的 Metadata 字段，可以参考 [Metadata](Metadata.md)

## 拍平语法 Flat Syntax
由于深层嵌套 JSON 对象比较尴尬，GAS-S还支持简写语法（拍平语法），比如在定义对象时，可以不用
进行嵌套而使用类似下面的语法：
````
{
  "type": "SomeType",
  "position.x": 10,
  "position.y": 10,
  "size.width": 100,
  "font.family": "I love fonts!"
}
````
或
````
{
  "objects: {
    "MyObject.type": "text",
    "MyObject.content": "blah blah"
  }
}
````

拍平语法可用于任何非四个根区域的部分（所以不会出现 `objects.a.b`），而且可以代替任何地方缩略：

````
{
  "a.b.c": {
    "d.f": {}
    "e": 1
  }
}
````

简易语法文件需要在载入前设定解析模式为简易模式，但是应该可以被各个系统接受。注意：由于重复字段，
拍平的语法未必总比标准嵌套语法简洁，不过在一些地方比较方进行维护。