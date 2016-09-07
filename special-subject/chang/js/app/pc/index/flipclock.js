define(function(require, module, exports) {
	function fnTimeCountDown(d, o){
		var count=0;
		var d = d;
		var interval=1000;
		var startTime;
		var future = new Date(d);
		var totalTime=0;
		var f = {
			zero: function(n){
				var n = parseInt(n, 10);
				if(n > 0){
					if(n <= 9){
						n = "0" + n;	
					}
					return String(n);
				}else{
					return "00";	
				}
			},
			dv: function(){
				if(o.servertime){
					var now = new Date(o.servertime.getTime()+totalTime);
				}else{
					var now = new Date();	
				}
				if(!startTime){
					if(o.servertime){
						var startTime=new Date(o.servertime.getTime());
					}else{
						var startTime=new Date();
					}
					var offset=0;
				}else{
					var offset=now.getTime()-(startTime+count*interval);
				}
				count++;
				var nextTime=interval-offset;
				var dur = Math.round((future.getTime() - now.getTime()) / 1000), pms = {
					sec: "00",
					mini: "00",
					hour: "00",
					day: "00",
					month: "00",
					year: "0"
				};
				if(dur > 0){
					pms.sec = f.zero(dur % 60);
					pms.mini = Math.floor((dur / 60)) > 0? f.zero(Math.floor((dur / 60)) % 60) : "00";
					pms.hour = Math.floor((dur / 3600)) > 0? f.zero(Math.floor((dur / 3600)) % 24) : "00";
					pms.day = Math.floor((dur / 86400)) > 0? f.zero(Math.floor((dur / 86400)) % 30) : "00";
					pms.month = Math.floor((dur / 2629744)) > 0? f.zero(Math.floor((dur / 2629744)) % 12) : "00";
					pms.year = Math.floor((dur / 31556926)) > 0? Math.floor((dur / 31556926)) : "0";
				}else{
					pms.end=true;
				}
				pms.nextTime=nextTime;
				totalTime+=nextTime;
				return pms;
			},
			ui: function(){
				var backupObj=f.dv();
				if(o.day){
					o.day.innerHTML = backupObj.day;
				}
				if(o.month){
					o.month.innerHTML = backupObj.month;
				}
				if(o.year){
					o.year.innerHTML = backupObj.year;
				}
				if(o.sec){
					o.sec.innerHTML = backupObj.sec;
				}
				if(o.mini){
					o.mini.innerHTML = backupObj.mini;
				}
				if(o.hour){
					if(backupObj.day!='00'&&!o.day){
						o.hour.innerHTML = parseInt(backupObj.hour,10)+parseInt(backupObj.day,10)*24;
					}else{
						o.hour.innerHTML = backupObj.hour;
					}
				}
				if(backupObj.end==true){
					if(!!o.finishCallback&&typeof o.finishCallback=='function'){
						o.finishCallback.call(null);
					}
					return false;
				}
				setTimeout(f.ui, backupObj.nextTime);
			}
		};	
		f.ui();
	};
	return {
		create:function(d,options){
			return new fnTimeCountDown(d, options);
		}
	}
});