define(function(require,exports) {
	//设置domain
	document.domain='pptv.com';
	var $=require('jquery');
	var loader=require('../../../util/loader/loader');
	var avatarReg=/\.((jpg)|(jpeg)|(gif)|(png))/i;
	//此处使用一个map接收回调，暂时没想到好的办法不用全局变量
	window.imageCallbackList=window.imageCallbackList||{};
	function uuid(){
		var count=0;
		return function(prefix){
			return prefix+'_'+count++;
		}
	}
	//ie6 bug fix
	var IE6 = !window.XMLHttpRequest;
	var isOnload=false;
	var isServerOnload=false;
	function imgCallback(data){
		isServerOnload=false;
		if(data.err==0){
			var tempImg=new Image();
			var tempW=this.imgField.width();
			var tempH=this.imgField.height();
			//img.src=data.data+'?size=cp'+tempW+'x'+tempH;
			//加随机数，不然ie6有缓存
			tempImg.src=data.data+'?'+Math.random();
			var self=this;
			tempImg.onload=function(){
				//console.log(arguments);
				if(!isServerOnload){
					isServerOnload=true;
					var origW=tempImg.width;
					var origH=tempImg.height;
					if(origW<400){
						self.request('errorSize','你传的照片宽度必须大于400像素！',self.fakeBtn);
					}else if(origH<400){
						self.request('errorSize','你传的照片高度必须大于400像素！',self.fakeBtn);
					}else{
						tempImg.width=tempW;
						tempImg.height=tempH;
						self.imgField.html($(tempImg));
						unbindAction.call(self);
						self.valueMap[self.reservedSrc]=data.data;
						self.request('afterUpload',data.data,self.fakeBtn);
					}	
				}
			}
		}
	}
	//锁定imageIframe，图片提交的时候会动态改变form的action，这个时候是不让提交的
	function lock(){
		privateInProgress=true;
	}
	//解锁imageIframe
	function unlock(){
		privateInProgress=false;
	}
	function unbindAction(){
		unlock.call(this);
		this.container[0].action=this.origAction;
		this.container.removeAttr('target');
	}
	function CheckSize(img, src, files) {
	    var bytes = (img.fileSize || files[0].size || files[0].fileSize);
	    bytes = bytes == -1 ? this.opt.MIN_SIZE : bytes;
	    if (bytes > this.opt.MAX_SIZE) {
	        this.request('errorSize','你传的照片超过最大尺寸啦！',this.fakeBtn);
	        return false;
	    }
	    else if (bytes < this.opt.MIN_SIZE) {
	        this.request('errorSize','你传的照片太小啦！',this.fakeBtn);
	        return false;
	    }
	    if(this.iframe==null){
	    	this.createIframe.call(this);
	    }
	    this.request('inProgress');
	    this.fakeBtn.addClass('btn-disabled').find('span').text('上传中');
	    this.upload.call(this);
	}
	function iframeUpload(options){
		var defaults={
			MIN_SIZE :  10 * 1024,
            MAX_SIZE :  2 * 1024 * 1024,
			container:'#person-info',
			fileBtn:'.input-file-main',
			fakeBtn:'.input-file',
			iframeName:'PicUploadIFR3',
			tokenUrl:'http://api.chang.pptv.com/api/phototoken',
			uploadUrl:'http://api.grocery.pptv.com/upload_file.php',
			imgField:'.previewBox-image',
			btnDisable:'btn-disabled'
		}
		var privateInProgress=false;
		this.opt=$.extend({},options,defaults);
		this.container=$(this.opt.container);
		this.fileBtn=this.container.find(this.opt.fileBtn);
		this.iframe=null;
		this.imgField=this.container.find(this.opt.imgField);
		this.uploadId=iframeUpload.uuid(this.opt.iframeName);
		imageCallbackList[this.uploadId]=this;
		this.origAction=this.container[0].action;
		this.callback=imgCallback;
		this.fakeBtn=this.container.find(this.opt.fakeBtn);
		this.valueMap={};
		this.token=null;
		this.buildAction=function(token){
			return this.opt.uploadUrl+'?app=lpic&tk='+token+'&prod=yccm_pic&tag=script&cb=parent.'+'imageCallbackList["'+this.uploadId+'"].callback';
		}
		this.islock=function(){
			return !!privateInProgress;
		}
		var self=this;
		this.container.on('change',this.opt.fileBtn,function(evt){
			var src=this.value;
			var files = this.files || (evt.target && evt.target.files) || (evt.dataTransfer && evt.dataTransfer.files);
			if (!files) {
                this.select();
                this.blur();
                try {
                    src = document.selection.createRange().text;
                }
                catch (e) {
                    src = document.selection.createRangeCollection()[0].text;
                }
            }
            var type = src.substr(src.lastIndexOf('.'));
			if(!avatarReg.test(type)){
			    // need show error;
			    self.request('errorType','',self.fakeBtn);
			    return false;
			}
			self.reservedSrc=src;
			if(!!self.valueMap&&!!self.valueMap[src]){
				self.request('afterUpload',self.valueMap[src],self.fakeBtn);
			}else{
				var img = new Image();
				if (!files || !files[0]) {
					isOnload=false;
				    img.onload = function () {
				    	if(!isOnload&&!!IE6){
				    		isOnload=true;
				    		CheckSize.call(self,img, src, files); 
				    	}else if(!IE6){
				    		CheckSize.call(self,img, src, files); 
				    	}
				    };
				    //img.onreadystatechanged = function () { console.log('---changed'); };
				    img.src = src;
				    //img.dynsrc = src;
				    setTimeout(function () { CheckSize.call(self,img, src, files); }, 100);
				}
				else {
				    CheckSize.call(self,img, src, files);
				}
			}
		});
	}
	iframeUpload.uuid=uuid();
	$.extend(iframeUpload.prototype,{
		//构造隐藏iframe
		createIframe:function(){
			var iframe;
			try{// IE6, IE7
			  iframe = document.createElement('<iframe name="'+this.opt.iframeName+'">');
			}catch(e) {
			  iframe = document.createElement('iframe');
			  iframe.name = this.opt.iframeName;
			}
			iframe.style.display = 'none';
			document.body.appendChild(iframe);
			this.iframe=iframe;
		},
		upload:function(){
			if(this.token==null){
				var self=this;
				loader.load(self.opt.tokenUrl,{},function(data){
					if(data.status==0){
						self.request('error','login',self.fakeBtn);
					}else if(data.err==0){
						//锁定不让提交，因为image需要处理
						lock.call(self);
						var token=self.token=data.data;
						var queryStr=self.buildAction.call(self,token);
        				self.container[0].action=queryStr;
        				self.container[0].target=self.opt.iframeName;
        				self.container.submit();
					}
				},function(){
					self.request('error','upload',self.fakeBtn);
				});
			}else{
				//锁定不让提交，因为image需要处理
				var self=this;
				lock.call(self);
				var queryStr=self.buildAction.call(self,self.token);
				self.container[0].action=queryStr;
				self.container[0].target=self.opt.iframeName;
				self.container.submit();
			}
		},
		request:function(type){
			if(typeof this.opt[type]=='function'){
				this.opt[type].apply(this,arguments);
			}
		}
	});
	return iframeUpload;
});
