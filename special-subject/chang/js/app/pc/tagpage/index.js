define(function(require,exports) {
    //幻灯模块以及下拉菜单模块
    require('./slider');
    var $=require('jquery');
    var _=require('underscore');
    var loader=require('../../../util/loader/loader');
    var urls=require('../../../util/linkcfg/interfaceurl');
    //登录模块
    require('../../../util/linkcfg/pcredirect');
    //登录模块结束
    var isClient = function(){
        //是否是客户端
        try{
            if(external && external.GetObject){
                return true;
            }
        }catch(e){}
        return false;
    }();
    var template_item='<li>'
                       + '<a href="<%= link %>" <%if(isClient==false){%>target="_blank"<%}%> class="item" title="<%= title %>">'
					   +    '<img alt="<%= title %>" src="<%= videourl %>">'
                       +    '<span class="v-bg"></span> <i class="v-ico v-show"></i> <!--v-show代表有播放icon -->'
                        +   '<i class="v-ico2"></i>'
                       +'</a>'
						+	'<dl>'
						+		'<dt><%= real_name%></dt>'
						+		'<dd><%= title %></dd>'
						+		'<a class="hpic" href="<%= playerurl %>" <%if(isClient==false){%>target="_blank"<%}%>>'
						+			'<img alt="<%= title %>" src="<%= avatar %>">'
						+		'</a>'
						+	'</dl>'
                        +'<div class="vote">'
						+	'<a class="up"><%= upvote%></a><a class="down"><%= downvote%></a>'
						+'</div>'
                    +'</li>';
    var tempFunc=_.template(template_item);
    //获取url参数对象
    var getUrlArgObject=require('../../../util/others/getquery');
    var urlObj=getUrlArgObject();
    var page=1;
    var pageSize=20;
    var stage='1';
    var scope=urlObj['scope']||1;
    var sort=1;
    var isend=false;
    var mode='haixuan';
    var marqueeObj=$(".js-marquee");
    if(marqueeObj.length==0){
        return;
    }
    var template_item_more='<li>'
                           + '<a title="<%= title %>" class="item" <%if(isClient==false){%>target="_blank"<%}%>  href="<%= link %>">'
                            +   '<img alt="<%= title %>" src="<%= videourl %>">'
                            +    '<dl>'
                            +        '<dt><%= title %></dt>'
                            +        '<dd><%= stage_name %></dd>'
                            +    '</dl>'
                            +    '<span class="v-bg"></span> <i class="v-ico v-show"></i> <!--v-show代表有播放icon -->'
                             +   '<i class="v-ico2"></i>'
                             +'<span class="msk-txt"><%= real_name%></span>'
                           + '</a>'
                       + '</li>';
    var tempMoreFunc=_.template(template_item_more);
    if($(".module-vote-layout").length!=0){
        require('./tagpk');
        mode='pk';
        sort=3;
    }else if($(".module-myconcert-tag").length!=0){
        require('./tagConcert');
        mode='concert';
        sort=3;
    }else if($("#gold-stage-tag4").length!=0){
        require('./stagefour');
        mode='goldstage4';
        sort=3;
    }else if($("#gold-stage-tag5").length!=0){
        require('./stagefive');
        mode='goldstage5';
        sort=3;
    }else if($("#gold-stage-tag6").length!=0){
        require('./stagesix');
        mode='goldstage5';
        sort=3;  
    } else if($("#gold-stage-tag7").length!=0){
        require('./stageseven');
        mode='goldstage5';
        sort=3;  
    }else{
        var sortA=$(".module-inmatch .drop-tit a");
        sortA.on("click",function(e){
            e.preventDefault();
            var obj=$(this);
            var tempsort=obj.data('sort');
            if(tempsort!=sort){
                sort=tempsort;
                lock=true;
                sortA.removeClass('active');
                obj.addClass('active'); 
                loadData(true);
            }
            return false;
        });
    }
    function loadData(isReset){
        if(isReset){
            page=0;
            $(".js-marquee").find('ul').html('');
            lock=true;
            isend=false;
        }
        var tempData={
            stage:stage,
            scope:scope,
            sort:sort,
            start:pageSize*page,
            stop:pageSize*(page+1)-1,
            plt:'pc'
        };
        tempData.__config__={
            cdn:true,
            callback:'updateMarquee'
        };
        loader.load(urls['interface']['tagMarquee'],tempData,function(data){
            if(data.length==0){
                isend=true;
            }
            if(mode=='haixuan'){
                var returnHtml=buildData(data);  
            }else if(mode!="haixuan"){
              var returnHtml=buildPKData(data);  
            }
            $(".js-marquee").find('ul').append(returnHtml);
            page++;
            lock=false;
        },function(){
            lock=false;
        });
    }
    function buildData(arr){
    	var temphtml="";
        for(var i=0;i<arr.length;i++){
            var tempObj=arr[i];
            var buildObj={};
            buildObj.title=tempObj.title;
            if(tempObj.player_info.is_group=="1"){
                buildObj.real_name=tempObj.player_info.group_name;
            }else{
                buildObj.real_name=tempObj.player_info.real_name;
            }
            if(!isClient){
                buildObj.link=tempObj.web_link;
                buildObj.playerurl='http://chang.pptv.com/pc/player?username='+tempObj.player_info.username;
                buildObj.isClient=false;
            }else{
                buildObj.link=tempObj.pc_link;
                buildObj.playerurl='http://chang.pptv.com/pc/player?username='+tempObj.player_info.username+'&plt=clt';
                buildObj.isClient=true;
            }
            buildObj.videourl=tempObj.dp.picurl;
            buildObj.upvote=tempObj.like_vote_format;
            buildObj.downvote=tempObj.dislike_vote_format;
            buildObj.avatar=tempObj.player_info.avatar;
            temphtml+=tempFunc(buildObj);
        }
        return temphtml;
    }
    function buildPKData(arr){
        var temphtml="";
        for(var i=0;i<arr.length;i++){
            var tempObj=arr[i];
            var buildObj={};
            buildObj.title=tempObj.title;
            buildObj.stage_name=tempObj.stage_name;
            if(tempObj.player_info.is_group=="1"){
                buildObj.real_name=tempObj.player_info.group_name;
            }else{
                buildObj.real_name=tempObj.player_info.real_name;
            }
            if(!isClient){
                buildObj.link=tempObj.web_link;
                buildObj.playerurl='http://chang.pptv.com/pc/player?username='+tempObj.player_info.username;
                buildObj.isClient=false;
            }else{
                buildObj.link=tempObj.pc_link;
                buildObj.playerurl='http://chang.pptv.com/pc/player?username='+tempObj.player_info.username+'&plt=clt';
                buildObj.isClient=true;
            }
            buildObj.videourl=tempObj.dp.picurl;
            buildObj.avatar=tempObj.player_info.avatar;
            temphtml+=tempMoreFunc(buildObj);
        }
        return temphtml;
    }
    var offsetTop=marqueeObj.offset().top;
    var win=$(window);
    var winH=win.height();
    var lock=false;
    $(window).on('scroll',function(){
    	var tempScrollTop=win.scrollTop();
    	if(tempScrollTop+winH>marqueeObj.offset().top+marqueeObj.height()-167){
    		if(lock==false){
    			lock=true;
                if(isend==true){
                    return false;
                }
    			loadData();
    		}
    	}
    });
});

