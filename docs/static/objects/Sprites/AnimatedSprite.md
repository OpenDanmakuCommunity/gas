# 动画图形 AnimatedSprite
Example 示例:
````JSON
{
    "type": "AnimatedSprite",
    "content": {},
    "frame": 0
}
````

动画绘图对象用于在Sprite里面播放动画。这样可以极大简化很多复杂的高级弹幕。不过由于安全策略，
对这一类型的Sprite可能支持有限。

## `frame` 帧位置
用于在时间轴里面动画使用，支持渐变。取值在 `[0, 1]`。

## `content` 动画定义
`content`参数用来定义动画，其中必须包括属性`type`。`content.type` 决定动画类型

### 帧列表 Frame List
````JSON
{
    "type": "frames",
    "frames": [
        {"type": "svg", "children": []},
        {"type": "image/png", "data": "...", "encoding": ""}
    ]
}
````

帧列表格式比较简单，由一系列单帧组成。在 `frame` 参数变化时，会选取 `frame * len(frames)`
所表示的整数帧（余出量舍去）

### 参量SVG Parameterized SVG
````JSON
{
    "type": "svg+p",
    "children": [
        {

        }
    ]
}
````
