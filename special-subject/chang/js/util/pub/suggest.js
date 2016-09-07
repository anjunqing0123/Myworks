define(function(require,exports){
    var $ = require('jquery'),
        cookie = require('../cookie/cookie'),
        loader = require('../loader/loader'),
        searchlog = require('./searchlog'),
        urlHash = require('../net/urlquery')
    ;
    var IE6 = !window.XMLHttpRequest;
    var iPad = navigator.userAgent.indexOf('iPad')>=0;
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);

    //将str中的$替换成data中的值
    function tmpl(str,data){
        str = str||'';
        for(var i in data){
            str = str.replace(new RegExp('\\$'+i,'g'),data[i]);
        }
        return str;
    }

    //去除字符串首尾空格
    function trim(str){
        return (str||'').replace(/(^\s+)|(\s+$)/gm, '');
    }

    function isInt(s) {
        var ex = /^\d+$/;
        return ex.test(s)
    }

    //字符串截取
    function str_truncate(str, len, ae) {
        var tl = 0, ts = [], tt = str.length;
        for (var i = 0; i < tt; i++) {
            if (str.charCodeAt(i) > 255) {
                tl += 2;
            } else {
                tl++;
            }
            if (tl > len) {
                break;
            }
        }
        return (ae && i < tt) ? str.substring(0, i) + '...' : str.substring(0, i);
    }

    var urlHash = (function() {
        var str = window.location.search;
        if (str.indexOf('?') === 0 || str.indexOf('#') === 0) {
            str = str.substring(1, str.length);
        }
        var qs = {};
        var tt = str.split('&');
        for (var item in tt) {
            var ss = (tt[item] && tt[item].split) ? tt[item].split('=') : 0;
            if (ss.length == 2) {
                qs[ss[0]] = decodeURIComponent(ss[1]);
            }
        }
        return qs;
    })();

    var iframeHTML = '<iframe style="position:absolute;top:0px;left:0px;width:100%;border:0px;opacity:0;filter:alpha(opacity=0);z-index:1;" src="about:blank"></iframe>';
    var tp_wrap = '<div class="hd-search-result" style="display:none"><h4 class="top_search_txt">今日热搜</h4><ul class="list_contain"></ul><iframe frameborder="0" style="position:absolute; left:0; top:0; z-index:-1; width:100%; height:100%; border: 0px; opacity: 0; filter:progid:DXImageTransform.Microsoft.Alpha(opacity=0);position:absolute; display: block;" src="about:blank"></iframe></div>';
    var tp_li = '<li rank="$index" data-hasInfo="$hasInfo" data-title="$title"><div class="close"><span class="$numclass" style="display:$numdisplay">$num</span><a href="$href" title="$title" keyword="$keyword" channelid="$channelId" stitle="$title" rank="$index" class="ltit" target="$target">$title</a><i class="arrow" style="display:$arrowdisplay"></i></div><div class="open" style="display:none;"><span class="loading"></span></div></li>';
    var tp_op = '<span class="$numclass" style="display:$numdisplay">$num</span><i class="arrow"></i><dl class="cf"><dt><a href="$href" target="_blank" rank="$index" stitle="$title" channelid="$channelId" keyword="$keyword"><img src="$imgsrc" alt="$title" /></a></dt><dd class="$updateClass"><a href="$href" title="$title" class="stit" target="_blank" rank="$index" stitle="$title" channelid="$channelId" keyword="$keyword">$title</a><em>$subtitle</em></dd>$dd</dl>';
    //针对搜索页面，从url中获取搜索的内容
    var locationurl = window.location.href, keys = '';
    if(/(\/s_video\/)||(search\.pptv\.com)/.test(locationurl)){
        locationurl = decodeURIComponent(locationurl);
        var href = locationurl.indexOf("#") > 0 ? locationurl.slice(0, locationurl.indexOf("#")) : locationurl;
        //php后端在输出URL时，会把空格换成加号+，rawurlencode、urldecode
        if(urlHash.kw){
            urlHash.kw = urlHash.kw.replace(/\+/g, ' ');
        }
        keys = urlHash.kw || urlHash.search_query || '';
    }

    var Suggest = function(form, input, submit){
        if(!form){
            return;
        }
        var self = this,
            form = $(form),
            input = input ? $(input) : form.find(':text'),
            submit = submit ? $(submit) : form.find(':button'),
            wrap,topSearchTxt,ul,ul_list
        ;

        if(!form.length){
            return {
                init : function(){} //确保客户端统计页面不会报错
            };
        }

        var suggestUrl = 'http://searchapi.pptv.com/query/nt',
            topSearchUrl = 'http://searchapi.pptv.com/query/topSearch.api',
            detailUrl = 'http://epg.api.pptv.com/detail.api',
            action = 'http://search.pptv.com/s_video?kw=',
            textList = [],
            textListIndex = 0,
            defTxt = '',
            openListIndex = -1,    //存储当前展开list的index值
            chooseListIndex = -1,  //存储当前选中list的index值
            infoCache = [],
            isTopSearch = false,
            keyword = '',
            UID = cookie.get('UID'),
            topDataCache
        ;

        var switchInterval, loadTimer, loadTimer2;

        //获取输入框内容
        function getTxt(){
            return trim(input.attr('value'));
        }

        //回写输入框
        function writeTxt(txt){
            input.attr('value',str_truncate(txt,20,false));
        }

        //PPI处理
        var codePPI = {
            parsePPI : function(key){
                var ppi = key || cookie.get('ppi') ? cookie.get('ppi') : '', bytes=[], str = [];
                if(!ppi || ppi==null || ppi==''){
                    this._cache = [0,2];
                    return this._cache;
                }
                for(var i=0,length=ppi.length; i<length-1; i+=2){
                    bytes.push(parseInt(ppi.substr(i,2),16));
                }
                str = String.fromCharCode.apply(String, bytes);
                str = str.split(',');
                this._cache = str;
                return this._cache;
            },
            getCityCode : function(key){
                //取缓存
                if(this._cache){
                    return this._cache[1];
                }
                return this.parsePPI(key)[1];
            },
            getUserType: function(key){
                if(this._cache){
                    return this._cache[0];
                }
                return this.parsePPI(key)[0];
            }
        };

        //获取参数，数据
        function initEvn(option){
            textList = (input.attr('data-textlist')||'').split(',');
            defTxt = keys || input.attr('value')||textList[0]||'搜索视频、直播...';
            if(option && !option.emptyValue){
                input.attr('value',defTxt);
            }

            location.href.indexOf('http://search.pptv.com') === 0 ? form.attr('target','_self') : form.attr('target','_blank');

            wrap = form.find('.hd-search-result');

            if(wrap.length<1){
                form.append(tp_wrap);
            }
            wrap = form.find('.hd-search-result');
            ul = wrap.children('.list_contain');
            topSearchTxt = wrap.children('.top_search_txt');
        }

        //绑定表单事件
        function bindFormEvent(){
            form.submit(function(){

            });

            input.focus(function(){
                if(getTxt() == defTxt && !/search\.pptv\.com/.test(locationurl)){
                    $(this).attr('value', '');
                }
                $('#search_box .searchtxt').addClass('searchtxt-selected');
                loadData(getTxt());
            });

            input.blur(function(){
                var self = this;
                setTimeout(function(){
                    if(!getTxt()){
                        $(self).attr('value', defTxt);
                    }
                    $('#search_box .searchtxt').removeClass('searchtxt-selected');
                    hideSearchResult();
                },500)
            });

            input.keydown(function(ev){
                switch(ev.keyCode){
                    case 38:    //向上箭头
                        prevList();
                        break;
                    case 40:    //向下箭头
                        nextList();
                        break;
                    case 27:    //Esc
                        hideSearchResult();
                        break;
                    case 13:    //回车
                        break;
                }
            });

            input.keyup(function(ev){
                clearTimeout(loadTimer);
                if (',27,37,38,39,40,13'.indexOf(','+ev.keyCode)>-1) {
                    return;
                }
                loadTimer = setTimeout(function(){
                    loadData(getTxt());
                }, 200);
            });
        }

        function prevList(){
            clearTimeout(loadTimer2);
            if(ul_list){
                var i;
                if(ul_list[chooseListIndex-1]){
                    i = chooseListIndex-1;
                } else {
                    i = ul_list.length-1;
                }
                if($(ul_list[i]).attr('data-hasInfo') == 'true'){
                    loadTimer2 = setTimeout(function(){
                        closeList(ul_list[openListIndex]);
                        openList(ul_list[i]);
                        openListIndex = i;
                    }, 200);
                }
                selectList(ul_list[i]);
                reselectList(ul_list[chooseListIndex]);
                chooseListIndex = i;
                writeTxt($(ul_list[i]).attr('data-title'));
            }
        }

        function nextList(){
            clearTimeout(loadTimer2);
            if(ul_list){
                var i;
                if(ul_list[chooseListIndex+1]){
                    i = chooseListIndex+1;
                } else {
                    i = 0;
                }
                if($(ul_list[i]).attr('data-hasInfo') == 'true'){
                    loadTimer2 = setTimeout(function(){
                        closeList(ul_list[openListIndex]);
                        openList(ul_list[i]);
                        openListIndex = i;
                    },200)
                }
                selectList(ul_list[i]);
                reselectList(ul_list[chooseListIndex]);
                chooseListIndex = i;
                writeTxt($(ul_list[i]).attr('data-title'));
            }
        }

        function selectList(ix){
            var list;
            if(typeof ix=='number' && ix<10){
                list = wrap.find('ul li')[ix];
            } else {
                list = ix;
            }
            $(list).addClass('hover');
        }

        function reselectList(ix){
            var list;
            if(typeof ix=='number' && ix<10){
                list = wrap.find('ul li')[ix];
            } else {
                list = ix;
            }
            $(list).removeClass('hover');
        }

        function openList(ix){
            var list;
            if(typeof ix== 'number' && ix<10){
                list = wrap.find('ul li')[ix];
            } else {
                list = ix;
            }
            $(list).children('.close').hide();
            $(list).children('.open').show();
            $(list).addClass('hover-drop');
            if(!$(list).hasClass('loaded')){
                loadDetail($(list).attr('rank'));
            }
        }

        function closeList(ix){
            var list;
            if(typeof ix == 'number' && ix<10){
                list = wrap.find('ul li')[ix];
            } else {
                list = ix;
            }
            $(list).children('.close').show();
            $(list).children('.open').hide();
            $(list).removeClass('hover-drop');
        }

        function hideSearchResult(){
            wrap.hide();
        }

        function showSearchResult(){
            wrap.show();
        }

        function bindHoverEvent(){
            ul_list.mouseover(function(ev){
                clearTimeout(loadTimer2);
                var self = $(this);
                reselectList(chooseListIndex);
                selectList(this);
                chooseListIndex = parseInt(self.attr('rank'));
                if(self.attr('data-hasInfo')=='true'){
                    loadTimer2 = setTimeout(function(){
                        closeList(openListIndex);
                        openList(self);
                        openListIndex = chooseListIndex;
                    }, 200)
                }
            })
        }

        function hasInfo(o){
            /**
             * A、Bktype=0（电影），都会显示右侧内容
             * B、bktype=2（综艺），vt=22，显示右侧内容
             * C、bktype=3（动漫），vt=3，显示右侧内容
             * D、所有bktype，vt=21，显示右侧内容
             */
            var t = o.bkType,vt = o.vt;
            return o.channelId>0 && (t==0||t==1||t==2||t==3) && ((t==0) || (t==2 && vt==22) || (t==3 && vt==3) || vt==21);
        }

        function getRedirectURL(item, chid, vt){
            var cid = chid ? chid : item.channelId;
            var videoType = vt ? vt: item.vt;
            return 'http://v.pptv.com/redirect/'+videoType+'/'+cid+'/'+item.isVirtual;
        }

        //虚拟频道的返回年份
        //真实频道正在更新的返回更新至？集
        //真实频道已完结的返回年份
        function getItemMask(data, ix){
            if(infoCache[ix].isVirtual){
                return /^\d{4}$/.test(infoCache[ix].years) ? infoCache[ix].years : '';
            } else {
                return (parseInt(data.vsValue)==4) ? (data.vsTitle ? ('更新至'+data.vsTitle) : '') : (/^\d{4}$/.test(infoCache[ix].years) ? infoCache[ix].years : '');
            }
        }

        //填充展开后图片右边部分、标题下边部分
        //由于这一部分逻辑太多，独立成一个function
        //对于电视剧、动漫有5种显示方式
        //1、2、3、4、5、6、7
        //1、2、3、4、5、6、...
        //1、2、3、4、5、...、15
        //7、6、5、4、3、2、1
        //15、14、13、12、11、...、1
        function getItemDD(data, ix){
            var tp_a = '<a href="$href" title="$title1" class="$a_class" target="_blank" rank="'+ix+'" stitle="'+infoCache[ix].name+'" keyword="'+keyword+'" channelid="'+infoCache[ix].channelId+'">$title2</a>';
            var tp_a2 = '<a href="$href" title="$title1" class="$a_class" target="_blank" rank="'+ix+'" stitle="'+infoCache[ix].name+'" keyword="'+keyword+'" channelid="'+infoCache[ix].channelId+'" style="width:auto;">$title2</a>';
            var tp_dd = '<dd><em>$director</em>$d_name</dd><dd class="actor"><em>$actor</em>$a_name</dd>';
            var dd = '';
            var item = infoCache[ix];
            var redirectUrl = getRedirectURL(item);

            var detail = []; //如果只有一集接口返回的是对象，如果有很多集接口返回的数组，需要做转化
            var isVirtual = item.isVirtual;
            var isEnd,sNum;
            if(isVirtual && item.bkType!=0){
                data.virtual[0].episode.length ? (detail = data.virtual[0].episode) : (detail.push(data.virtual[0].episode));
                isEnd = true;
                sNum = detail.length;
            } else if(item.bkType!=0){
                data.video_list.video.length ? (detail = data.video_list.video) : (detail.push(data.video_list.video));
                isEnd = (parseInt(data.vsValue)==4) ? false : true;
                data.video_list_count = Number(data.video_list_count);
                sNum = data.video_list_count ? data.video_list_count : detail.length;
            }
            if(item.bkType==2){
                var temp = '';
                for(var i=0,length=(sNum>3?3:sNum); i<length; i++){
                    temp += tmpl(tp_a,{
                        href: getRedirectURL(item, detail[i]._attributes.id, detail[i]._attributes.vt),
                        title1: detail[i]._attributes.title,
                        title2: detail[i]._attributes.title,
                        a_class: ''
                    })
                }
                dd = '<dd class="zylist">'+ temp +'</dd>';
            } else if(item.bkType==0 || item.bkType==1 || item.bkType==3){
                var directors = data.director.split(',');
                var actors = data.act.split(',');
                var temp_dname='',temp_aname='';
                temp_dname = directors[0] ? tmpl(tp_a,{
                    href: action+encodeURIComponent(directors[0]),
                    title1: directors[0],
                    title2: directors[0],
                    a_class: ''
                }) : '--';
                for(var i=0,length=actors.length; i<length; i++){
                    temp_aname += tmpl(tp_a,{
                        href: action+encodeURIComponent(actors[i]),
                        title1: actors[i],
                        title2: actors[i],
                        a_class: ''
                    })
                }
                dd = tmpl(tp_dd,{
                    director: item.bkType==3 ? '监督：' : '导演：',
                    actor: item.bkType==3 ? '声优：' : '演员：',
                    d_name: temp_dname,
                    a_name: temp_aname
                });
                if(item.bkType==1 || item.bkType==3){
                    var temp = [];
                    if(isEnd && sNum<=7){
                        for(var i=0; i<sNum; i++){
                            temp.push({
                                href:getRedirectURL(item, detail[i]._attributes.id, detail[i]._attributes.vt),
                                title1:detail[i]._attributes.title,
                                title2:detail[i]._attributes.title,
                                a_class: ''
                            })
                        }
                    } else if(isVirtual && sNum>7){
                        for(var i=0; i<6; i++){
                            temp.push({
                                href:getRedirectURL(item, detail[i]._attributes.id, detail[i]._attributes.vt),
                                title1:detail[i]._attributes.title,
                                title2:detail[i]._attributes.title,
                                a_class: ''
                            })
                        }
                        temp.push({
                            href:redirectUrl,
                            title1:'更多',
                            title2:'...',
                            a_class:''
                        })
                    } else if(!isVirtual && isEnd && sNum>7){
                        for(var i=0; i<5; i++){
                            temp.push({
                                href:getRedirectURL(item, detail[i]._attributes.id, detail[i]._attributes.vt),
                                title1:detail[i]._attributes.title,
                                title2:detail[i]._attributes.title,
                                a_class: ''
                            })
                        }
                        temp.push({
                            href:redirectUrl,
                            title1:'更多',
                            title2:'...',
                            a_class:''
                        });
                        temp.push({
                            href:getRedirectURL(item, detail[sNum-1]._attributes.id, detail[sNum-1]._attributes.vt),
                            title1:detail[sNum-1]._attributes.title,
                            title2:detail[sNum-1]._attributes.title,
                            a_class:''
                        });
                    } else if(!isEnd && sNum<=7 && !isVirtual){
                        temp.push({
                            href:getRedirectURL(item, detail[sNum-1]._attributes.id, detail[sNum-1]._attributes.vt),
                            title1:detail[sNum-1]._attributes.title,
                            title2:detail[sNum-1]._attributes.title+'<i class="ui-icon-point-new"></i>',
                            a_class:'nohidden'
                        });
                        for(var i=sNum-2; i>=0; i--){
                            temp.push({
                                href:getRedirectURL(item, detail[i]._attributes.id, detail[i]._attributes.vt),
                                title1:detail[i]._attributes.title,
                                title2:detail[i]._attributes.title,
                                a_class:''
                            })
                        }
                    } else if(!isEnd && sNum>7 && !isVirtual){
                        temp.push({
                            href:getRedirectURL(item, detail[sNum-1]._attributes.id, detail[sNum-1]._attributes.vt),
                            title1:detail[sNum-1]._attributes.title,
                            title2:detail[sNum-1]._attributes.title+'<i class="ui-icon-point-new"></i>',
                            a_class:'nohidden'
                        });
                        for(var i=sNum-2; i>sNum-6; i--){
                            temp.push({
                                href:getRedirectURL(item, detail[i]._attributes.id, detail[i]._attributes.vt),
                                title1:detail[i]._attributes.title,
                                title2:detail[i]._attributes.title,
                                a_class:''
                            })
                        }
                        temp.push({
                            href:redirectUrl,
                            title1:'更多',
                            title2:'...',
                            a_class:''
                        })
                        temp.push({
                            href:getRedirectURL(item, detail[0]._attributes.id, detail[0]._attributes.vt),
                            title1:detail[0]._attributes.title,
                            title2:detail[0]._attributes.title,
                            a_class:''
                        })
                    }
                    var temp2 = '';
                    for(var i=0; i<temp.length; i++){
                        if(temp[i] && (isInt(temp[i].title1) || temp[i].title2=='...')){
                            temp2+=tmpl(tp_a, temp[i]);
                        } else {
                            temp2+=tmpl(tp_a2, temp[i]);
                        }
                    }
                    dd+='<dd class="tvlist cf">'+temp2+'</dd>';
                }
            }
            return dd;
        }

        function fillData(data){
            ul.html('');
            var key = data[0];
            data = data[1];
            if(!data || data.length<1){
                ul_list = [];
                hideSearchResult();
                return;
            }
            var item;
            for(var i=0; i<data.length; i++){
                item = data[i];
                infoCache[i] = {
                    name : item.name,
                    years : item.years,
                    picUrl : item.picUrl ? (/^http:\/\//.test(item.picUrl) ? item.picUrl : ('http://img6.pplive.cn/sp75/'+item.picUrl)) : 'http://static9.pplive.cn/pptv/index/v_20120627103907/css/pptv.png',
                    channelId : item.channelId,
                    bkType : item.bkType,
                    vt : item.vt,
                    isVirtual : item.isVirtual  //从搜索接口取virtual信息 0\1
                };
                ul.append(tmpl(tp_li,{
                    channelId : item.channelId,
                    keyword : keyword,
                    index : i,
                    hasInfo : hasInfo(item)?'true':'false',
                    numclass : i>2?'num':'num topnum',
                    numdisplay : isTopSearch?'':'none',
                    num : i+1,
                    href : hasInfo(item)?getRedirectURL(item):(action+decodeURIComponent(item.name)),
                    title : item.name,
                    arrowdisplay : hasInfo(item)?'':'none',
                    target : location.href.indexOf('http://search.pptv.com') === 0 ? '_self' : '_blank'
                }));
            }
            ul_list = ul.children('li');
            searchlog.suggestClick(ul);
            bindHoverEvent();
            if(!isTopSearch){
                topSearchTxt.hide();
            }
            setTimeout(showSearchResult,100);
        }

        //加上loaded样式
        //填充展开后的内容
        function fillDetail(data,ix){
            var odv = $(ul_list[ix]).children('.open');
            odv.html('');
            if(!data || data.length<1){
                $(ul_list[ix]).attr('data-hasInfo','false');
                closeList(ix);
                openListIndex=-1;
            }
            infoCache[ix].mask = getItemMask(data, ix);
            infoCache[ix].dd = getItemDD(data, ix);
            var item = infoCache[ix];
            odv.append(tmpl(tp_op,{
                numclass : ix>2?'num':'num topnum',
                numdisplay : isTopSearch?'':'none',
                num: parseInt(ix)+1,
                href: getRedirectURL(item),
                imgsrc: item.picUrl,
                title: item.name,
                subtitle: item.mask,
                updateClass: item.mask ? '' : 'noupdate',
                dd: item.dd,
                index : ix,
                channelId : item.channelId,
                keyword : keyword
            }))
            searchlog.suggestClick(odv);
            $(ul_list[ix]).addClass('loaded');
        }

        /**
         * [loadData description]
         * @param  {[type]} key [key为空加载热搜，否则加载搜索]
         * @return {[type]}     [description]
         */
        function loadData(key){
            keyword = key;
            if(!key){
                isTopSearch = true;
                if(topDataCache){
                    fillData(topDataCache);
                    openList(0);
                    openListIndex=0;
                    chooseListIndex=0;
                    return;
                }
                $.ajax({
                    type : 'GET',
                    cache:true,
                    dataType:'jsonp',
                    jsonp:'cb',
                    jsonpCallback:'recTopData',
                    url:topSearchUrl,
                    data:{
                        platform:'ikan',
                        hasVirtual:'0',
                        areaCode:codePPI.getCityCode(),
                        coolUser:codePPI.getUserType(),
                        cnt:10
                    },
                    success:function(data){
                        if(!data[0] || data[0].length<=0){
                            return;
                        }
                        var d=[];
                        d[0] = '';
                        d[1] = [];
                        for(var i=0,length=data[0].length; i<length; i++){
                            d[1][i] = {};
                            d[1][i].name = data[0][i].title;
                            d[1][i].years = data[0][i].year;
                            d[1][i].picUrl = data[0][i].coverPic;
                            d[1][i].channelId = data[0][i].id;
                            d[1][i].bkType = data[0][i].bkType;
                            d[1][i].vt = data[0][i].videoType;
                            d[1][i].isVirtual = data[0][i].isVirtual;
                        }
                        topDataCache = d;
                        fillData(d);
                        openList(0);
                        openListIndex=0;
                        chooseListIndex=0;
                    }
                })
            } else {
                isTopSearch = false;
                $.ajax({
                    type : 'GET',
                    cache:true,
                    dataType:'jsonp',
                    jsonp:'cb',
                    jsonpCallback:'recSearchData',
                    url:suggestUrl,
                    data:{
                        q:key,
                        cm:'ikan',
                        colordis:'red',
                        hasVirtual:'1',
                        vipdis:codePPI.getUserType(),
                        fm:codePPI.getCityCode(),
                        cnt:10
                    },
                    success:function(data){
                        if(!data[1] || data[1].length<=0){
                            return;
                        }
                        var d=[];
                        d[0]=data[0];
                        d[1]=[];
                        for(var i=0; i<data[1].length; i++){
                            d[1][i] = {};
                            d[1][i].name = data[1][i].name;
                            d[1][i].years = data[1][i].years;
                            d[1][i].picUrl = data[1][i].picUrl;
                            d[1][i].channelId = data[1][i].channelId;
                            d[1][i].bkType = data[1][i].bkType;
                            d[1][i].vt = data[1][i].vt;
                            d[1][i].isVirtual = data[1][i].isVirtual;
                        }
                        fillData(d);
                        chooseListIndex=-1;
                        openListIndex=-1;
                    }
                })
            }
        }

        //加载每一条的详细信息
        function loadDetail(ix){
            $.ajax({
                type : 'GET',
                cache : true,
                dataType : 'jsonp',
                jsonp : 'cb',
                jsonpCallback : 'recDetailData',
                url : detailUrl,
                data : {
                    auth : UID ? UID : 'noauth',
                    vid : infoCache[ix].channelId,
                    mode : 'onlyset',
                    virtual : 1,
                    series : 1,
                    platform : 'ikan',
                    userLevel : codePPI.getUserType()
                },
                success : function(data){
                    if(data.err){
                        return;
                    }
                    fillDetail(data.v,ix);
                }
            })
        }

        //初始化文字轮换
        function initSwitch(open){
            if(open){
                switchInterval = setInterval(function(){
                    if(getTxt()==defTxt){
                        textListIndex++;
                        if(textListIndex==textList.length){
                            textListIndex = 0;
                        }
                        input.attr('value', textList[textListIndex]);
                        defTxt = input.attr('value');
                    }
                }, 5*1000);
            } else {
                clearInterval(switchInterval);
            }
        }

        $(window).on('scroll',function(){
            hideSearchResult();
            input.blur();
        })

        this.init = function(opt){
            if(!form){
                return;
            }
            var option = opt || {};

            initEvn(option);
            bindFormEvent();
            if(textList.length>0){
                initSwitch(!keys);
            }
        };
    };

    return Suggest;
});
