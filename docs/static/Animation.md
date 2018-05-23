# Animation 动画定义
GAS-S 的动画定义语法非常简单。动画定义采取全局锚点模式（类似与传统 Flash动画）。这里一个锚点
可以认为是一个关键帧。每一个关键帧可能关系到数个对象，对象也可能与一些关键帧无关。

## 动作锚点 Anchors
动作锚点（Anchor）在 GAS-S 中定义为一个关键帧。这些关键帧保存在 `animation.anchors` 数组
中。如下是一个样例：

````JSON
{
  "time": 1000,
  "objects": {
    "Text-1": {
      "linear": {
        "position.x": 100,
        "position.y": 100
      },
      "none": {
        "content": "Oh Look! I moved to 100,100!"
      },
    },
    "Sprite-1": {
      "quadriatic": {
        "size": {
          "width": 100,
          "height": 100,
        }
      },
      "linear": {
        "transform.rotX": 90
      }
    }
  }
}
````

### `animation.anchors` 锚点数组
锚点数组保存了所有的锚点。这个数组必须保证如下特点：

- 有序：数组必须按照每一个锚点的 `time` 值 **从低到高** 排序。
- 无重复：数组内的每一个锚点必须由互不相同的 `time` 值。同一个时间只能有一个锚点！

### `[anchor].time` 时间
这个字段定义了锚点的时间（ms）。从一个锚点到达另一个锚点时，所有两个锚点之间内定义了的对象的
相应字段都会通过定义的渐变到达目标锚点设定的值。目标锚点没有定义的值会保持起始锚点的值不变。
如果渐变是 `none`，在到达 `time` 是值会被设为新的值（之前一直保持原值）。

### `[anchor].objects.[object]` 动画对象
这里定一个 `[object]` 在 `[anchor]` 这个时间存在关键帧。（注意：如果一个对象的名字不在这个
表中，对象将无视这个锚点，而是渐变到下一个自己由定义的锚点上。反之，如果对象名字出现了，不管
是否定义了任何属性，都会视目前的锚点为一个关键帧）

### `[object].[easing]` 动画补间
这里 `[easing]` 定义了从 **前一个锚点** 到这个锚点之间使用的补间动画模式。放在不同的 easing
组内的参数会按照easing组进行补间（如 `position.x` 可以设定为linear 而`position.y`则可
使用 circular 来模拟四分之一圆角运动等。）

如果 easing 内定义的属性不支持 easing 补间（如值为 enum 或 string 等），平台可以自动转移
参数到 `none` 补间中。当然有的平台也可拒绝播放这样的非合规弹幕定义。

常规补间：
- `none`
- `linear`
- `quadriatic`,
- `cubic`
- `circular`
- `sine`
- `exponential`

### `[object].none` 无补间补间
当 `[easing] = none` 时，在起始锚点到目标锚点之间的时间，属性总保持起始锚点时的属性。到达
目标锚点时顺时切换到 `none` （无补间）下定义的值。由于没有补间，所以任何属性都可以扔到这个组
中。

## 例子 Example
假设有 `A, B, C` 三个对象和如下的时间轴（每一个 `P,Q,X,Y,Z`都是一个关键帧）：
````
       0    100    200    300    400    500
[ A ]        X             Z
[ B ]               Y      Z      P
[ C ]        X      Y      Z             Q
````

### 示例时间轴 Anchor Example
````JavaScript
[
    // X
    {
      "time": 100,
      "objects": {
        "A": { /** Stuff **/ },
        "C": { /** Stuff **/ },
      }
    },
    // Y
    {
      "time": 200,
      "objects": {
        "B": { /** Stuff **/ },
        "C": { /** Stuff **/ },
      }
    },
    // Z
    {
      "time": 300,
      "objects": {
        "A": { /** Stuff **/ },
        "B": { /** Stuff **/ },
        "C": { /** Stuff **/ },
      }
    },
    // P
    {
      "time": 400,
      "objects": {
        "B": { /** Stuff **/ },
      }
    },
    // Q
    {
      "time": 500,
      "objects": {
        "C": { /** Stuff **/ },
      }
    },
]
````


### 补间关键帧判定 KeyFrame Association
以下我们可以观察每个对象的补间状况
````
      [ A ]  [ B ]  [ C ]
0       *      *      *
50    *->X    *->Y   *->X
100     X     *->Y    X
150   X->Z    *->Y   X->Y
200   X->Z     Y      Y
250   X->Z    *->Y   Y->Z
300     Z      Z      Z
350     Z     Z->P   Z->Q
400     Z      P     Z->Q
450     Z      P     Z->Q
500     Z      P      Q
550     Z      P      Q
````
