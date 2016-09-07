/**
 * ...
 * @author minliang_1112@foxmail.com
 *
 * 	var temp = new BackTop();
 * 	init(target, callback)      初始化操作    target : 底部点击回到顶部对象 | callback : 滚动回调
 * 	backTop(callback)           回到顶部操作  callback : 到达顶部后回调
 * 	addEvent(target, type, fn)  监听事件      target : 底部点击回到顶部对象 | type : 事件类型 | fn : 事件回调
 *
 *  for example:
 *  <div style="width:auto;height:auto;position:fixed;bottom:0;right:0;display:block;" id="abc">
		<img src="./assets/rocket.png" />
	</div>
	<script type="text/javascript">
		 
		for (var i=0;i<100;i++){
			$('body').append('<p>测试内容 '+i+'</p>');
		}

		var backTop = new BackTop();
		backTop.init($('#abc')[0]);
		backTop.addEvent($('#abc')[0],'click',function(){
			backTop.backTop(function(){
				$('#abc').css({'display' : 'none'});
			});
		})
		
	</script>
 */

let global = {
		requestAnimFrame() {
			let requestAnimationFrame = window.requestAnimationFrame;
			if (!requestAnimationFrame) {
				requestAnimationFrame = (cb)=>{
					let currTime = new Date().getTime(),lastTime = 0;
					let delayTime = Math.max(0, 16 - (currTime - lastTime));
					let id = setTimeout(()=>{
						cb(currTime + delayTime);
					}, delayTime);
					lastTime = currTime + delayTime;
				}
			}
			return requestAnimationFrame;
		},
		addEventListener(target, type, fn) {
			if (target.attachEvent) {
				target.attachEvent('on' + type, fn);
			} else if (target.addEventListener) {
				target.addEventListener(type, fn, false);
			}
		},		
		removeEventListener(target, type, fn) {
			if (target.detach) {
				target.detach('on' + type, fn);
			} else if (target.removeEventListener) {
				target.removeEventListener(type, fn, false);
			}
		},
		scrollTop(v) {
			if (v === undefined) {
				return document.body.scrollTop || document.documentElement.scrollTop;
			} else {
				document.body.scrollTop = v;
				document.documentElement.scrollTop = v;
			}
		},
		mine(t, b, c, d) {
			if (c > b) {
				return (c - b) * t / d * t / d;
			} else {
				return b - (b - c) * t / d * t / d;
			}
		}
	}
	
	class Top {
		constructor(){
			this.body = document.getElementsByTagName('body')[0];
			window.requestAnimFrame = global.requestAnimFrame();
		}
		
		create(obj, callback) {
			let {target, time} = obj;
			this.target = target;
			this.time = time;
			global.addEventListener(window, 'scroll', callback);
		}
		
		_animate(element, css, from, to, cb, time=800) {
			let style = element.style,
				start;
			let setStyle = typeof css !== 'function' ? (v)=>{
															style[css] = v + 'px';
														} : (v)=>{
															css(element, v);
														};
			let go = (timestamp)=>{
				if (timestamp === undefined) {
					timestamp = new Date() - 0;
				}
				if (start === undefined) {
					start = timestamp;
				}
				let progress = timestamp - start;
				if (progress >= time) {
					setStyle(to);
					cb && cb();
					return;
				}
				let now = global.mine(progress, from, to, time);
				setStyle(now);
				requestAnimFrame(go);
			}
			setStyle(from);
			requestAnimFrame(go);
		}
		
		goTop(callback) {
			let st = global.scrollTop();
			this._animate(this.body, 
						(el, v)=>{
							global.scrollTop(v);
						},
						st,
						0,
						callback, 
						this.time);
		}
	}
	
export default class BackTop {
	
	constructor(){
		this.backtop = new Top();
	}
	
	init(target, callback) {
		this.backtop.create(target, callback);
	}
	
	backTop(callback) {
		this.backtop.goTop(callback);
	}
		
	addEvent(target, type, fn) {
		global.addEventListener(target, type, fn);
	}
		
	removeEvent(target, type, fn){
		global.removeEventListener(target, type, fn);
	}
}