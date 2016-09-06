/**
 * ...
 * @author minliang_1112@foxmail.com
 */

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
	}
}