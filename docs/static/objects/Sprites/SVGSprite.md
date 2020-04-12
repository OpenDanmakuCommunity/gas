# SVG图像 SVGSprite
Example 示例:
````JSON
{
    "type": "SVGSprite",
    "content": {
        "type": "svg",
        "viewBox": [0, 0, 100, 100],
        "children": []
    }
}
````

## 空间 box
可以定义 SVG 的 `viewBox` 属性。其包括四个参数`[x, y, width, height]`。
当 `viewBox` 属性不存在时，将会采用 1:1 显示。

## 子对象 children
子对象可以定义在 `content.children` 下，包括具体的 SVG 原生基础单元。

### Rect
````JSON
{
    "type":"rect"
}
````


### Circle
````JSON
{
    "type":"rect"
}
````

### Ellipse
````JSON
{
    "type":"rect"
}
````

### Line
````JSON
{
    "type":"rect"
}
````

### Polyline
````JSON
{
    "type":"rect"
}
````

### Polygon
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