 define(function(require,exports) {
    function runCommon(curstage){
        var delayload = require('../../../../util/lazyload/delayload');
        delayload.init();
        require('../vod');
        var $ = require('jquery'),
            ps = require('../../../../util/photoslide/photoslide')
        ;
        var cookie = require('../../../../util/cookie/cookie');
        var loader=require('../../../../util/loader/loader');

        //右侧锚点
        require('../../../../util/sidemao/sidemao');

        //是否为客户端
        var isClient = function(){
            try{
                if(external && external.GetObject){
                    return true;
                }
            }catch(e){}
            return false;
        }();
        //幻灯
        ps.init($(".talkshow"), {
            perTime: 1,
            showNum: 3,
            outer: '.tkshow',
            inner: '.module-animation180x100 ul',
            autoSwitchTime:7000
        });
        //写入cookie，禁止客户端iframe刷新
        cookie.set('refreshForClient', 0, 1, 'pptv.com', '/');
        var mapId={
            '0':'haixuan',
            '1':'pk',
            '2':'concert',
            '3':'stagefour',
            '4':'stagefive',
            '5':'stagesix',
            '6':'stageseven',
            '7':'stageeight'
        }
        var mapUrl={
            'haixuan':'http://chang.pptv.com/api/sea_history',
            'pk':'http://chang.pptv.com/api/pk_history',
            'concert':'http://chang.pptv.com/api/concert_history',
            'stagefour':'http://chang.pptv.com/api/gold_history',
            'stagefive':'http://chang.pptv.com/api/189_history',
            'stagesix':'http://chang.pptv.com/api/final_history?id=1',
            'stageseven':'http://chang.pptv.com/api/final_history?id=2',
            'stageeight':'http://chang.pptv.com/api/final_history?id=3'
        }
        var prefix='history';
        // 写死阶段
        var curIndex=curstage-1;
        var firstChildren=$("#timeline_stage").children(":visible");
        $(".module-timeline ul li").on("click",function(){
            var obj=$(this);
            var idx=obj.index();
            if(obj.index()<curIndex){
                obj.addClass('pastactive');
                obj.siblings().removeClass('pastactive');
                //ajax 请求或者showtab
                var mapName=mapId[idx];
                var requestUrl=mapUrl[mapName];
                var targetDom=$("#"+prefix+mapName);
                if(targetDom.length==0){
                    loader.ajax({
                        type:'get',
                        dataType:'html',
                        cache:true,
                        url:requestUrl,
                        success:function(data){
                            var tempObj=$(data);
                            $("#timeline_stage").append(tempObj);
                            tempObj.attr('id',prefix+mapName);
                            var tempDom= $("#"+prefix+mapName);
                            delayload.add(tempDom.find('img[data-src2]').toArray());
                            $("#timeline_stage").children().addClass('hidden');
                            tempDom.removeClass('hidden');
                            delayload.update();
                        }
                    });
                }else{
                    targetDom.siblings().addClass('hidden');
                    targetDom.removeClass('hidden');
                }
            }else if(obj.hasClass('now')){
                obj.siblings().removeClass('pastactive');
                firstChildren.siblings().addClass('hidden');
                firstChildren.removeClass('hidden');
            }else{
                return false;
            }
        });

        var $tabs = $('.module-18out9index .tabs');
        if($tabs.find('a').length>1){
            var $target = $('#'+$tabs.attr('data-targetid'));
            var $tabcon = $target.find('.tabcon');
            $links = $tabs.find('a');
            $tabs.on('click', 'a', function(ev){
                var ix = $(this).index();
                if(ix<$tabcon.length){
                    $tabcon.hide().eq(ix).show();
                    $links.removeClass('now').eq(ix).addClass('now')
                }
            })
        }
    }
    exports.init=function(curstage){
        runCommon(curstage);
    }
 });