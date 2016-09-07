define(function(require, exports){
	var $=require('jquery');
	function uuid(){
		var count=0;
		return function(prefix){
			var prefix=prefix||'normal_counter'
			return prefix+'_'+count++;
		}
	}
	var counterUID=uuid();
	var defaults={
		intetval:1000,
		counter:10
	}
	function counter(){
		var self=this;
	    this.timer=setTimeout(function(){
	    	var count=self.counter-1;
	        if(count>0){
	        	self.counter--;
	        	self.request('update');
	            counter.call(self);
	        }else{
	            self.reset();
	        }
	    },1000);
	}
	function counterTimer(options){
		this.id=counterUID();
		this.opt=$.extend({},defaults,options);
		this.counter=this.opt.counter;
		this.timer=null;
		this.dom=this.opt.dom;
		this.init();
	}
	$.extend(counterTimer.prototype,{
		init:function(){
			this.request('init');
			this.update();
		},
		update:function(){
			counter.call(this);
		},
		stop:function(){
			if(this.timer!=null){
				clearTimeout(this.timer);
				this.timer=null;
			}
			this.request('stop');
		},
		reset:function(){
			if(this.timer!=null){
				clearTimeout(this.timer);
				this.timer=null;
			}
			this.counter=this.opt.counter;
			this.request('reset');
			this.request('finish');
		},
		addTimer:function(num){
			this.counter+=num ? num :10;
			if(this.counter>this.opt.counter){
				this.counter=this.opt.counter;
			}
		},
		resetCounter:function(){
			if(this.timer!=null){
				clearTimeout(this.timer);
				this.timer=null;
			}
			this.counter=this.opt.counter;
		},
		resume:function(counter){
			if(typeof counter=="number"){
				this.counter=counter;
			}
			this.update();
		},
		request:function(type){
			if(!!window.console&&window.location.search.indexOf('debug')!=-1){
				console.log(type);
			}
			if(typeof this.opt[type]=='function'){
				this.opt[type].apply(this,arguments);
			}else if($.isArray(this.opt[type])){
				var len=this.opt[type].length;
				for(var i=0;i<len;i++){
					this.opt[type][i].apply(this,arguments);
				}
			}
		}
	});
	return counterTimer;
});