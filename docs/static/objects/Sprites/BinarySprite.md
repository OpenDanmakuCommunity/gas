# 位图图形 BinarySprite
Example 示例:
````JSON
{
  "type": "BinarySprite",
  "content": {
    "type": "image/png",
    "data": "...",
    "encoding": "base64"
  }
}
````

## `image.position`
图像位置对齐。双单选enum定义锚点，分别为
(`top | bottom | center`, `right | left | center`)。

默认图像居中。此属性参考 CSS 的 `background-position` 用法。

## `image.repeat`
图像重复。单选enum：
- `no-repeat` 不重复
- `repeat-x` 沿 X 轴平铺
- `repeat-y` 沿 Y 轴平铺
- `repeat` 全面平铺

此属性参考 CSS 的 `background-repeat` 用法。

## `image.stretchMode`
图像拉伸模式。单选enum：
- `contain` 保持长宽比，显示整个图片。对应 `background-size: contain`
- `cover` 保持长宽比，充满整个 Sprite 空间。对应 `background-size: cover`
- `fill` 无视长宽比，充满整个 Sprite空间。对应 `background-size: 100% 100%`
- `crop` 不缩放图片，超出部分剪裁。对应 `background-size: auto`

## `content` 内容
### `content.type` 位图类型
位图类型基于 MIME 文件类型，其中 BinarySprite 支持以下几种：
- `image/png`
- `image/jpeg`
- `image/x-canvas+json`* 未必被所有平台支持。
- `image/svg+xml`* （注意：由于 SVG 当作位图时可以嵌入动态信息，如外链图片等，在很多环境下
出于安全考虑，有些播放器可能禁止使用。保证兼容性的话，可转换为 JSON 形式用
[SVGSprite](SVGSprite.md) 显示）

实际可用的 `content-type` 不止本列表中所列举的。很多情况下，如果播放器支持该`mime` 类型
则有很大可能性可以显示。不过值得注意的是，播放器未必保障支持列表种任意一个或多个类型。

### `content.data` 编码后的图像数据
图像数据。由于多数情况下为二进制数据，常见的一般采用 base64 等编码格式进行编码。

### `content.encoding` 编码格式
处于大多数播放器支持所限，原则上默认只支持 `""`（空） 和 `"base64"`。有一些平台可能支持其它
的编码格式。
