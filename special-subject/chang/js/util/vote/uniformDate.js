define(function(require, exports){
	function uniformDate(dateString){
		if(typeof dateString=='undefined'){
			return false;
		}
		if(typeof dateString=='object'){
			return dateString;
		}
		if(~dateString.toString().indexOf('-')){
			return new Date(dateString.replace(/-/g,'/'));
		}else{
			return new Date(dateString);
		}
	}
	return uniformDate;
});