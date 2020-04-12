# Properties 属性
每个舞台对象都拥有一系列属性可以调整对象的显示方式。这里列出了所有这些属性

## 共通 Shared Properties
共通属性在每一个Object上都可以使用，主要包括定位相关的属性。

### `position.x` &lt;number&gt; = `0`
位置 x 坐标。单位 `px`。

### `position.y` &lt;number&gt; = `0`
位置 y 坐标。单位 `px`。

### `position.anchor` &lt;tuple.number&gt; = `(0, 0)`
对象锚点。`(0, 0)` 为左上角，`(1, 1)` 为右下。取值不在 `[0, 1]`区间时未定义，
平台可采取不同渲染方式。

### `position.axis` &lt;enum&gt; = `top-left`
坐标轴行进方向。单选enum，取值如下：
- `top-left` 坐标原点在左上，锚点的 `x = left, y = top`
- `top-right` 坐标原点在右上，锚点的 `x = right, y = top`
- `bottom-left` 坐标原点在左下，锚点的 `x = left, y = bottom`
- `bottom-right` 坐标原点在右下，锚点的 `x = right, y = bottom`

### `size.width` &lt;number&gt; = `null`
对象宽度。单位 `px`。为 `null` 时自动按照默认大小。

### `size.height` &lt;number&gt; = `null`
对象高度。单位 `px`。为 `null` 时自动按照默认大小。

### `transform.scale` &lt;number&gt; = `1`
缩放比例。无单位，负数无效。

### `transform.rotX` &lt;number&gt; = `0`
X 轴旋转。单位 `deg`。

### `transform.rotY` &lt;number&gt; = `0`
Y 轴旋转。单位 `deg`。

### `transform.rotZ` &lt;number&gt; = `0`
Z 轴旋转。单位 `deg`。

### `opacity` &lt;number&gt; = `1`
不透明度。无单位。取值 `0-1`。

### `visible` &lt;enum&gt; = `false`
对象是否可见。单选enum。取值 `true` 或 `false`

### `interaction.list` &lt;string.list&gt; = `""`
交互模式，参考 [InteractionHints章节](../InteractionHints.md)

### `interaction.fallback` &lt;string.list&gt; = `""`
交互模式回退，参考 [InteractionHints章节](../InteractionHints.md)

## 类型可变 Variable Type
类型可变属性在不同的对象上可以采取不同的值。

### `content` &lt;?&gt;
- `Text`, `Button`: string 类型。其中输入 `\n` 会被替换成换行。
- `RichText`: list<text>。定义为一个数组，其中可以放 string （会变成 text node）或者
类似 Text对象的定义（只包括 `font.*, content`，会变成 `span`）和 `{}` 会变成 `br`。
- `BinarySprite`, `AnimatedSprite`: image 对象。参考
[SpriteObject](SpriteObject.md)
- `SVGSprite`: svg 对象。参考 [SpriteObject](SpriteObject.md)
- `Frame`, `Reference`: 不可用。会被无视。

## 文字 Text Formatting
文字相关。这些属性只适用于文字类对象 (TextObject)，包括 `Text, Button`。注：`RichText`
的这类属性会在 `content` 内的部分单元重新定义，这些值只用作默认值。

### `font.size` &lt;number&gt; = `25`
字体大小。单位 `px`。

### `font.decoration` &lt;enum.multi&gt; = `outline,`
字体装饰。多选enum包括如下值：
- `bold` 加粗
- `italic` 斜体
- `underline` 下划线
- `overline` 上划线
- `line-through` 删除线
- `shadow` 阴影
- `outline` 描边

### `font.family` &lt;string&gt; = `""`
字体名称。多个字体可以用 `,` 分隔。默认未给出时采取平台默认值
（在 IDE 里面平台默认为 `SimHei, SimSun, Heiti, "MS Mincho", "Meiryo",
"Microsoft YaHei", monospace`）

### `font.color` &lt;color&gt; = `rgb(0xff, 0xff, 0xff)`
文字颜色。为颜色对象。在实际 JSON 中以数字形式表示 `0xRRGGBB`。在IDE中可以采取如下格式：

- `"#RRGGBB"`, `#RGB`
- `1666667`
- `rgba(R,G,B,A)`
- `rgb(R,G,B)`
- `hsv(h,s,v)`

### `font.orientation` &lt;number&gt; = `horizontal-tb`
文字排列方式。单选enum包括如下值：
- `horizontal-tb` 文字横排，多行从上向下（RTL/LTR 文字进行方向根据平台定义）
- `vertical-rl` 文字竖排，多行从右向左（用于东亚文字排版）
- `vertical-lr` 文字竖排，多行从左向右（？总之可以用）

具体渲染参考 CSS3 `writing-mode`。注意：更改 `font.orientation` 会相应更改一些 margin
和 padding 信息。在定位时一定要多加留意。如需精确定位，还是建议使用单字的文字区或图像。

## 图像 Sprite
图像相关。其中 `image.*` 只适用于 `BinarySprite` 和 `AnimatedSprite`，相对 `svg.*` 只
适用于 `SVGSprite`。

### `image.position` &lt;tuple.enum&gt; = `(center, center)`
图像位置对齐。双单选enum定义锚点，分别为
(`top | bottom | center`, `right | left | center`)。

默认图像居中。此属性参考 CSS 的 `background-position` 用法。

### `image.repeat` &lt;enum&gt; = `no-repeat`
图像重复。单选enum：
- `no-repeat` 不重复
- `repeat-x` 沿 X 轴平铺
- `repeat-y` 沿 Y 轴平铺
- `repeat` 全面平铺

此属性参考 CSS 的 `background-repeat` 用法。

### `image.stretchMode` &lt;enum&gt; = `contain`
图像拉伸模式。单选enum：
- `contain` 保持长宽比，显示整个图片。对应 `background-size: contain`
- `cover` 保持长宽比，充满整个 Sprite 空间。对应 `background-size: cover`
- `fill` 无视长宽比，充满整个 Sprite空间。对应 `background-size: 100% 100%`
- `crop` 不缩放图片，超出部分剪裁。对应 `background-size: auto`

## 容器 Frame
容器相关。这些属性只适用于 `Frame`。

### `frame.overflow` &lt;enum&lt; = `hidden`
子舞台对象溢出处理方式。单选enum:
- `hidden` 隐藏溢出部分
- `show` 显示溢出部分

### `children` &lt;string.list&lt; = ``
子舞台对象的子对象名称。
