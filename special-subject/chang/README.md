README
------


# 一唱成名

    项目相关说明


##【目录结构】
 \static9\chang\:

    ---
     |---- css/                 项目css文件都存放在这个目录
     |---- images/              CSS中用到的图片
     |---- js/                  开发环境js
     |---- script/              线上js地址
     |---- pages/               所有静态页面合并地址
     |---- Gruntfile.js         打包配置
     |---- package.json         配置信息
     |---- README.md            说明文档


## 【开发说明】

    1. pages目录里面存放所有静态html页面，如果开始一个新的页面，请以 'sample-template.html' 为模板来新建页面
    2. css模块规范遵照之前规范
    3. js模块说明【/js/】
        ---
         |---- app              存放不同业务逻辑
            |---- sample        模块实例
         |---- core             核心库文件｛jquery、backbone、underscore、zepto等｝
            |---- backbone
            |---- jquery
            |---- underscore
            |---- zepto
         |---- util             项目所需要封装的工具模块
            |---- swipe         工具
            |---- upload         视频上传(未完成)
    4. 开发的时候只是需要在js目录下面按要求开发模块即可
    5. 上线的时候，使用grunt打包
        'grunt' 后会自动创建 script 文件目录
    6. 开发过程中，处理对core依赖是绝对路径，其他均使用 ** 相对路径 **


## 【环境配置】

 *** HOST ***

    127.0.0.1    static1.pplive.cn   static9.pplive.cn

    172.20.4.95     chang.pptv.com chang.aplus.pptv.com space.chang.pptv.com mtbu.api.pptv.com app.aplus.pptv.com
    172.20.5.205    api.chang.pptv.com v.chang.pptv.com api.chang.idc.pplive.cn
    172.20.5.205    api.cdn.vote.pptv.com api.vote.pptv.com
    #172.20.4.171   mtbu.api.pptv.com

    ###########  UGC
    172.16.6.47     ugc.api.pptv.com
    172.16.6.47     ugc.upload.pptv.com
    172.16.6.47     src.pano.pptv.com api.grocery.pptv.com grocery.pptv.com
    172.16.4.47     v.image.pplive.cn
    172.16.6.47     web-play.pptv.com
    172.16.6.98     score.data.pptv.com

    172.16.6.47     api.grocery.pptv.com    #v.img.pplive.cn

    172.20.4.169 master.sensation.idc.pplive.cn
    172.20.5.227 master.vote.idc.pplive.cn

    172.16.6.47 client-play.pptv.com #客户端
    172.20.4.95 client.aplus.pptv.com #客户端


 *** sample ***

    http://static9.pplive.cn/chang/pages/sample.html

    http://mtbu.api.pptv.com/v4/module?lang=zh_cn&platform=aphone&appid=com.pplive.androidphone&appver=5.2.1&appplt=aph&userLevel=0&channel=@SHIP.TO.31415926PI@&location=app%3A%2F%2Faph.pptv.com%2Fv4%2Fusercenter


## 【单位约定】

 移动端：rem， html已经按照62.5%处理，页面中使用的时候，直接转换即可 12px = 1.2rem


## 【JS-SDK测试】

[JS-SDK-Demo](http://static9.pptv.com/chang/pages/demo/sdk/)

[iPhone](http://static9.pptv.com/chang/pages/demo/sdk/PPTViPhone.ipa)

[android](http://static9.pptv.com/chang/pages/demo/sdk/PPTV_phone.apk)

