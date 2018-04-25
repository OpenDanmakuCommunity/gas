# Sprite 绘图对象

## 基础参数 

### `type = [ "SVGSprite" | "Bitmap" | "AnimatedSprite" ]` 类型

### `position` 位置

### `size` 大小


## SVGSprite
Example:
````
{
    "type": "SVGSprite",
    "content": {
        "type": "svg",
        "width": 100,
        "height": 100,
        "viewBox":  [0, 0, 100, 100],
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

## Bitmap
Example:
````
{
    "type": "Bitmap",
    "content": {
        "type": "image/png",
        "data": "...",
        "encoding": "base64"
    }
}
````

## AnimatedSprite 动画绘图对象

### Binary Based (GIF or animated PNG)
Example:
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

### Frame Based
Example:
````
{
    "type": "AnimatedSprite",
    "content": {
        "type": "frames",
        "frames": [
            {
                "type": "image/png",
                "data": "...",
                "encoding": "base64"
                "isKeyFrame": true,
            },
            {
                "type": "image/png",
                "data": "...",
                "encoding": "base64"
                "isKeyFrame": false,
            },
            {
                "type": "*/frame-command",
                "action": {
                    "rotate": "...",
                }
            }
        ],
        "fps": 10,
        "repeat": true,
    }
}
````
