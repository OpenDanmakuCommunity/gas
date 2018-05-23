# Sprite 绘图对象
绘图对象表示一个基于图像的弹幕。不同的系统可以根据图像定义进行不同的操作。由于图像属于高级弹幕，
有些播放器处于安全性和技术上完全不支持（如 BAS 只支持 `SVGSprite` 的基于path的一部分）。

有关 Sprite 的具体属性，可以参考[总属性目录](Properties.md)。以下几个章节我们会具体介绍
Sprite 的 `content` 字段的实现。

## 位图图形 BinarySprite
Example 示例:
````
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

### 基于位图动图 `content.type` = `image/gif`
Example 示例:
````
{
    "type": "AnimatedSprite",
    "content": {
        "type": "image/gif",
        "data": "...",
        "encoding": "base64"
    }
}
````
类似 BinarySprite，当 MIME 是 `image/gif` 是会自动导入为 `AnimatedSprite`。其次，由于
动画由图片控制，这种对象不支持倒放！

### 基于视频 `content.type` = `video/mp4`, `video/webm`, `video/ogg`*
类似 BinarySprite，有时可以把视频当作动画Sprite嵌入。

注意：此类型可能受到很多平台限制，比如：
- 不支持视频：安全策略禁止，不支持codec等
- 文件大小限制：因为data字段太大而不支持
- 倒放问题：可能不支持倒放
- 声音：如果在 Sprite 内使用视频，平台应当禁止该视频发出声音。

### 自定义位图 `content.type` = `frames/*`
以一系列关键帧定义图像，可以参考如下示例 Example:
````
{
    "type": "AnimatedSprite",
    "content": {
        "type": "frames/bitmap",
        "frames": [
            {
                "type": "image/png",
                "data": "...",
                "encoding": "base64"
                "isKeyFrame": true,
            }
        ],
        "fps": 10,
        "repeat": true,
    }
}
````

#### `content.fps` 帧率
定义动画帧率，图像会根据帧率依次切换，直到序列结束。

#### `content.repeat` 是否循环
动画是否一直循环还是只播一次。注意：AnimatedSprite的动画在弹幕开始播放后就立刻开始播放
（不管是否对象可见）。

#### `content.frames[?].isKeyFrame`
是否为关键帧。这个只在 `type = "image/x-canvas+json"` 时有效。当取 `false` 时，新的
命令将会在旧的Canvas图像上增进绘制。注意：过多使用非 KeyFrame 会极大程度减缓倒放能力。

在 `image/png` 时，KeyFrame图像和其之后非关键帧图像会一直堆砌显示，可以用透明度进行递增
动画。达到新的关键帧，则隐藏之前图像。

## SVG图像 SVGSprite
Example 示例:
````
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

