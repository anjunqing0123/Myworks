/*! 一唱成名 create by ErickSong */
调用方式：

if(window.seajs){
    seajs.use(['photoslide', 'jquery'], function(ps, jq) {
        var container = jq(".ps")[0];
        ps.init(container, {
            autoSwitchTime: 5000, //自动切换频率时间,小于1为不自动切换
            direction: 'horizontal', //横向or竖向    horizontal|vertical
            onChangePage: function(){}, //幻灯切换的回调
            outer: '.pics', //外层选择器
            inner: '.picsMove', //内层选择器
            perTime: 1, //每次翻几张
            showNum: 1, //默认显示几张
            blank: true, //当幻灯数 - showNum不是perTime的整数倍时是否需要用空白填充
            loop: false, //幻灯是否循环
            duration: 'slow', //一次幻灯效果的时间 可以是'fast','normal', 或者数字
            width: null, //自定义幻灯的宽
            height: null, //自定义幻灯的高
            pre: '.pre', //pre按钮的选择器
            next: '.next', //next按钮的选择器
            fillBtns: true, //是否填充切换按钮
            btns: '.btns', //切换按钮的选择器
            btnTriggerEvent: 'click' //切换按钮触发事件
        });

    });
}

说明：

上面的赋值都是默认值
container包含outer层，当container是一个数组时，那么将以相同的配置循环生成幻灯
如果loop为true 那么blank失效
如果loop为true并且 幻灯数 - showNum不是perTime的整数倍，那么fillBtns，btns，btnTriggerEvent失效

如果blank为fasle，fillBtns，btns，btnTriggerEvent失效

onChangePage回调会传入当前可视第一个幻灯的索引，索引从0开始
