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
## `content.type` 位图类型
位图类型基于 MIME 文件类型，其中 BinarySprite 支持以下几种：
- `image/png`
- `image/jpeg`
- `image/x-canvas+json`* [JSON编码的Canvas绘图命令](CanvasJsonImage.md)。
未必被所有平台支持。
- `image/svg+xml`* （注意：由于 SVG 当作位图时可以嵌入动态信息，如外链图片等，在很多环境下
出于安全考虑，有些播放器可能禁止使用。保证兼容性的话，可转换为 JSON 形式用 SVGSprite 显示）

理论上任何浏览器可以显示的位图都可以支持，播放器和平台可以自行选择是否支持。

## `content.data` 编码后的图像数据
图像数据。一般采用 base64 等编码。

## `content.encoding` 编码格式
默认只支持 `""`（空） 和 `"base64"`。
