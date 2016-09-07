define(function(require,exports) {
	function commonValidator(reg,item){
		//脚本验证
		var preReg=/\<|\>|php|\?/;
		if(preReg.test(item)){
			return false;
		}
		if(!reg.test(item)){
			return false;
		}else{
			return true;
		}
	}
	//检查身份证
	function checkIdCard(item){
		//http://blog.163.com/jiang_tao_2010/blog/static/1211268902010011102157920/
		//目前默认只有18位的二代身份证，现在15位的逻辑
		var reg=new RegExp(/^(\d{6})(\d{4})(\d{2})(\d{2})(\d{3})([0-9]|X)$/);
		var num=item.toUpperCase();
		if((!(/(^\d{15}$)|(^\d{17}([0-9]|X)$)/.test(num)))){
			return false;
		}
		var len,re;
		len=num.length; 
		//15位的验证规则开始
		if(len==15){
			re = new RegExp(/^(\d{6})(\d{2})(\d{2})(\d{2})(\d{3})$/);
			var arrSplit = num.match(re);
			var dtmBirth = new Date('19' + arrSplit[2] + '/' + arrSplit[3] + '/' + arrSplit[4]);
			var bGoodDay;
			bGoodDay = (dtmBirth.getYear() == Number(arrSplit[2])) && ((dtmBirth.getMonth() + 1) == Number(arrSplit[3])) && (dtmBirth.getDate() == Number(arrSplit[4]));
			if (!bGoodDay){
			    return false;
			}else{
				return true;
				//15位的验证规则结束
			}
		}else{
			var arrSplit=num.match(reg);
			//检查生日日期是否正确
			var dtmBirth = new Date(arrSplit[2] + "/" + arrSplit[3] + "/" + arrSplit[4]);
			var bGoodDay;
			bGoodDay = (dtmBirth.getFullYear() == Number(arrSplit[2])) && ((dtmBirth.getMonth() + 1) == Number(arrSplit[3])) && (dtmBirth.getDate() == Number(arrSplit[4]));
			if (!bGoodDay) {
				return false;
			}else{
				var valnum;
				var arrInt = new Array(7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2);
				var arrCh = new Array('1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2');
				var nTemp = 0, i; 
				for(i = 0; i < 17; i ++){
					nTemp += num.substr(i, 1) * arrInt[i];
				}
				valnum = arrCh[nTemp % 11]; 
				if (valnum != num.substr(17, 1)){
					return false;
				}
				return true;
			}
		}
	}
	function isDate(item, formatString){
		formatString = formatString || "ymd";
        var m, year, month, day;
        switch (formatString) {
            case "ymd":
                m = item.match(new RegExp("^((\\d{4})|(\\d{2}))([-./])(\\d{1,2})\\4(\\d{1,2})$"));
                if (m === null) return false;
                day = m[6];
                month = m[5]--;
                year = (m[2].length == 4) ? m[2] : GetFullYear(parseInt(m[3], 10));
                break;
            case "dmy":
                m = item.match(new RegExp("^(\\d{1,2})([-./])(\\d{1,2})\\2((\\d{4})|(\\d{2}))$"));
                if (m === null) return false;
                day = m[1];
                month = m[3]--;
                year = (m[5].length == 4) ? m[5] : GetFullYear(parseInt(m[6], 10));
                break;
            default:
                break;
        }
        if (!parseInt(month)) return false;
        month = month == 12 ? 0 : month;
        var date = new Date(year, month, day);
        return (typeof (date) == "object" && year == date.getFullYear() && month == date.getMonth() && day == date.getDate());
        function GetFullYear(y) { return ((y < 30 ? "20" : "19") + y) || 0; }
	}
	var validator={
		required : function(item){
			var reg=/.+/;
			return commonValidator(reg,item);
		},
	    email : function(item){
	    	var reg=/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
	    	return commonValidator(reg,item);
	    },
	    phone:function(item){
	    	var reg=/^((\(\d{3}\))|(\d{3}\-))?(\(0\d{2,3}\)|0\d{2,3}-)?[1-9]\d{6,7}$/;
	    	return commonValidator(reg,item);
	    },
	    mobile:function(item){
	    	var reg=/^(0|86|17951)?(13[0-9]|15[012356789]|17[0678]|18[0-9]|14[57])[0-9]{8}$/;
	    	return commonValidator(reg,item);
	    },
	    url:function(item){
	    	var reg=/^http:\/\/[A-Za-z0-9]+\.[A-Za-z0-9]+[\/=\?%\-&_~`@[\]\':+!]*([^<>\"\"])*$/;
	    	return commonValidator(reg,item);
	    },
	    idCard:function(item){
	    	var reg=/^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{4}$/;
	    	return commonValidator(reg,item);
	    },
	    card:function(item,type){
	    	//新增匹配类型的验证，身份证添加校验规则 type=1 代表身份证 0代表护照
	    	if(type==1){
	    		return checkIdCard(item);
	    	}else if(type==2){
	    		//这个正则等待验证,目前只验证非空了
	    		var reg=/.+/;
	    		//var reg=/^1[45][0-9]{7}|G[0-9]{8}|P[0-9]{7}|S[0-9]{7,8}|D[0-9]+$/;
	    		return commonValidator(reg,item);
	    	}
	    },
	    currency:function(item){
	    	var reg=/^\d+(\.\d+)?$/;
	    	return commonValidator(reg,item);
	    },
	    number:function(item,digit){
	    	if(digit){
	    		var reg='^\\d{'+digit+'}$';
	    		reg=new RegExp(reg);
	    	}else{
	    		var reg=/^\d+$/;
	    	}
	    	return commonValidator(reg,item);
	    },
	    zipCode:function(item){
	    	var reg=/^\d+$/;
	    	return commonValidator(reg,item);
	    },
	    qq:function(item){
	    	var reg=/^[1-9]\d{4,8}$/;
	    	return commonValidator(reg,item);
	    },
	    integer:function(item){
	    	var reg=/^[-\+]?\d+$/;
	    	return commonValidator(reg,item);
	    },
	    double:function(item){
	    	var reg=/^[-\+]?\d+(\.\d+)?$/;
	    	return commonValidator(reg,item);
	    },
	    english:function(item){
	    	var reg=/^[A-Za-z]([A-Za-z]|\s)+[A-Za-z]$/;
	    	return commonValidator(reg,item);
	    },
	    chinese:function(item){
	    	var reg=/^[\u0391-\uFFE5]+$/;
	    	return commonValidator(reg,item);
	    },
	    chineseOrEnglish:function(item){
	    	if((!!this.english(item)&&!this.chinese(item))||((!this.english(item)&&!!this.chinese(item)))){
	    		return true;
	    	}else{
	    		return false;
	    	}
	    },
	    unSafe:function(item){
	    	var reg=/^(([A-Z]*|[a-z]*|\d*|[-_\~!@#\$%\^&\*\.\(\)\[\]\{\}<>\?\\\/\'\"]*)|.{0,5})$|\s/;
	    	return commonValidator(reg,item);
	    },
	    isSafe:function(item){
	    	return !this.unSafe(item);
	    },
	    between:function(item,min,max){
	    	if(typeof item!="number"){
	    		throw new Error("错误");
	    	}
	    	return item>min&&item<max;
	    },
	    isDate:function(item,formatString){
	    	return isDate(item,formatString);
	    }
	};
	validator.msg={
		require : "不能为空",
		email : "必须为邮箱",
		phone : "必须为固定电话号码",
		mobile : "必须为手机号码",
		url : "必须为url链接",
		idCard : "必须为身份证号码",
		currency : "必须为货币"
	}
	return validator;
});