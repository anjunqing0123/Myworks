## 说明
- 项目通过  [gulp](http://www.gulpjs.com.cn/)  进行自动化打包压缩
- 项目目录 `static/`
- 源代码目录 `static/src/`
- 压缩后目录 `static/dist/`，页面引用资源全部引用自 `static/dist/` 目录，压缩后的`js && css`自动添加 `.min.*`后缀


## 运行（请先安装NodeJs）
- 根目录运行  `$ npm install`   安装依赖模块
- 根目录运行  `$ gulp`   会自动将代码压缩进生成的 `static/dist/`  目录
- 根目录运行  `$ gulp web`   启动本地服务器
