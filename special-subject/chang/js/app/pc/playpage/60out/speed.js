define(function(require, exports){
	var $=require('jquery');
	var zrender=require('../../canvaslib/zrender');
	var Line=require('../../canvaslib/shape/Line');
	var Text=require('../../canvaslib/shape/Text');
	var Circle=require('../../canvaslib/shape/Circle');
	var RingShape=require('../../canvaslib/shape/Ring');
	var Group=require('../../canvaslib/Group');
	function speed(options){
		var defaults={
			'totalPiece':35,
			'lineWidth':40,
			'lineStrokeWidth':5,
			'lineStrokeActive':'#ff0000',
			'lineStrokeBlank':'#dddddd',
			'animateOffset':20,
			'originOffset':200,
			'index':0,
			'container':'.zr-speed',
			'interpolateOffset':5,
			'offsetAngle':0,
			'offsetY':0
		}
		this.opt=$.extend({},defaults,options);
		this.container=$(this.opt.container);
		this.zr=zrender.init(this.container[0]);
		this.index=this.opt.index||0;
		this.lineArr=[];
		this.isLock=true;
		this.init();
	}
	$.extend(speed.prototype,{
		init:function(){
			var self=this;
			var totalPiece=this.opt.totalPiece;
			var lineW=this.opt.lineWidth;
			var lineStrokeWidth=this.opt.lineStrokeWidth;
			var lineStrokeBlank=this.opt.lineStrokeBlank;
			var lineStrokeActive=this.opt.lineStrokeActive;
			//var hexArr=hexToArr(lineStrokeActive);
			var animateOffset=this.opt.animateOffset;
			var originOffset=this.opt.originOffset;
			var containW=this.container.width();
			var containH=this.container.height();
			var offsetY=this.opt.offsetY;
			var radius=this.opt.radius;
			if(!this.opt.radius){
				var radius=containW*0.4;
			}else if(this.opt.radius>1){
				var radius=this.opt.radius;
			}else{
				var radius=this.opt.radius*containW;
			}
			var zr=this.zr;
			var count=0;
			if(this.index==0){
				this.isLock=false;
			}
			//偏移的角度 todo
			//var offsetAngle=this.opt.offsetAngle;
			var runPiece=totalPiece-1;
			for(var i=0;i<=runPiece;i++){
			    var xStart,yStart,xEnd,yEnd;
			    xStart=-Math.cos(Math.PI/runPiece*i)*radius;
			    yStart=-Math.sin(Math.PI/runPiece*i)*radius;
			    xEnd=-Math.cos(Math.PI/runPiece*i)*(radius+lineW);
			    yEnd=-Math.sin(Math.PI/runPiece*i)*(radius+lineW);
			    var tempLine=new Line({
			      style:{
			        xStart:xStart,
			        yStart:yStart,
			        xEnd:xEnd,
			        yEnd:yEnd,
			        lineWidth:lineStrokeWidth,
			        strokeColor:lineStrokeBlank
			      },
			      position:[containW/2,containH-lineW/2-offsetY],
			      hoverable:false
			    });
			    this.lineArr.push(tempLine);
			    zr.addShape(tempLine);
			    if(i<this.index){
			      var tempDefer=zr.animate(tempLine,'style');
			      tempDefer.when(originOffset*(i+1),{
			          strokeColor:lineStrokeBlank
			        })
			      .when(originOffset*(i+2),{
					  strokeColor:lineStrokeActive
			      })
			      .done(function(){
			      	count++;
			      	if(count==self.index){
			      		self.isLock=false;
			      	}
			      });
			      tempDefer.start();
			    }
			}
			if(this.opt.auxilary==true){
				var auxilaryPiece=5;
				var tempArr=[0,1,2,3,4,5];
				var fontSize=13;
				for(var i=0;i<=auxilaryPiece;i++){
					if(i==1||i==2){
						var tempX=-Math.cos(Math.PI/auxilaryPiece*i-Math.PI/(totalPiece-1))*(radius+lineW+15);
						var tempy=-Math.sin(Math.PI/auxilaryPiece*i-Math.PI/(totalPiece-1))*(radius+lineW+15);
					}else if(i==3){
						var tempX=-Math.cos(Math.PI/auxilaryPiece*i-Math.PI/(totalPiece-1))*(radius+lineW+35);
						var tempy=-Math.sin(Math.PI/auxilaryPiece*i-Math.PI/(totalPiece-1))*(radius+lineW+10);
					}else{
						var tempX=-Math.cos(Math.PI/auxilaryPiece*i)*(radius+lineW+10);
						var tempy=-Math.sin(Math.PI/auxilaryPiece*i)*(radius+lineW+10);
					}
					if(i<3){
						var tempColor='#dddddd';
					}else{
						var tempColor='#ff3333';
					}
					//console.log(tempColor);
					var tempText = new Text({
				        style: {
				            text: tempArr[i],
				            x: tempX,
				            y: tempy,
				            textFont: fontSize+'px Arial',
				            color:tempColor
				        },
				        position:[containW/2-1,containH-lineW/2-offsetY],
				        hoverable:false
				    });
				    zr.addShape(tempText);
				}
			}
			if(this.opt.hasCursor){
				var tempGroup;
				this.cursorImage=tempGroup=new Group();
				tempGroup.position[0]=containW/2;
				tempGroup.position[1]=containH-88;
				tempGroup.rotation=[Math.PI/2,0,75];
				tempGroup.addChild(new Line({
					style:{
						xStart:0,
			        	yStart:0,
			        	xEnd:0,
			        	yEnd:70,
			        	lineWidth:2,
			        	strokeColor:'#ff0000'
					},
					hoverable:false
				}));
				tempGroup.addChild(new RingShape({
					style:{
						x:0,
						y:75,
						r:11,
						r0:9,
						color:'#ff0000',
						strokeColor:'#ffffff'
					},
					hoverable:false
				}));
				tempGroup.addChild(new Circle({
					style:{
						x:0,
						y:75,
						r:6,
						color:'#ff0000',
						brushType: 'fill'
					},
					hoverable:false
				}));
				zr.addShape(tempGroup);
			    this.currentCursor=Math.PI/2;
			}
			zr.render();
		},
		update:function(index){
			var index=parseInt(index);
			//变色，速度变小
			if(this.index==index){
				return false;
			}
			if(this.isLock==true){
				return false;
			}
			var self=this;
			var originOffset=this.opt.originOffset;
			var zr=this.zr;
			var lineStrokeBlank=this.opt.lineStrokeBlank;
			var lineStrokeActive=this.opt.lineStrokeActive;
			var animateOffset=this.opt.animateOffset;
			//var hexArr=hexToArr(lineStrokeBlank);
			if(index<this.index&&index>=0){
				self.isLock=true;
				var tempArr=this.lineArr.slice(index,this.index);
				var count=tempArr.length;
				var finishCount=0;
				for(var i=count-1;i>=0;i--){
					var tempDefer=zr.animate(tempArr[i],'style');
					tempDefer.when(originOffset*(count-i+1),{
			          strokeColor:lineStrokeActive
			        })
			      	.when(originOffset*(count-i+2),{
					  strokeColor:lineStrokeBlank
			      	})
			      	.done(function(){
			      		finishCount++;
			      		if(finishCount==count){
			      			self.isLock=false;
			      		}
			      	});
			      	tempDefer.start();
				}
				if(!!this.cursorImage){
		      		var tempCursorDefer=zr.animate(this.cursorImage);
		      		var self=this;
		      		if(index==0){
		      			var tempCursor=Math.PI/2;
		      		}else{
		      			var tempCursor=this.currentCursor+Math.PI*(count/(this.opt.totalPiece-1));
		      		}
		      		tempCursorDefer.when(originOffset*(count+2),{
		      			rotation:[tempCursor,0,75]
		      		})
		      		.done(function(){
		      			self.currentCursor=tempCursor;
		      		})
		      		tempCursorDefer.start();
		      	}
				this.index=index;
			}else if(index>this.index&&index<=this.opt.totalPiece){
				self.isLock=true;
				var tempArr=this.lineArr.slice(this.index,index);
				var count=tempArr.length;
				var finishCount=0;
				for(var i=0;i<count;i++){
					var tempDefer=zr.animate(tempArr[i],'style');
					tempDefer.when(originOffset*(i+1),{
			          strokeColor:lineStrokeBlank
			        })
			      	.when(originOffset*(i+2),{
					  strokeColor:lineStrokeActive
			      	})
			      	.done(function(){
			      		finishCount++;
			      		if(finishCount==count){
			      			self.isLock=false;
			      		}
			      	});
			      	tempDefer.start();
				}
				if(!!this.cursorImage){
		      		var tempCursorDefer=zr.animate(this.cursorImage);
		      		var self=this;
		      		if(index==this.opt.totalPiece){
		      			var tempCursor=-Math.PI/2;
		      		}else if(index==1){
		      			var tempCursor=Math.PI/2;
		      		}else{
		      			if(this.index==0){
		      				var tempCursor=this.currentCursor-Math.PI*((count-1)/(this.opt.totalPiece-1));
		      			}else{
		      				var tempCursor=this.currentCursor-Math.PI*((count)/(this.opt.totalPiece-1));
		      			}
		      		}
		      		tempCursorDefer.when(originOffset*(count+2),{
		      			rotation:[tempCursor,0,75]
		      		})
		      		.done(function(){
		      			self.currentCursor=tempCursor;
		      		});
		      		tempCursorDefer.start();
		      	}
				this.index=index;
			}
		}
	});
	exports.create=function(options){
		var speedObj=new speed(options);
		return speedObj;
	}
});