##peropero（二次元项目）

>   ***redux + react + es6  （support IE8）***


### 更新下原型地址：
> [http://client/ACG/ACG1.0/](http://client/ACG/ACG1.0/)


### ⊙ 目录结构


```

├─ dist/                                # build s生成的生产环境下的文件
├─ shim/                                # PC IE8 兼容库
├─ src/
│   ├─ h5
│       ├─  assets     
│       ├─  css
│       ├─  js
│           ├─  personal                # h5 个人中心承载页
│           ├─  play                    # h5 播放承载页
│           ├─  utils                   # h5 工具库
│   ├─ web
│       ├─ assets     
│       ├─ css     
│       ├─ js
│           ├─  actions                 # redux （actions）
│           ├─  common                  # 项目数据配置
│           ├─  components              # React组件 
│           ├─  reducers                # redux （reducers）
│           ├─  services                # 服务（SERVICE，用于统一管理 XHR 请求）
│           ├─  store                   # redux （store）
│           ├─  utils                   # 工具库
│           ├─  views                   # 页面视图入口
├─ static/                              # 放置无需经由 Webpack 处理的静态文件 比如切图文件可以放置于此
├─ .babelrc                             # babel 转换配置
├─ package.json                         # 项目依赖配置文件
├─ webpack.config.babel.js              # 项目依赖配置文件


```