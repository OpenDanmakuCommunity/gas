# Sprite 绘图对象
绘图对象表示一个基于图像的弹幕。不同的系统可以根据图像定义进行不同的操作。由于图像属于高级弹幕，
有些播放器处于安全性和技术上完全不支持（如 BAS 只支持 `SVGSprite` 的基于path的一部分）。

有关 Sprite 的具体属性，可以参考[总属性目录](Properties.md)。以下几个章节我们会具体介绍
Sprite 的 `content` 字段的实现。

## 位图图形 BinarySprite
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
### `content.type` 位图类型
位图类型基于 MIME 文件类型，其中 BinarySprite 支持以下几种：
- `image/png`
- `image/jpeg`
- `image/x-canvas+json`* [JSON编码的Canvas绘图命令](CanvasJsonImage.md)。
未必被所有平台支持。
- `image/svg+xml`* （注意：由于 SVG 当作位图时可以嵌入动态信息，如外链图片等，在很多环境下
出于安全考虑，有些播放器可能禁止使用。保证兼容性的话，可转换为 JSON 形式用 SVGSprite 显示）

理论上任何浏览器可以显示的位图都可以支持，播放器和平台可以自行选择是否支持。

### `content.data` 编码后的图像数据
图像数据。一般采用 base64 等编码。

### `content.encoding` 编码格式
默认只支持 `""`（空） 和 `"base64"`。

## 动画图形 AnimatedSprite
动画绘图对象用于在Sprite里面播放动画。这样可以极大简化很多复杂的高级弹幕。不过由于安全策略，
对这一类型的Sprite可能支持有限。

### 帧列表 Frame List
````JSON
{
  "type": "AnimatedSprite",
  "content": {
    "type": "frames",
    "frames": [
      {"type": "svg", "children": []},
      {"type": "image/png", "data": "...", "encoding": ""}
    ]
  },
  "frame": 0
}
````

### `frame` 帧位置
用于在时间轴里面动画使用，支持渐变。取值在 `[0, # frames]`。

## SVG图像 SVGSprite
Example 示例:
````JSON
{
    "type": "SVGSprite",
    "content": {
        "type": "svg",
        "children": [
            {
                "type":"rect",
            },
            {
                "type":"circle",
            },
            {
                "type":"ellipse",
            },
            {
                "type":"line",
            },
            {
                "type":"polyline",
            },
            {
                "type":"polygon",
            },
            {
                "type":"path",
            }
        ]
    }
}
````
