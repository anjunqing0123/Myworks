define(function(require, exports){
	//返回的是对象形式的参数
	function getUrlArgObject(){
		var args=new Object();
		var query=location.search.substring(1);//获取查询串
		var pairs=query.split("&");
		for(var i=0;i<pairs.length;i++){
			var pos=pairs[i].indexOf('=');//查找name=value
			if(pos==-1){//如果没有找到就跳过
				continue;
			}
			var argname=pairs[i].substring(0,pos);//提取name
			var value=pairs[i].substring(pos+1);//提取value
			args[argname]=unescape(value);//存为属性
		}
		return args;//返回对象
	}
	return getUrlArgObject;
});
