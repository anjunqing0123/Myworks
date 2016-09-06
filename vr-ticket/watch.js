var fs = require('fs');
var less = require('less');
var exec = require('child_process').exec;
var paths = 'css/style.merge.less';
fs.watchFile('css/modules/order.css',  {interval: 500}, function (a,b) {
	var cmd = "lessc "+paths+" "+paths.replace('less','css');
	exec(cmd, {encoding : 'utf-8'},function (error, stdout, stderr) {
		if(error !== null) {  
                console.log(error);  
                return;  
            }  
            console.log('修改了');  
	})
});