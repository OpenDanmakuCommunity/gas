# Text 文字对象

## Text
Example:
````JSON
{
    "type": "Text",
    "content": "This is a string"
    ""
}
````
Text 对象包括 `font.*` 属性。具体请参考 [Properties](Properties.md)。

## RichText
Example:
````JSON
{
    "type": "RichText",
    "content": [
      {
        "content": "This is the first span. It's not big",
        "font.size": 10
      },
      {
        "content": "This is the next span. It's tiny!",
        "font.size": 1
      }
    ]
}
````

## Button
Example:
````JSON
{
    "type": "Button",
    "content": "Button Text"
}
````
