define(function(require, module, exports) {
	var $=require('jquery');
	var mediator=require('./mediator');
	mediator.installTo(dropdown.prototype);
	require('../../../util/scroller/scroller');
	//ie6 bug fix
    var IE6 = !window.XMLHttpRequest;
	function dropdown(options){
		var defaults={
			container:'.input-dropdown',
			dropIcon:'.dropdown-icon',
			expandWrap:'.dropdown-expand',
			selectItem:'li',
			activeClass:'active',
			hoverClass:'hover-active',
			curval:'.curval',
			maxHeight:'300',
			dataOpt: '',
			animate:true
		}
		this.opt=$.extend({},defaults,options);
		this.container=$(this.opt.container);
		this.dropIcon=this.container.find(this.opt.dropIcon);
		this.expandWrap=this.container.find(this.opt.expandWrap);
		this.curval=this.container.find(this.opt.curval);
		this.curIndex=0;
		// 关联下一个dropdown
		this.nextDropdown=null;
		// 关联前一个dropdown
		this.prevDropdown=null;
		this.scroller=null;
		this.isopen=false;
		var doc=$(document);
		var self=this;
		this.on('open',function(){
			//todo
			var tempNextDropDown=this.nextDropdown;
			while(!!tempNextDropDown){
				tempNextDropDown.trigger('hide');
				tempNextDropDown=tempNextDropDown.nextDropdown;
			}
			var tempPrevDropDown=this.prevDropdown;
			while(!!tempPrevDropDown){
				tempPrevDropDown.trigger('hide');
				tempPrevDropDown=tempPrevDropDown.prevDropdown;
			}
			//重置hover的状态
			self.expandWrap.find('.'+self.opt.hoverClass).removeClass(self.opt.hoverClass);
			self.show();
			self.isopen=true;
			doc.on('click.dropdown',function(e){
				var target=$(e.target);
				var tempClass=self.opt.container;
				if(typeof tempClass=='object'){
					tempClass=defaults.container;
				}
				if(target.parents(tempClass).length==0){
					self.trigger('hide');
					doc.off('click.dropdown');
				}
			});
		});
		this.on('hide',function(){
			self.hide();
			self.isopen=false;
			doc.off('click.dropdown');
		});
		this.container.on('click',this.opt.dropIcon,function(e){
			self.isopen ? self.trigger('hide') : self.trigger('open');
		});
		this.on('reset',function(searchVal){
			self.reset(searchVal);
		});
		this.container.on('click',this.opt.selectItem,function(){
			var obj=$(this);
			var searchVal=obj.html();
			var activeClass=self.opt.activeClass;
			var tempIndex=obj.index();
			if(self.curIndex==tempIndex){
				self.trigger('hide');
				return false;
			}
			self.curIndex=tempIndex;
			obj.siblings().removeClass(activeClass);
			obj.addClass(activeClass);
			self.trigger('hide');
			self.curval.html(searchVal);
			self.curval.attr('title',searchVal);
			var dataOpt = self.opt.dataOpt;
			if(dataOpt){
				self.curval.attr(dataOpt, obj.attr(dataOpt));
			}
			self.request('afterSelect',searchVal);
			self.nextDropdown&&self.nextDropdown.trigger('reset',searchVal);
		});
		this.container.on('mouseenter',this.opt.selectItem,function(e){
			var obj=$(this);
			var activeClass=self.opt.hoverClass;
			obj.siblings().removeClass(activeClass);
			obj.addClass(activeClass);
		});
	}
	$.extend(dropdown.prototype,{
		show:function(){
			var option = {
                wheelPixel   : 5 // 单个图片宽度
                , maxHeight  : this.opt.maxHeight
                , horizontal : false
                , autoWrap   : false
            };
			if(!this.opt.animate){
				this.expandWrap.stop(true,true);
				this.expandWrap.css({'visibility':'hidden',"display":"block"});
				var tempHeight=this.expandWrap.find('ul').height();
				if(this.scroller==null&&tempHeight>this.opt.maxHeight){
					this.scroller=this.expandWrap.ppScroller(option).scroll();
					var items=this.expandWrap.find(this.opt.selectItem);
					this.scroller.scrollTo(items.eq(this.curIndex).position().top);
				}
				this.expandWrap.css({'visibility':'visible',"display":"block"});
			}else{
				this.expandWrap.stop(true,true);
				this.expandWrap.css({'visibility':'hidden',"display":"block"});
				var tempHeight=this.expandWrap.find('ul').height();
				if(this.scroller==null&&tempHeight>this.opt.maxHeight){
					this.scroller=this.expandWrap.ppScroller(option).scroll();
					var items=this.expandWrap.find(this.opt.selectItem);
					this.scroller.scrollTo(items.eq(this.curIndex).position().top);
				}
				this.expandWrap.css({'visibility':'visible',"display":"none"});
				this.expandWrap.fadeIn();
			}
		},
		hide:function(){
			var self=this;
			if(!this.opt.animate){
				this.expandWrap.addClass('hidden');
			}else{
				this.expandWrap.stop(true,true).fadeOut();
			}
		},
		reset:function(searchVal){
			//模板需要优化
			var searchList=[];
			var tempPrev=this.prevDropdown;
			while(tempPrev!=null){
				searchList.unshift(tempPrev.curval.html());
				tempPrev=tempPrev.prevDropdown;
			}
			this.empty();
			var tempHtml='<ul>';
			var tempCount=0;
			this.curIndex=0;
			!!this.scroller&&!this.scroller.destory();
			this.scroller=null;
			if(searchList.length==0){
				//第一个tab
				var tempVal=this.curval.html();
				for(key in this.opt.groupDataArr){
					if(tempVal==""&&tempCount==0){
						tempHtml+='<li class="'+this.opt.activeClass+'">'+key+'</li>';
						this.curval.html(key);
						this.curval.attr('title',key);
					}else{
						if(tempVal==key){
							tempHtml+='<li class="'+this.opt.activeClass+'">'+key+'</li>';
							this.curval.html(key);
							this.curval.attr('title',key);
							//console.log('count',tempCount);
							this.curIndex=tempCount;
						}else{
							tempHtml+='<li>'+key+'</li>';
						}
					}
					tempCount++;
				}
				tempHtml+='</ul>';
				this.expandWrap.html(tempHtml);
			}else{
				var finalval=this.opt.groupDataArr;
				for(var i=0;i<searchList.length;i++){
					finalval=finalval[searchList[i]];
				}
				if($.isArray(finalval)){
					//判断生日类型
					var isSpec=false;
					if(searchList[1]=='02'){
						var validateVal=searchList[0];
						if((validateVal%4==0&&validateVal%100!=0)||validateVal%400==0){
							isSpec=true;
						}
					}
					for(var i=0;i<finalval.length;i++){
						if(i==0){
							tempHtml+='<li class="'+this.opt.activeClass+'">'+finalval[i]+'</li>';
							this.curval.html(finalval[i]);
							this.curval.attr('title',finalval[i]);
						}else{
							tempHtml+='<li>'+finalval[i]+'</li>';
						}
					}
					if(isSpec){
						tempHtml+='<li>'+29+'</li>';
					}
					tempHtml+='</ul>';
					this.expandWrap.html(tempHtml);
					if(this.container.hasClass("hidden")){
						this.container.removeClass('hidden');
					}
				}else if(typeof finalval=="undefined"){
					tempHtml+='</ul>';
					this.curval.html('');
					this.curval.removeAttr('title');
					this.container.addClass('hidden');
				}else{
					var isNum=false;
					for(var key in finalval){
						if(!isNaN(parseInt(key))){
							isNum=true;
							break;
						}
					}
					if(!isNum){
						for(var key in finalval){
							if(tempCount==0){
								tempHtml+='<li class="'+this.opt.activeClass+'">'+key+'</li>';
								this.curval.html(key);
								this.curval.attr('title',key);
							}else{
								tempHtml+='<li>'+key+'</li>';
							}
							tempCount++;
						}
					}else{
						var resultArr=[];
						for(var key in finalval){
							resultArr.push(key);
						}
						resultArr.sort(function(a,b){
							return parseInt(a,10)-parseInt(b,10);
						});
						for(var i=0;i<resultArr.length;i++){
							if(i==0){
								tempHtml+='<li class="'+this.opt.activeClass+'">'+resultArr[i]+'</li>';
								this.curval.html(resultArr[i]);
								this.curval.attr('title',resultArr[i]);
							}else{
								tempHtml+='<li>'+resultArr[i]+'</li>';
							}
						}
					}
					tempHtml+='</ul>';
					this.expandWrap.html(tempHtml);
					if(this.container.hasClass("hidden")){
						this.container.removeClass('hidden');
					}
				}
			}
			if(!!IE6){
				var containerWidth=this.container.width();
				if(this.expandWrap.width()<containerWidth){
					this.expandWrap.width(containerWidth);
				}
			}
			if(this.nextDropdown!=null){
				this.nextDropdown.reset();
			}
		},
		empty:function(){
			this.expandWrap.html('');
		},
		request:function(type){
			if(typeof this.opt[type]=='function'){
				this.opt[type].apply(this,arguments);
			}
		}
	});
	return {
		create:function(options){
			return new dropdown(options);
		}
	};
});
