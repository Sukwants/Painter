# Painter

简陋的冬日绘板 Node.js 脚本。

## 使用方法

  1. 在 `_config.yaml` 文件中填写左上角像素的 $x$ 与 $y$ 坐标。
  2. 将绘制图片命名为 `_picture.bmp`。
  3. 在 `_tokens.yaml` 文件中每一行以 `uid: token` 的形式描述一个 token。
  4. 执行 `node ./index.js` 开始运行脚本。

## 报错解释

  - `[Unkown Error]` 一般是网络问题导致的没有收到服务器响应。
  - `[Paint / Get Board] Network error {status code}.` 指收到了非 `200` 的服务器响应，服务器炸了可能导致 `502` 或 `504` 响应。
