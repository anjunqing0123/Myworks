/*! 一唱成名 create by ErickSong */
内网host地址
172.16.6.47     ugc.api.pptv.com 
172.16.6.47     ugc.upload.pptv.com
172.16.6.47     src.pano.pptv.com grocery.pptv.com api.cloudplay.pptv.com
172.16.4.47     v.image.pplive.cn
#172.16.6.47 api.passport.pptv.com
172.16.6.47     passport.pptv.com
172.20.4.95     passport.aplus.pptv.com
使用方法：
seajs.use('VideoUploader', function(VideoUploader){
    var vUploader = new VideoUploader({
        fileInput: '',
        offset: {w:0,h:0,x:0,y:0},
        cp: 'UGC',
        onMetaInfo: function(data){},
        onCommit: function(data){},
        onFinish: function(data){},
        onFail: function(data){},
        onUpdate: function(total, loaded){},
        onStart: function(data){}
    })
    vUploader.upload();
    vUploader.commit(title);
})

fileInput-->input控件的ID
offset
    --> 如果采用flash上传，会生成一个透明的flash控件，offset代表flash的大小和位置
cp
    --> 默认UGC
onMetaInfo
    --> 点击flash控件选择文件以后，会触发这个事件
        参数data
            --> data.fileName文件名
onCommit
    --> 调用vUploader.commit以后会触发事件
        参数data
            --> data.fileId上传的uploadid
onFinish
    --> 上传完成以后触发
    参数data
        --> data.fileId
onStart
    --> 上传开始触发
    参数data
        --> data.fileId
onUpdate
    --> 上传中
    参数total
        --> 文件总大小，单位Byte
    参数loaded
        --> 已上传大小，单位Byte
onFail
    --> 上传失败
    errCode-->1、视频为空
    errCode-->2、视频格式错误
    errCode-->3、视频尺寸太小
    errCode-->4、文件太大
    errCode-->5、未登录

vUploader.upload    上传
vUploader.commit    上传完成后调用，服务器开始转码，参数title视频名称
