# SVG图像 SVGSprite
Example 示例:
````JSON
{
    "type": "SVGSprite",
    "content": {
        "type": "svg",
        "viewBox": [0, 0, 100, 100],
        "defs": [],
        "children": []
    }
}
````

## 可视坐标空间 viewBox
可以定义 SVG 的 `viewBox` 属性。其包括四个参数`[x, y, width, height]`。
当 `viewBox` 属性不存在时，将会采用 1:1 显示。

可视坐标空间用于决定SVG的单位长度定义而非图像大小。在实际渲染中，SVG图像会自动将`viewBox`内的
图像信息放大或缩小使得充满整个显示空间。例：当 `viewBox` 设定为 `0, 0, 100, 100` 时，如果
图像在 `200px x 200px` 的幕布上渲染，则每个 SVG 单位长度表示 `2px`

## 定义空间 defs
定义空间 `defs` 会被用于存放一些默认不渲染的单对渲染有一定用处的对象的信息。包括但不限于：多次
实用的对象的定义、各种高光模糊滤镜等。

放在此处的定义必须具备如下的特点：
- 必须包含一个 `name` 字段
- name字段不得与SVG对象内的其余命名重叠

## 子对象 children
子对象可以定义在 `content.children` 下，其中简单包括各种 SVG 原生基础单元。注：由于一些
情况下外部渲染平台未必支持所有 SVG 功能，建议可能的情况下讲各种 SVG 专有对象类型转化为
path 路径对象。

### Rect, Circle, Ellipse, Line, Polyline, Polygon
````JSON
{
    "type":"rect"
}
````

### Path
````JSON
{
    "type":"rect"
}
````

### Use
````JSON
{
  "type":"use",
  "href": ""
}
````
