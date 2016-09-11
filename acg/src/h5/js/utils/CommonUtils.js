/**
 * ...
 * @author minliang_1112@foxmail.com
 */

import $ from 'n-zepto'

export default {
	/**
	 *	获取dom对象
	 */
	getDom(id, doc = document) {
		try {
			return doc.querySelector('#' + id);
		} catch (e) {};
		return doc.getElementById(id);
	},
	getPlayerUrl() {
		return `http://player.aplus.pptv.com/corporate/proxy/proxy.html#`;
	},

	ajax( getUrl,callback ) {
		$.ajax({
			type: "get",
			async: true,
			url: getUrl,
			dataType: "jsonp",
			jsonp: "callback",
			// jsonpCallback:"flightHandler",
			success: function(data){
				try{
					callback(data);
				}catch(error){
					console.log("ajax 回调出错 " + e.message)
				}
			},
			error: function(e){
				console.log( 'ajax 请求出错 ' + e.message );
			}
		});
	}

}