/**
 * @author  Erick Song
 * @date    2012-08-30
 * @email   ahschl0322@gmail.com
 * @info    网站历史记录功能
 *
 */

define(function(require) {

    var $ = require('jquery'),
        JSON = require('../json/json'),
        log = require('../log/log'),
        puid = require('./puid')
    ;


    puid.getPuid(function(_puid){
        puid = _puid;
    });


    var History = {
		load : function(action, params, callback, domain){
			var parsList = [], item,
                url = 'http://' + (typeof(domain) == 'undefined' ? 'c1' : domain) + '.pptv.com/stg/';

            log(action ,' : ', params);

			$.ajax({
				dataType: 'jsonp',
				type: 'GET',
				url: url + action + '?' + $.param(params),
				jsonp: 'cb',
				data: { format  : 'jsonp' },
                //cache : false,
				success: function(data) {
					if (data && data.error === 0) {
						if (callback && typeof(callback) == 'function') {
							callback.apply(null,arguments);
						}
					}
				}
			});

		},
		set : function(params, callback){
			this.load('set', params, callback);
		},
		get : function(params, callback){
			this.load('get', params, callback);
		},
		add : function(params, callback){
			this.load('add', params, callback);
		},
		remove : function(params, callback){
			this.load('remove', params, callback);
		},
		clear : function(key, callback){
			this.load('set',{
                key : key,
                value : '',
                expire : 0
            }, callback);
		}
	};

	var PlayHistory = {
        key:'play_history',
        expire:365*24*60*60,
        max:8,
		set : function(value,callback){
            if(!isArray(value)){
                value = [value];
            }
            for(var i=0,l=value.length;i<l;i++){
                value[i] = $.JSON.encode(value[i]);
            }
            History.set({
                key : this.key,
                value : value,
                expire : this.expire,
                max_len : this.max
            }, callback);
		},
		get : function(callback){
            History.get({
                key : this.key,
                max_len : this.max
            }, callback);
		},
		add:function(value,callback){
            History.add({
                key : this.key,
                value : JSON.stringify(value),
                expire : this.expire,
                ut : 1,//去除已存在的，追加新的记录
                max_len : this.max
            },callback);
		},
		remove:function(index,callback){
            History.remove({
                key : this.key,
                index : index,
                expire : this.expire
            },callback);

		},
		clear:function(callback){
			History.clear(this.key,callback);
		}
	};

    var SearchHistory = {
        key:'search_history',
        expire:365*24*60*60,
        max:6,
        set : function(value,callback){
            if(!isArray(value)){
                value = [value];
            }
            for(var i=0,l=value.length;i<l;i++){
                value[i] = $.JSON.encode(value[i]);
            }
            History.set({
                key : this.key,
                value : value,
                expire : this.expire,
                max_len : this.max
            }, callback);
        },
        get : function(callback){
            History.get({
                key : this.key,
                max_len : this.max
            }, callback);
        },
        add:function(value,callback){
            History.add({
                key : this.key,
                value : JSON.stringify(value),
                expire : this.expire,
                ut : 1,//去除已存在的，追加新的记录
                max_len : this.max
            },callback);
        },
        remove:function(index,callback){
            History.remove({
                key : this.key,
                index : index,
                expire : this.expire
            },callback);

        },
        clear:function(callback){
            History.clear(this.key,callback);
        }
    };

	var NavHistory = {
        trigger:null,   //#mini_record
        holder:null,    //#fu_historylist
        listDiv:null,   //.fu_history
        recommend:null, //.fu_recommend
        build:function(){
            if(!this.trigger&&!this.holder&&!this.listDiv) return;
            //获取一次数据，并将构建好的html插入到制定的div里面
            var self = this;

            function show() {
                self.trigger.addClass('hover his_active');
                self.holder.show();
            }
            function hide() {
                self.trigger.removeClass('hover his_active');
                self.holder.hide();
            }
            function displayRecommend(display){
                if(self.recommend){
                    self.recommend.css('display',display||'block');
                }
            }
            displayRecommend('none');

            function _build(){

                PlayHistory.get(function(d){
                    var list = d.value||[];
                    list.reverse();
                    if(d.error==1){
                        self.recommend.html('<p>'+d.message+'</p>');
                    }else{
                        if (list.length < 1) {
                            self.listDiv.hide();
                            displayRecommend('block');
                        }else{
                            self.listDiv.show();
                            displayRecommend('none');
                            self.listDiv.find('.fu_lists').html(self._makeListHtml(list));
                            self._bindHtmlEvent();
                        }
                    }
                });
            }

            self.holder.find('.fu_delall').on('click', function (ev) {
                ev.preventDefault();
                PlayHistory.clear(function(){
                    self.listDiv.hide();
                    displayRecommend('block');
                });
            });
            self.holder.find('.fu_viewall').hide();
            self.holder.find('.fu_viewall').on('click',function(ev){
                ev.preventDefault();
                //判断登录逻辑
                seajs.use('user',function(user){
                    log('user : ', user);
                    var islogin = user.isLogined;
                    if(!islogin){
                        //seajs.use('login.init', [{type : 'login'}]);
                    }
                });

            });

            self.trigger.hover(function(){
                show();
                _build();
            },function(){
               hide();
            });

            self.holder.hover(show,hide);

        },
        _bindHtmlEvent:function (){
            var self = this;
            var del = self.listDiv.find('.fu_del');

            self.listDiv.find('dl').hover(function(){
                $(this).addClass('hover');
            },function(){
                $(this).removeClass('hover');
            });

            del.on('click',function(ev){
                ev.preventDefault();
                var el = this;
                PlayHistory.remove($(this).attr('data-index'),function(d){
                    if(d.error === 0){
                        var p = $(el.parentNode.parentNode);
                        p.remove();
                        if($(self.listDiv).children().length < 1){
                            if($(self.recommend)){
                                $(this).find('.fu_delbox').css('display','none');
                                $(self.recommend).css('display','block');
                            }
                        }
                    }
                });
            });
        },
        _makeListHtml:function(list){
            var html = [];
            for (var i = 0, len = list.length; i < len; i++) {
                var item = list[i];
                var value = $.parseJSON(decodeURIComponent(item.value));
                var relUrl = this.pushUrl((value.Link || value.link));
                html.push('<dl class="'+(i==len-1?'fu_nobd':'')+'"><dt>');
                html.push('<a href="'+relUrl + '?rcc_starttime='+ (value.Pos || value.pos) +'" title="'+ (value.Name || value.name) +'" target="_play">' + (value.Name || value.name) + '</a>'); //兼容线上播放页
                html.push('<a href="' + relUrl + '" class="fu_del" data-index="'+item.index+'" title="删除本条记录"></a>');
                html.push('</dt><dd></dd></dl>'); //<span>'+ value.time +'</span><a class="fu_cont" href="' + relUrl + '?rcc_starttime='+ value.pos +'" target="_play"> '+ (value.pos != -1 ? '继续观看' : '重新观看') +'</a>
            }
            return html.join('');
        },
        pushUrl:function(s) {
            return s.indexOf('http') > -1 ? s : 'http://v.pptv.com/show/' + s + '.html';
        },
        parseUrl:function(s) {
            return s.indexOf('http') > -1 ? (s.match(/.*?v.pptv.com\/(.*?)\.html/)[1]) : s;
        }
	};

    window.History = History;   //兼容顶踩

	return {
		History : History,
		PlayHistory : PlayHistory,
        SearchHistory:SearchHistory,
		NavHistory : NavHistory
	};

});
