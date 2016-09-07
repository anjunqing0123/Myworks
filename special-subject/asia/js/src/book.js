define(function(require, exports, module) {
	var $ = require('jquery');
	var TIME_URL = "http://time.pptv.com";
	var reserveSrc = "http://huodong.api.pptv.com/asia-music/api/pg_book?";
	//计时器
	function TimeTick(gapTime,ao){
		this.running = false;
		//间隔时间
		this.interval = gapTime;
		//作用对象
		this.actionObejct = ao;
		//timer事件
		this.onTimer = null;
		//最近时间
		this.lastTime = 0;
		this._timer = 0;
	};
	TimeTick.prototype = {
		start : function(){
			var that = this;
			if(this.running) return;
			this.running = true;
			this.lastTime = new Date().getTime();
			this._timer = setInterval(function(){that.onTick()},this.interval);
		},
		stop  : function(){
			var that  = this;
			window.clearInterval(that._timer);
			if(!this.running) return;
			this._timer = 0;
			this.running = false;
		},
		onTick : function(){
	  		var espTime = new Date().getTime() - this.lastTime;
			this.lastTime = new Date().getTime();
			if(this.onTimer!=null){
				this.onTimer(espTime,this.actionObejct);
			}
		}
	};
	////////////////////////////////////////////////
	// 预定模块
	////////////////////////////////////////////////
	var self;
	function Reserve() {
		self = this;
		this.config;
		this.selectTab = 0;
		this.selectData;
		this.deadlinetime=-1;
		this._timer;//计时器
		this.serviceTime = 0;//计时器
		this.booked = false//预定完
		this.tel = "";
		this.selectTimer = 0;
		this.isShowDialog = false;
		this.isRequest = false;
		this.isapp = false;
	}
	
	Reserve.prototype = {
		init : function(){
			this.config = config || {};
			if($.isEmptyObject(this.config)){
				console.log("config is null");
			}
			var uurl = window.location.href+"?random="+Math.random();//+"?rcc_src=share&suid=d10f891a68db47e0be85-27ad058ab80c&splt=mob&sapp=新浪微博";
			var app = self.getQueryString("plt");
			if(app){
				if(app == "app") this.isapp = true;
			};
			$(".maskall").click(function(e){
				if(self.isShowDialog && e.target == this){
					self.showDialog(false);
					self.showShare(false);
				}
			});
			$(".btn").each(function(n){
				var node = $(this);
				if(node.hasClass("share")){
					self.booked = true;
				}else self.booked = false;
				node.click(function(e){
					e.stopImmediatePropagation();
					if($(this).hasClass("book")){
						if($(this).hasClass("share")){
							//分享逻辑
							self.showShare(true);
						}else if($(this).hasClass("success")){
							
						}else{
							self.showDialog(true);
						}
					}
				})
			});
			$($(".tabs").children()).each(function(n){
				var node = $(this);
				node.click({ele:node,index:n},self.onTab);
			});
			$(".tabcon").each(function(n){
				var node = $(this);
				var ele = node.find(".playicon");
				var ss = ele.attr("href");//播放串
			});
			//预定弹框
			$("#bookOk").click(self.onOK);
			$("#bookCancel").click(self.onCanceled);
			$("#book input").focus(self.onFocused);
			//分享取消&复制
			$(".sharebox a").click(function(e){
					e.stopImmediatePropagation();
					self.showShare(false);
			});
//			$(".s4").click(function(e){
//					e.stopImmediatePropagation();
//					self.copyToClipboard(window.location.href);
//				});
			this.getSelectedTab();
			this.selected(this.selectTab);
			this.timeTick = new TimeTick(7*1000,this);
			this.timeTick.onTimer = function(espTime,actionObejct){
											var i = actionObejct.selectTab+1;
											actionObejct.selected(i%4);
									};
			this.loopTap(true);
		},
		getSelectedTab : function(){
			$($(".tabs").children()).each(function(n){
				var node = $(this);
				if(node.hasClass("now")){
					self.selectTab = n;
					return;
				}
			});
		},
		onTab : function(e){
			e.stopImmediatePropagation();
			var data = e.data;
			var index = data.index;
			var ele = data.ele;
			self.selected(index);
		},
		selected : function (index){
			self.selectTab = index;
			self.loadServerTime(TIME_URL,"cb",self.onTimer);
			self.booked = false;
			$($(".tabs").children()).each(function(n){
				var node = $(this);
				if(n == index) {
					if(node.hasClass("now")) return;
					else node.addClass("now");
				}else {
					if(node.hasClass("now")) node.removeClass("now");
				}
			});
			$(".tabcon").each(function(n){
				var node = $(this);
				if(n == index) {
					if(node.hasClass("hidden")){
						node.removeClass("hidden");
					}
				}else {
					if(node.hasClass("hidden")) return;
					node.addClass("hidden");
				}
			});
			$(".btn").each(function(n){
				var node = $(this);
				if($(this).hasClass("share")){
					self.booked = true;
				}
			});
		},
		load : function(src,cb,callback){
			self.isRequest = true;
			$.ajax({
				type:"get",
				url:src,
				jsonp: cb,
				dataType : "jsonp",
				jsonpCallback: 'book',
		        success : function(data){
		            if(typeof callback === "function")
			  			callback.call(this,data);
		        }, 
		        complete : function(XMLHttpRequest,status){ 
		        	self.isRequest = false;
			　　　　	if(status=='timeout' || status=='error'){//超时,status还有success,error等值的情况
			　　　　　  	console.log("出错啦!error="+status);
			　　　　	}
			　　}
			});
		},
		loadServerTime : function(src,cb,callback){
			$.ajax({
				type:"get",
				url:src,
				cache: true,
				jsonp: 'cb',
				jsonpCallback: 'p',
				dataType : "jsonp",
		        success : function(data){
		            if(typeof callback === "function")
			  			callback.call(this,data);
		        }, 
		        error : function(msg){
		        	console.log("error,"+msg);
		        }
			});
		},
		onTimer : function(data){
			self.serviceTime = Math.floor(data);//取整
			self.setDeadlineTime();
		},
		setDeadlineTime : function (){
			var serverDate = new Date(self.serviceTime * 1000);
			var node = $(".tabcon")[self.selectTab];
			var arr = self.config[self.selectTab].count_down_time;
			var arrEnd = self.config[self.selectTab].live_end_time;
			if(arr &&arrEnd){
				var dd = $(node).find("dd");
				var timeEleArr = dd.children("span"),timeArr=[],endtimeArr=[];
				if(timeEleArr.length == 8){
					for (var i in arr) {
						timeArr[i] = self.toDate(arr[i]);
						endtimeArr[i] = self.toDate(arrEnd[i]);
						if( timeArr[i].getTime()/1000 > self.serviceTime){
							self.deadlinetime = timeArr[i].getTime()/1000 - self.serviceTime;
							break;
						}else if(timeArr[i].getTime()/1000 < self.serviceTime && endtimeArr[i].getTime()/1000 > self.serviceTime){
							self.deadlinetime = 0;
							break;
						}else{
							if(i == arr.length - 1) self.deadlinetime = 0;
							else continue;
						}
					}
					if(self.deadlinetime >= 0){
						if(!self._timer)
							self._timer = setInterval(function(){self.timer();},1000);
					}
				}
			}
		},
		timer : function(deadlinetime){
			if(self.deadlinetime < 0){
				if(self._timer) {
					clearInterval(self._timer);
					self._timer = 0;
				}
				return;
			}
			var node = $(".tabcon")[self.selectTab];
			var dd = $(node).find("dd");
			var timeEleArr = dd.children("span");
			var date = new Date(self.deadlinetime);
			var d = Math.floor(self.deadlinetime/86400);
			var h = Math.floor((self.deadlinetime - d*(24*3600))/3600);
			var m = Math.floor((self.deadlinetime - d*(24*3600) - h * 3600)/60);
			var s = self.deadlinetime - d*(24*3600) - h * 3600 - m*60;
			if(d<10){
				$(timeEleArr[0]).text("0");
				$(timeEleArr[1]).text(d);
			}else{
				$(timeEleArr[0]).text(self.getNumberByBit(d,1));
				$(timeEleArr[1]).text(self.getNumberByBit(d,0));
			}
			if(h<10){
				$(timeEleArr[2]).text("0");
				$(timeEleArr[3]).text(h);
			}else{
				$(timeEleArr[2]).text(self.getNumberByBit(h,1));
				$(timeEleArr[3]).text(self.getNumberByBit(h,0));
			}
			if(m<10){
				$(timeEleArr[4]).text("0");
				$(timeEleArr[5]).text(m);
			}else{
				$(timeEleArr[4]).text(self.getNumberByBit(m,1));
				$(timeEleArr[5]).text(self.getNumberByBit(m,0));
			}
			if(s<10){
				$(timeEleArr[6]).text("0");
				$(timeEleArr[7]).text(s);
			}else{
				$(timeEleArr[6]).text(self.getNumberByBit(s,1));
				$(timeEleArr[7]).text(self.getNumberByBit(s,0));
			}
			self.deadlinetime --;
		},
		showDialog : function(bl){
			self.isShowDialog = bl;
			if(bl){
				$("#book").show();
				$("#book input").focus();
				self.showMask(true);
				self.loopTap(false);
				$("#book span").text("");
			}else{
				$("#book").hide();
				self.showMask(false);
				self.loopTap(true);
			}
		},
		loopTap : function(bl){
			if(bl){
				self.timeTick.start();
			}else{
				self.timeTick.stop();
			}
		},
		showShare : function(bl) {
			self.isShowDialog = bl;
			if(bl){
				var uurl = window.location.href+"?random="+Math.random();//链接
				uurl = uurl.replace("plt=app","");
				var title = "我预定了亚洲音乐节"+self.config[self.selectTab].title+"，更多精彩，尽在聚力视频";
				var imgPath = 'http://sr1.pplive.com/cms/42/28/4c1751fba288064eae11fd0e2c17d651.png';//分享图片链接
				
				var weibo = "http://v.t.sina.com.cn/share/share.php?c=spr_web_bd_pplive_weibo&url="+encodeURIComponent(uurl)+"&title="+encodeURIComponent(title)+"&source=聚力视频&sourceUrl="+encodeURIComponent("http://www.pptv.com")+"&content=utf-8&pic="+encodeURIComponent(imgPath)+"&appkey=1938876518";
				var qzone = "http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url="+encodeURIComponent(uurl)+"&title="+encodeURIComponent(title)+"&pics="+encodeURIComponent(imgPath);
				var qq = "http://connect.qq.com/widget/shareqq/index.html?title="+encodeURIComponent(title)+"&url="+encodeURIComponent(uurl)+"&desc="+encodeURIComponent(title)+"&pics="+encodeURIComponent(imgPath)+"&site="+encodeURIComponent("http://www.pptv.com");
//				$(".s4").parent().attr("href","javascript:;");
				if(!self.isapp){
					$(".sharebox").show();
					self.showMask(true);
					$(".sharebox a").attr("href","javascript:;");
					$(".s1").parent().attr("href",weibo);
					$(".s2").parent().attr("href",qzone);
					$(".s3").parent().attr("href",qq);
				}else{
					if(window.ppsdkReady && !window.isIOS){
						ppsdk.share({
							shareText: title, //分享内容
							shareURL:uurl, //分享视频链接
							shareImageURL: imgPath,
							success:function(data){
								console.log("ppsdk success");
							},
							error:function(code,data){
								console.log("ppsdk error="+code+","+data);
							},
							cancel:function(){
								console.log("ppsdk cancel");
							},
						}); 
					}else{
						alert("请稍后分享,jjsdk文件未加载完");
					}
					
				};
				self.loopTap(false);
			}else{
				$(".sharebox").hide();
				self.showMask(false);
				self.loopTap(true);
			}
		},
		showMask : function(bl){
			bl?$(".maskall").show():$(".maskall").hide();
		},
		onReserve : function(data){
			try{
				var msg = data.message || "预定失败";
				var status = data.status+"";
				switch(status){
					case "1":
						self.reserveSuccess(true,status);
						break;
					case "0":
						self.reserveSuccess(true,status);
						$("#book span").text("该专场已经预定");
						break;
					case "-1":
					case "-2":
					case "-3":
						$("#book span").text(msg);
						break;
					default:
						$("#book span").text(msg);
						break;
				}
			}catch(e){
				console.log("error",e);
			}
		},
		//预定成功
		reserveSuccess : function(bl,status){
			var node = $(".tabcon")[self.selectTab];
			self.booked = true;
			self.saveTel(self.tel);
			if(status == "1"){//预定成功
				self.showDialog(false);
				var num = parseInt(self.config[self.selectTab].book_number) +1 ;
				$(node).find("p").text("已经有"+num+"人预约");
			}
			if(window.isIOS && self.isapp){
				$(node).find(".btn").addClass("success");
				$(node).find(".btn").html("预定成功");
			}else{
				$(node).find(".btn").addClass("share");
				$(node).find(".btn").html("<i></i>与小伙伴分享吧");
			}
		},
		onOK : function(e){
			e.stopImmediatePropagation();
			if(self.isRequest){
				$("#book span").text("正在预定中,请稍等");
				return;
			}
			var tips = '';
			var tx = $("#book input").val();
			if(tx == ''){
				tips = "手机号码不能为空";
			}else if(/[^\d]/g.test(tx)){
				tips = "请输入有效的手机号码";
			}else if(!self.isMobile(tx)){
				tips = "请输入有效的手机号码";
			}
			if(tips != ""){
				$("#book span").text(tips);
			}else{
				self.tel = tx;
				var id = self.config[self.selectTab].id;
				self.load(reserveSrc+"telphone="+tx+"&special="+id,"cb",self.onReserve);
			}
		},
		onCanceled : function(e){
			e.stopImmediatePropagation();
			self.showDialog(false);
		},
		onFocused : function(e){
//			e.stopPropagation();
			if($("#book input").attr("value").indexOf("手机号码")>-1){
				$("#book input").attr("value","");
			}
		},
		isMobile : function(value) {
		    var length = value.length;
		    var mobile = /^(13[0-9]{9})|(18[0-9]{9})|(14[0-9]{9})|(17[0-9]{9})|(15[0-9]{9})$/;
		    return length == 11 && mobile.test(value);
		},
		toDate : function(value){
			var str = value;
			str = str.replace(/-/g,"/");
			var date = new Date(str);
			return date;
		},
		getNumberByBit : function(num,b){//0取个位，1取十位，2取百位，3千位数字...
			if(typeof num == "number"){
				var str = num+"";//串化
				return str.length>b?str.charAt(str.length-b-1):"";
			}
			return "";
		},
		//复制功能
		copyToClipboard : function (text) {
		  var textArea = document.createElement("textarea");
		  textArea.style.position = 'fixed';
		  textArea.style.top = 0;
		  textArea.style.left = 0;
		  textArea.style.width = '2em';
		  textArea.style.height = '2em';
		  textArea.style.padding = 0;
		  textArea.style.border = 'none';
		  textArea.style.outline = 'none';
		  textArea.style.boxShadow = 'none';
		  textArea.style.background = 'transparent';
		  textArea.value = text;
		  document.body.appendChild(textArea);
		  textArea.select();
		
		  try {
		    var successful = document.execCommand('copy');
		    var msg = successful ? 'successful' : 'unsuccessful';
		  } catch (err) {
		    console.log('Oops, unable to copy');
		  }
		  document.body.removeChild(textArea);
		  return successful;
		},
		//存手机号
		saveTel : function(tel){
			if(tel == "") return;
			if(window.localStorage){
				var type = "booke_tel";
				localStorage[type] = tel;
			}
		},
		//获取手机号码
		getTel : function(){
			var type = "booke_tel";
			var tel = localStorage[type];
			return tel;
		},
		getQueryString : function(name) {
			var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
			var r = window.location.search.substr(1).match(reg);
			if (r != null) return unescape(r[2]); return null;
		} 
	}


	module.exports = Reserve;


});