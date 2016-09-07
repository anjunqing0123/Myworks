define(function(require,exports) {
	var dropdown=require('./dropdown');
	var $=require('jquery');
	function dropdownSelect(options){
		var defaults={
			container:'.dropdown-group',
			item:'.input-dropdown'
		}
		this.opt=$.extend({},defaults,options);
		this.container=$(this.opt.container);
		this.group=this.container.find(this.opt.item);
		this.groupArr=[];
		if(!this.opt.groupDataArr){
			var arr=require('./citydrop');
			this.groupDataArr=arr;
		}else{
			this.groupDataArr=this.opt.groupDataArr;
		}
		if(typeof this.opt.getGroupval=='function'){
			this.getGroupval=this.opt.getGroupval;
		}
		this.init();
	}
	$.extend(dropdownSelect.prototype,{
		init:function(){
			var self=this;
			this.group.each(function(){
				var tempDropDown=dropdown.create({
					container:this,
					groupDataArr:self.groupDataArr,
					dropIcon:self.opt.dropIcon
				});
				self.groupArr.push(tempDropDown);
			});
			var len=this.groupArr.length;
			for(var i=0;i<len;i++){
				if(i==len-1){
					this.groupArr[i].nextDropdown=null;
				}else{
					this.groupArr[i].nextDropdown=this.groupArr[i+1];
				}
				if(i==0){
					this.groupArr[i].prevDropdown=null;
				}else{
					this.groupArr[i].prevDropdown=this.groupArr[i-1];
				}
			}
			!!this.groupArr[0]&&this.groupArr[0].reset();
		},
		getGroupval:function(separator){
			var resultArr=[];
			for(var i=0;i<this.groupArr.length;i++){
				//console.log(this.groupArr[i]);
				resultArr.push(this.groupArr[i].curval.text());
			}
			return separator ? resultArr.join(separator) : resultArr.join('');
		}
	});
	exports.create=function(options){
		return new dropdownSelect(options);
	}
});
