define(function(require, exports){
	var
		$       = require('jquery')
		,loader   = require('../loader/loader')
		,user   = require('../user/user')
		,cookie = require('../cookie/cookie')
		,md5    = require('../md5/md5')
	;

	var checkIn = {
		href: 'http://api.usergrowth.pptv.com/',
		checkDay: function(cb, date){
			if(!user.isLogined){
				return;
			}

			var
				date   = date || new Date()
				,year = date.getYear().toString()
				,month = date.getMonth() + 1
			;

			year = year.substring(year.length - 2);
			if(parseInt(month) < 10){
				month = "0"+ month;
			}

			loader.ajax({
				url: this.href + 'pcardInfo/getMonthPcard',
				jsonpCallback: 'getMonthPcard',
				data: {
					username : user.info.UserName
					,month   : year + month
					,from    : 'web'
					,version : 'unknown'
					,format  : 'jsonp'
					,token   : cookie.get('ppToken')
				}
			}).done(function(monthPcard){
				if(monthPcard.flag === 0){
					var
						_date         = date.getDate()
						,log          = monthPcard.result.monthPcardLog
						,todayChecked = log.charAt(_date - 1) == '1'
					;

					cb && cb(todayChecked, monthPcard.result.conDays, monthPcard.result.leaveDays);
				}
			})
		},
		checkIn: function(cb){
			var index = "";
			for(var i = 0; i < 6; i++){
				var nu = Math.floor(Math.random() * 10);
				if(nu == 0){nu = 1;}
				index += nu;
			}
			var addstr = md5.hex_md5(encodeURIComponent(user.info.UserName + "$DAILY_PCARD$" + index));

			ajax({
				url: this.href + 'doDailyPcard',
				jsonpCallback: 'checkIn',
				data: {
					username: user.info.UserName,
					from: 'web',
					version: 'unknown',
					format: 'jsonp',
					token: cookie.get('ppToken'),
					index: index,
					addstr: addstr
				}
			}).done(function(data){
				if(data.flag === 0){
					cb && cb();
				}else{
					log('[checkIn.checkIn] error ', data)
				}
			})
		}
	}

	return checkIn;
});
