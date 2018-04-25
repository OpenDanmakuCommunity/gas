# Dynamic Values 动态值
有时数字值需要依赖运行环境，以下是一个默认的列表 

## 全局
- `stageHeight`, `stageWidth`: 舞台高宽
- `duration`: 整条动画弹幕的生命周期 ms

## 对象
- `height`, `width`: 本对象的高宽
- `x`, `y`: 本对象的起始 x,y 坐标（像素）

引用这些值只要在需要提供数字的字段给出 `$name` 即可（如 `$x`）。如果运行时值不存在，则会
触发解析错误。

## 弹幕内定义的固定值
可以在 metadata 项目内定义新的参考值。如果它们和系统的命名冲突，则会被无视。

````
{
    "metadata": {
        "variables": {
            "scalingFactor": 0.1,
            "defaultScreenWidth": 0.12
        }
    }
}
````

### 特殊固定值
定义如下特殊固定值会更改系统的一些操作：

- `.~=`: 设置在表达式里面使用 `~=` 判断值之间相似时的

## 计算序列
在 metadata 里面定义的值可以使用表达式（这些值会在弹幕载入时被一次性计算）。格式如下：

````
{
    "oldWidth": 640,
    "oldHeight": 480,
    "scalingFactor": {
        "op":"max",
        "params": [
            {
                "op": "/",
                "params": ["$stageWidth", "$oldWidth"]
            },
            {
                "op": "/",
                "params": ["$stageHeight", "$oldHeight"]
            },
        ]
    }
}
````
