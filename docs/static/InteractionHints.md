# Interaction Hints 交互标签
交互标签可添加到任何一个 Object 上。这些标签允许 **兼容的** 播放器添加交互支持
（如按钮的点击绑定或与当前动态时间的交互等）。

注意：交互标签只是辅助信息，不同的实现和平台限制可能会无视动态交互标签。设计时应该设计好支持
interaction 的回退策略。

## 对象内使用 Refer From Objects
以下为示例：
````JSON
{
  "type":"SomeObject",
  "interaction": {
    "list": ["vid100_Button"],
    "fallback": ""
  }
}
````

用户可以在对象内引用 `interaction` 名称。这些记录在 `interaction.list` 中。
如果互相冲突，次序靠后的会覆盖靠前的。

`interaction.fallback` 参数可以提示解析器在interaction不支持或失败的情况下自动
回退的方案。可以取如下的值：
- `ignore`: （默认）无视 interaction，依然按照定义显示和操作对象动画。
- `hide`: 隐藏对象，渲染时不显示对象（但是参与排版）
- `remove`: 去除对象，渲染不显示对象也不参与排版。如果该对象为别的对象的子对象则会被自动去除
    如果对象为别的对象的reference锚点或者别的对象有参数依赖此对象，将会引发运行时错误（
    并可能导致整个animation被播放器放弃）
- `disable`: 显示一种“无效”的状态。按钮依然会渲染，但是会由系统定义的“无效元素”配置显示。
    （如灰色按钮等）

## 在元信息内定义 Define in Metadata
以下为示例:
````JavaScript
{
  "interactions": {
    "vid100_Button": {
      "type": "hit-target",
      "action": "open",
      "parameters": {
        "location": "video://vid100/0",
        "window": "replace",
        "pause": true,
      },
      "style": {
        "accessible": true,
        "outline": "always",
        "hover": {
          "color": 0xc0ffee,
          "background": 0xffffff,
        },
        "touchPolicy": "default"
      }
    }
  }
}
````

用户可以通过 `style` 字段提交一些别的平台提示：
- `accessible`: 触控对象是否强制为无障碍对象。此参数为 `true` 时平台可以覆盖一些对象属性
    来使点击触发器适应无障碍辅助软件。包括：强制增加边框、改变渲染顺序、覆盖字体设置、延长
    对象在留时间、改变颜色对比度等等。这个设置永远为顶级优先度，默认 `true`。
- `outline`: 控制触控对象是否显示边框。适用值包括：`always`（总显示），`never`
    （总不显示）和`hover`（浮动时显示）。
- `hover`: 控制在浮动时对象的状态。会覆盖interaction外的值（无渐变）
- `touchPolicy`: 可以选择平台提供的转化触屏的方案，默认为 `default`。

## 交互标签类型 Type of Interaction Hints
交互标签可以有各种平台定义的类型，以下是一些GAS内定义的常规类型。虽然说是常规类型，不同平台的
实现还是可能有很大的差异的。

### Hit Target 点击触发器
点击触发器会标记当前对象为 **可点击** 对象（移动平台上为 可触摸 对象）。具体呈现方法会根据
平台而不同，以下是一个例子：
````JavaScript
{
  //...
  "interaction": [
    {
      "type": "hit-target",
      "action": "some action",
      "parameters": { /* ... */ },
      "style": {
        "accessible": true,
        "outline": "always",
        "hover": {
          "color": 0xc0ffee,
          "background": 0xFFFF00
        },
        "touchPolicy": "default"
      }
    }
  ]
}
````


目前常规定义的 Action：
- `seek`: 定位到时间
- `open`: 打开新的页面
- `gift`: 提交平台礼品
- `save`: 保存信息到服务器

### `seek`
参数如下：
````JSON
{
  "parameters": {
    "time": 10030,
    "cancelable": false
  }
}
````

- `time`: seek到的时间
- `cancelable`: 是否记住用户现在的位置并在跳转后允许回退。平台也可以决定以打开弹窗方式
  询问用户是否想跳转。注意：平台未必真的要遵循这个设定。

### `open`
参数如下：
````JSON
{
  "parameters": {
    "location": "...",
    "window": "replace",
    "pause": true,
  }
}
````

- `location`: 跳转到的位置
- `window`: 是否开新窗口，`new`（总开新窗口） `replace`（总替换目前窗口） `auto`
    （参考用户设置）
- `pause`: 是否跳转后暂停目前流媒体。如果替换窗口则此选项会被无视。

### `gift`
参数如下：
````JSON
{
  "parameters": {
    "item": "ITEM_ID",
    "value": 10,
    "variable": [0, 10, 1]
  }
}
````

- `item`: 礼品ID
- `value`: 附加值（必须为数字）
- `variable`: 是否可变，如果为 `undefined`或`false`则只提供value。否则使用如下取值：
    `[最小，最大，递进梯度]`，默认为`value`定义的附加值。可变模式下平台可以弹窗让用户选择
    数额。

### `save`
参数自由定义。

## Keyboard Target 键盘触发器
````JavaScript
{
  //...
  "interaction": [
    {
      "type": "keydown",
      "action": "",
      "parameters": { /* ... */ },
      "focus": true,
    }
  ]
}
````

## Value Based 动态值触发器
TBD
