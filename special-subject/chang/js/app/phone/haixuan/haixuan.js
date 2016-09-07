/**
 * Sample
 * @param  {[type]} require     [description]
 * @param  {[type]} exports     [description]
 * @param  {[type]} module){} [description]
 * @return {[type]}             [description]
 */
define(function(require, exports, module){
	var $ = require('jquery');
	var loader = require('./../../../util/loader/loader');
	var lazyload = require('./../../../util/lazyload/loadmoreupdate');
	var Swiper = require('../../../util/swipe/swiper.min.js');
	var platform = require('../../../util/platform/plt');
	$.fn.lazyload = lazyload.init;
	var isIpad=(function(){
        var ua = navigator.userAgent.toLowerCase();
        return /\(ipad/i.test(ua);
    })();
	//海选分区滑动菜单上的参数转化为object
	function resolveParam(str){
		var arr = str.split("&");
		var data = {};
		for( var i = 0 ; i < arr.length ; i++ ){
			var arrs = arr[i].split("=");
			data[arrs[0]] = arrs[1];
		}
		return data
	}
	function isApp(){
		var search = window.location.search;
		search = search.substring(1,search.length);
		var data = resolveParam(search);
		return (data["type"] == "app" || data["type"] == "ipad" || platform.platform === 'ipad');
	}

	function toTime(temp){
        temp = temp.replace(/-/g, "/");
        var date = new Date(Date.parse(temp));
        return date.getTime();
	}
	//这个是没有缓存到Oms上的数据（刚刚上传的视频，不会被持久化到oms上的，张金做了缓存）
	function evalNotOms(data){
		var datas = [];
		var username = $('.ids').length > 0 ? $.trim($('.ids').text()) : $.trim($('.module-audition-updown .name').text()) ;
		var userId = $("#username").val();
		if(data){
			for(var key in data){
				var dat = data[key];
				dat.dp = {
					title:dat.title,
				};
				dat.player_info = {
					username : userId,
					real_name : username
				}
				dat.status = 0;
				datas.push(dat);
			}

		}
		return datas;
	}
	function testDate(data){
		var i = 1000;
		var datas = {};
		for(var key in data){
			var dat = data[key];
			time = toTime(dat.create_at);
			datas[time] = dat;
		}
		var data_bak = {};
		for (var key in datas) {
			data_bak[i] = datas[key];
			i--;
		};
		//console.info(data_bak);
		return data_bak;
	}
	//个人视频的接口和海选分区的接口返回的数据格式不一样，在这里做数据转换，保持html拼接接口一致
	function evalData2(data,datas){
		//data = testDate(data);
		var tempDataArr=[];
		var username = $('.ids').length > 0 ? $.trim($('.ids').text()) : $.trim($('.module-audition-updown .name').text()) ;
		for(var key in data){
			if( key)
			var dat = data[key];
			dat.app_link = dat.app_link;
			dat.dp = dat.dpinfo;
			dat.votenum = dat.votenum ? dat.votenum : {};
			dat.like_vote = dat.votenum.like;
			dat.dislike_like_vote = dat.votenum.dislike;
			dat.like_vote_format = dat.votenum.like_fromat;
			dat.dislike_vote_format = dat.votenum.dislike_fromat;
			dat.player_info = {};
			dat.player_info.username = $("#username").val();
			dat.player_info.real_name = username;
			dat.createMills=new Date(dat.create_at.replace(/-/g,'/')).getTime();
			tempDataArr.push(dat);
		}
		tempDataArr.sort(function(a,b){
			//倒序排列
			return b.createMills-a.createMills
		});
		//console.log(tempDataArr);
		datas=datas.concat(tempDataArr);
		return datas;
	}
	//个人视频的接口和海选分区的接口返回的数据格式不一样，在这里做数据转换，保持html拼接接口一致 data return.info ,data1: return.notOms
	function evalData(data,data1){
		var datas = [];
		if( data1 ){
			datas = evalNotOms(data1);
		}
		datas = evalData2(data,datas);
		return datas;
	}


	//把处理（evalXXX）过的数据转化为html字符串
	function evalHtml(data){
		var arr = [];
		var IsApp = isApp();
		//是否是自己查看自己的个人中心
		var isCenter = ( window.location.pathname.indexOf("app/space") > -1 || window.location.pathname.indexOf("app/space/") > -1 || window.location.hostname == "space.chang.pptv.com" ) ? true : false;
		//如果存在PassPortUserName这个隐藏域 判断是否和username一样
		if( $("#PassPortUserName").length > 0 ){
			isCenter = ( $("#PassPortUserName").val() == $("#username").val() );
		}
		for( var i = 0 ; i < data.length ; i++ ){

			var datas = data[i];
			if(datas.player_info.is_group==1){
				datas.player_info.real_name=datas.player_info.group_name;
			}
			if( datas.status == 0 ){
				if(!isCenter) continue;//不是在个人中心 就下一个
				arr.push([
					'<div class="item ">',
					'	<div>',
					'		<div class="v_ing"></div>',
					'	</div>',
					'	<div>',
					'		<span class="video-name">'+ datas.dp.title+'</span>',//'		<span class="video-name"> <a href="'+datas.link+'">'+ datas.dp.title+'</a></span>',
					'		<span class="video-name s-name"><a class="rationame">'+ datas.player_info.real_name +'</a></span>',
					'		<div class="isgreet-w">',
					'			<div class="up">',
					datas.like_vote_format,
					'			</div>',
					'			<div class="down">',
					datas.dislike_vote_format,
					'			</div>',
					'		</div>',
					'	</div>',
					'</div>'
				].join(""))
			}else if( datas.status == 2 ){
				if(!isCenter) continue;//不是在个人中心 就下一个
				arr.push([
					'<div class="item ">',
					'	<div>',
					'		<div class="v_fail"></div>',
					'	</div>',
					'	<div>',
					'		<span class="video-name"> '+ datas.dp.title+'</span>',//'		<span class="video-name"> <a href="'+datas.link+'">'+ datas.dp.title+'</a></span>',
					'		<span class="video-name s-name"> <a class="rationame">'+ datas.player_info.real_name +'</a></span>',
					'		<div class="isgreet-w">',
					'			<div class="up">',
					datas.like_vote_format,
					'			</div>',
					'			<div class="down">',
					datas.dislike_vote_format,
					'			</div>',
					'		</div>',
					'	</div>',
					'</div>'
				].join(""))
			}else{
				if(!!isIpad){
					var tempLink='<a href="'+(IsApp ? datas.link : datas.app_link)+'" style="background-color:#323232;"><img data-src="'+datas.dp.picurl+'" src="http://sr3.pplive.com/cms/29/99/82a09d9163f75597527c23664f4c3658.jpg"></a>'
				}else{
					var tempLink='<a href="'+(IsApp ? datas.link : datas.app_link)+'"><img data-src="'+datas.dp.picurl+'" src="http://sr1.pplive.com/cms/16/31/85d797962d52321b9e53cfeab66e92d6.jpg" ></a>'
				}
				arr.push([
					'<div class="item ">',
					'	<div>',
					tempLink,
					'	</div>',
					'	<div>',
					'		<span class="video-name"> <a href="'+ (IsApp ? datas.link : datas.app_link) +'">'+ datas.dp.title+'</a></span>',
					'		<span class="video-name s-name"> <a class="rationame">'+ datas.player_info.real_name +'</a></span>',
					'		<div class="isgreet-w">',
					//'			<div class="up" onclick="voteVideo(this,\'up\',\''+datas.dp.id+'\')">',
					'			<div class="up">',
					datas.like_vote_format,
					'			</div>',
					//'			<div class="down" onclick="voteVideo(this,\'down\',\''+datas.dp.id+'\')">',
					'			<div class="down">',
					datas.dislike_vote_format,
					'			</div>',
					'		</div>',
					'	</div>',
					'</div>'
				].join(""))
			}

		}
		return arr;
	}

	//把html字符串添加到dom中
	function insert(tar,htmls,index){
		$(tar).children(".video-l").length == 0 ?  $(tar).append('<div class="video-l"></div>') : '';
		if( $(tar).is(".cloums2") || $(tar).is(".cloums3") || $(tar).is(".cloums4")){
			for(var i = index;i<htmls.length;i++){
				$(tar).children(".video-l:last").append(htmls[i]);
			}
			return;
		}
		var colums = $(tar).attr("cloums") ? $(tar).attr("cloums") - 0 : 2 ;
		for(var i = index;i<htmls.length;){
			var str = '<div class="video-l">';
			for( var j = 0 ; j < colums ; j++ ){
				if( i < htmls.length ){
					str+= htmls[i];
					i++;
				}else{
					str+= '<div class="item empty"></div>'
				}
			}
			str+='</div>';
			$(tar).append(str);
		}
	}

	function InsertAll(htmls,tar){
	//	console.log(htmls.length);
		var last = $(tar).children(".video-l:last").children(".item.empty").length
	//	console.log($(tar).children(".video-l:last").children(".item.empty"));
		$(tar).children(".video-l:last").children(".item.empty").remove();
		for( var i = 0 ; i < last;i++){
			$(tar).children(".video-l:last").append(htmls[i]);
		}
		//console.log($(tar));
		//console.log(last);
		//return;
		insert(tar,htmls,last )
	}
	function preInsert(data,tar){
		var htmls = evalHtml(data);
		InsertAll(htmls,tar);
	}
	//个人视频插数据到dom接口，先处理数据，再插入
	function PersonalInsert(data,tar){
		// console.info("PersonalInsert");
		var datas = evalData(data);
		preInsert(datas,tar);
	}
	//如果是第一次加载个人页面（个人中心和个人space或者其他的）回移除第一次（后台）加载的那几个视频，从新覆盖，上传视频模块除外
	function removeLoaded(tar){
		var list = $(tar).find(".video-l");
		if( list.length > 1 ){
			for( var i = 1 ; i < list.length ; i++ ){
				$(list[i]).remove();
			}
		}
		var item = $(tar).find(".video-l .item");
		for( var i = 0 ; i < item.length ; i++ ){
			if( !$(item[i]).is(".item-upload") ) $(item[i]).remove();
		}
	}
	var item = (function(){
		var item = function(obj,parent){
			this.target = obj;
			this.parent = parent;
			this.index = $(obj).index();
			this.status = 1;
			this.init();
		}
		var prop = item.prototype;
		prop.init = function(){
			this.resolveParam();
			this.bindClick();
		}
		prop.resolveParam = function(){
			var str = $(this.target).attr("parmas");
			var param = resolveParam(str);
			param.page = 9;
			param.start = ( this.index == 0 ) ? 10 : 0;
			this.param = param;
			if ( this.index == 0 )  this.parent.active = this;
		}
		prop.bindClick = function(){
			var self = this;
			$(this.target).click(function(){
				$(this).siblings().removeClass("active");
            	$(this).addClass("active");
            	self.setTar();
            	if($('#swper').css('visibility')=='hidden'){
            		document.getElementById('swper').scrollIntoView();
            	}
			})
		}
		//显示当前的模块，并把对应的实例设为parent的active
		prop.setTar = function(item){
			var target=this.target;
			var topOffset=target[0].getBoundingClientRect().top;
			var winH=window.innerHeight;
			var menuHeight=$(".module-menu-slider").height();
			var tempMinH=winH-topOffset+menuHeight;
			var tar = $("[for="+this.parent.target[0].id+"]").find(".module.module-video").eq(this.index);
			tar.siblings().each(function(){
				$(this).is("hidden") ? "" : $(this).addClass("hidden");
			})
			tar.removeClass("hidden");
			this.parent.active = this;
			if( this.param.start == 0 ) this.loadPage(tempMinH);
			this.setStatus();
		}
		//设置父容器的状态
		prop.setStatus = function(){
			var tar = $("[for="+this.parent.target[0].id+"]");
			var loaded = ( this.status == 2 )? "done":"loading"
			tar.attr("data-loaded",loaded);
		}
		prop.loadPage = function(minH){
			if(!!minH){
				$(".lazyimg").css('minHeight',minH);
			}

			var tar = $("[for="+this.parent.target[0].id+"]").find(".module.module-video").eq(this.index);
			var self = this;
			var param = this.param;
			param.stop = param.start+param.page;
			//写死app
			param.plt='app';
			param.__config__={
				cdn:true,
				callback:'marqueelist'
			}
			this.backStatus = this.status;
			this.status = 0;
			loader.load(
				'http://chang.pptv.com/api/rank_list',
				self.param,
				function(data){
					self.status = data.length > 0 ? 1 : 2;
					// console.info('loadSuccess');
					self.setStatus();
					self.param.start += data.length;
					self.append(data,tar);
					$(".lazyimg").css('minHeight',0);
					lazyload.update();
				},
				function(data){
					self.status = self.backStatus;
					// console.info("error")
				}
			);
		}
		prop.append = function(data,tar){
			preInsert(data,tar)
		}


		return item;
	})();

	var loaditem = (function(){
			var loaditem = function(id){
				if( $("#"+id).attr("loaditem") == "done" ) return;
				this.target = $("#"+id);
				this.id = id;
				this.init();
				this.bindScroller();
				//this.initSwiper();
				this.active.loadPage();
				this.listenFix();
				this.inited();
			}
			var prop = loaditem.prototype;
			prop.init = function(){
				var self = this;
				var arr = new Array();
				$(this.target).find(".swiper-slide.menu-slider-item").each(function(){
					arr.push( new item( $(this) , self ) );
				})
			}

			prop.inited = function(){
				$(this.target).attr("loaditem",'done');
			}
			prop.initSwiper = function(){
				new Swiper('.module.module-menu-slider', {
			        slidesPerView: 'auto'
			    });
			}
			prop.bindScroller = function(){
				var self = this;

				$("[for="+this.id+"]").lazyload(function(el){
		            var status = self.active.status;
		            if( status == 0 ){
		            	// console.info('loading');
		            }else if( status == 1 ){
		            	//console.log('loadmore');
		            	self.active.loadPage();
		            }else if( status == 2 ){
		            	//alert("___end");
		            	  // 已经最后一页，阻止再次执行
		            	el.attr("data-loaded","done");
		                return;
		            }
		        });
			}
			prop.bindFakeFixedEle=function(){
				var tempHtml=this.target.parent().html();
				this.fakeFixedEle=$(tempHtml);
				this.fakeFixedEle.addClass('fixed hidden');
				this.fakeFixedEle.attr('id','fakeFixed');
				var self=this;
				$("body").prepend(this.fakeFixedEle);
//				console.log(this.fakeFixedEle.find(".menu-slider-item"));
				this.fakeFixedEle.find(".menu-slider-item").on('click',function(){
					var tempObj=$(this);
					var idx=tempObj.index();
					tempObj.siblings().removeClass('active');
					tempObj.addClass('active');
					$("#swper .menu-slider-item").eq(idx).trigger('click');
				});
			},
			prop.listenFix = function(){
				this.bindFakeFixedEle();
				var self=this;
				var targetRel=$(".lazyimg")[0];
				var targetMain=this.target;
				var targetH=targetMain.height();
				var obj=this.target[0];
				var scrollTimer=null;
				document.body.addEventListener("touchstart",function(e){
					var top=obj.getBoundingClientRect().top;
					var relTop=targetRel.getBoundingClientRect().top;
					if( !self.fakeFixedEle.hasClass('hidden')&&relTop>targetH){
						targetMain.css("visibility",'visible');
						self.fakeFixedEle.addClass('hidden');
					}else if(top<0&&!!self.fakeFixedEle.hasClass("hidden")){
						//getIndex
						var idx=$("#swper .menu-slider-item.active").index();
						var tempDoms=self.fakeFixedEle.find('.menu-slider-item');
						tempDoms.removeClass('active');
						tempDoms.eq(idx).addClass('active');
						self.fakeFixedEle.removeClass('hidden');
						targetMain.css("visibility",'hidden');
					}
				},false);
				window.addEventListener("scroll",function(e){
					var top=obj.getBoundingClientRect().top;
					var relTop=targetRel.getBoundingClientRect().top;
					if( !self.fakeFixedEle.hasClass('hidden')&&relTop>targetH){
						targetMain.css("visibility",'visible');
						self.fakeFixedEle.addClass('hidden');
					}else if(top<0&&!!self.fakeFixedEle.hasClass("hidden")){
						var idx=$("#swper .menu-slider-item.active").index();
						var tempDoms=self.fakeFixedEle.find('.menu-slider-item');
						tempDoms.removeClass('active');
						tempDoms.eq(idx).addClass('active');
						self.fakeFixedEle.removeClass('hidden');
						targetMain.css("visibility",'hidden');
					}
				},false);
			}
			return loaditem;
	})();


	var loadPlayerVideo = (function(){
		var loadPlayerVideo = function(func){
			this.start = -1;
			this.status = 1;
			this.num = 20;
			this.page = 1;
			//this.username = username;
			if ( func &&  (typeof func ).toLowerCase() == "function" ){
				this.func = func;
			}else{
				this.func = function(){}
			}
			this.init();
			this.loadPage();
		}
		var prop = loadPlayerVideo.prototype;
		prop.init = function(){
			this.bindLazyLoad();
		}
		prop.bindLazyLoad = function(){
			var self = this;
			var wrap = $(".module.module-video").not('.module-singleupload');
			wrap.lazyload(function(el){
	            var status = self.status;
	            if( status == 0 ){
	            	// console.info('loading');
	            }else if( status == 1 ){
	            	// console.log('loadmore');
	            	self.loadPage();
	            }else if( status == 2 ){
	            	// 已经最后一页，阻止再次执行
	            	el.attr("data-loaded","done");
	                return;
	            }
	        });
		}
		prop.loadPage = function(){
			var tar = $(".module.module-video");
			if( this.start == -1 ) this.start = this.initStart();

			var self = this;
			var param = {};
			param.page = this.page;
			param.num = this.num;
			param.username = $("#username").val();
			param.__config__={
				cdn:true,
				callback:'getVideoList'
			};
			param.plt='app';
			this.backStatus = this.status;
			this.status = 0;
			var isSelf = ( window.location.pathname.indexOf("app/space") > -1 || window.location.pathname.indexOf("ipad/space") > -1 || window.location.pathname.indexOf("app/space/") > -1 || window.location.hostname == "space.chang.pptv.com" ) ? true : false;
			if(isSelf==true){
				var loadLink='http://api.chang.pptv.com/api/video_list_player';
			}else{
				var loadLink='http://chang.pptv.com/api/video_list';
			}
			loader.load(
				loadLink,
				param,
				function(data){
					if((data.err==0&&isSelf==false)||isSelf==true){
						if(isSelf==false){
							var data=data.data;
						}
						/*console.log(data);
						console.log(data.data);
						if($.isEmptyObject(data.info)&&typeof data.NotOms=="undefined"){
							!!self.wrap&&self.wrap.attr('data-loaded','done');
							return;
						}*/
						data = evalData(data.info,data.NotOms);
						self.status = ( data.length == self.num ) ? 1 : 2;

						if( self.page == 1 ){
							removeLoaded(tar);
						}
						self.page ++;
						preInsert(data,tar);
						self.setStatus();
						$(".module.module-video").removeClass("module-singleupload");
						self.func.call(self,data);
						lazyload.update();
					}
				},
				'',
				function(data){
					self.status = self.backStatus;
				}
			);
		}
		prop.setStatus = function(){
			var tar = $(".module.module-video");
			if( this.status == 2 ){
				tar.attr("data-loaded","done");
			}
		}
		prop.initStart = function(){
			var el = ".module.module-video .video-l .item";
			return $(el).length - $( el+ ".item-upload").length - $(el+".empty").length;
		}
		return loadPlayerVideo;
	})();


	var loaders =  function(id){
		return new loaditem(id);
	}

	loaders.insert = function(data,tar){
		preInsert(data,tar)
	}
	loaders.loadVideo = function(func){
		return new loadPlayerVideo(func);
	}
	module.exports = loaders;
});
