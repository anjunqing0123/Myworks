define(function(require, exports){
	var $=require('jquery');
	var loader=require('../loader/loader');
	var voteIdMap={};
	voteIdMap.prior={};
	voteIdMap.id=[];
	/*
		数据结构
		{
			idkey1:信息obj,
			idkey2:信息obj,
			...
			id:Array[] 存放所有的id
			prior:Object 存放所有优先级，默认9999 : [] 
		}
		getCollection 之后返回的 example
		{
			17579:{
				data:{
					counter:13497,
					endedAt:1446307199,
					startedAt:1444579200,
				},
				doms:[jqueryobj,jqueryobj],
				prior:9999,
			},
			17561:{
				data:{
					counter:13497,
					endedAt:1446307199,
					startedAt:1444579200,
				},
				doms:[jqueryobj,jqueryobj],
				prior:9999,
			},
			17563:{
				data:{
					counter:13497,
					endedAt:1446307199,
					startedAt:1444579200,
				},
				doms:[jqueryobj,jqueryobj],
				prior:3,
			}
			id:[17579,17561],
			prior:{
				9999:[17159,17561],
				3:[17563]
			}
		}
	 */
	 function delSingle(voteId,prior){
		if(!!voteIdMap[voteId]){
			if(!prior){
				prior=9999;
			}
			var ids=voteIdMap.id;
			var idIndex=_searchDomIdx(ids,voteId);
			if(idIndex!=-1){
				ids.splice(idIndex,1);
			}
			var priorArr=voteIdMap['prior'][prior];
			if(!prior){
				var priorIndex=-1;
			}else{
				var priorIndex=_searchDomIdx(priorArr,voteId);
			}
			if(priorIndex!=-1){
				priorArr.splice(priorIndex,1);
			}
			voteIdMap[voteId].doms=[];
			delete voteIdMap[voteId];
		}
	}
	function reset(){
		voteIdMap={};
		voteIdMap.prior={};
		voteIdMap.id=[];
	}
	function init(options){
		reset();
		//console.log(options.selector);
		$(options.selector).each(function(){
			var obj=$(this);
			//console.log(obj);
			var voteId=obj.attr(options.voteAttr);
			if(!voteId){
				return false;
			}
			if(typeof options.prior!='undefined'){
				var prior=obj.attr(options.prior);
			}else{
				var prior=undefined;
			}
			_add(voteId,obj,prior);
		});
	}
	function _add(voteId,dom,prior,updateCounter){
		if(!voteIdMap[voteId]){
			voteIdMap[voteId]={};
			voteIdMap[voteId]['doms']=[];
			voteIdMap[voteId]['doms'].push(dom);
			if(!!updateCounter){
				voteIdMap[voteId]['data']=Number(dom.text());
			}
			if(!prior){
				prior=9999;
			}
			voteIdMap[voteId]['prior']=prior;
			if(!voteIdMap['prior'][prior]){
				voteIdMap['prior'][prior]=[];
				voteIdMap['prior'][prior].push(voteId);
			}else{
				voteIdMap['prior'][prior].push(voteId);
			}
			voteIdMap.id.push(voteId);
		}else{
			if(!!updateCounter){
				voteIdMap[voteId]['data']=Number(dom.text());
			}
			voteIdMap[voteId]['doms'].push(dom);
		}
	}
	function add(voteId,dom,prior){
		if(!dom&&typeof voteId=="object"&&!$.isArray(voteId)){
			$(voteId.selector).each(function(){
				var obj=$(this);
				var id=obj.attr(voteId.voteAttr);
				if(!id){
					return false;
				}
				if(typeof voteId.prior!='undefined'){
					var prior=obj.attr(voteId.prior);
				}
				if(voteId.updateCounter==true){
					_add(id,obj,prior,true);
				}else{
					_add(id,obj,prior,false);
				}
			});
		}else if($.isArray(voteId)){
			for(var i=0;i<voteId.length;i++){
				var obj=voteId[i];
				_add(obj.voteId,obj.dom,obj.prior);
			}
		}else{
			_add(voteId,dom,prior);
		}
	}
	function getvoteIdMap(){
		return voteIdMap;
	}
	var boolIndexof=Array.prototype.indexOf;
	function _searchDomIdx(arr,val){
		if(!!boolIndexof){
			return arr.indexOf(val);
		}else{
			for(var i=0;i<arr.length;i++){
				if(val==arr[i]){
					return i;
				}
			}
			return -1;
		}
	}
	function priority(id,prior){
		if(!voteIdMap[id]){
//			console.log('id不存在');
			return false;
		}else{
			if(typeof prior!="undefined"){
				//set
				var origPrior=voteIdMap[id]['prior'];
				var origPriorArr=voteIdMap['prior'][origPrior];
				var searchid=_searchDomIdx(origPriorArr,id);
				//console.log(searchid);
				if(!~searchid){
					return false;
				}else{
					origPriorArr.splice(searchid,1);
					var newPriorArr=voteIdMap['prior'][prior];
					if(typeof newPriorArr=="undefined"){
						voteIdMap['prior'][prior]=[];
						voteIdMap['prior'][prior].push(id);
					}else{
						newPriorArr.unshift(id);
					}
				}
			}
		}
	}
	function delPrior(prior){
		if(!!prior){
			var arr=voteIdMap.prior[prior];
			var idArr=voteIdMap.id;
			var idArrTemp;
			if(!!arr&&$.isArray(arr)){
				for(var i=0;i<arr.length;i++){
					idArrTemp=_searchDomIdx(idArr,arr[i]);
					if(~idArrTemp){
						idArr.splice(idArrTemp,1);
					}
					delete voteIdMap[arr[i]];
				}
			}
			delete voteIdMap.prior[prior];
		}
	}
	var defaults={
		url:"http://api.cdn.vote.pptv.com/vote/collection",
		singleurl:'http://api.cdn.vote.pptv.com/vote/',
		seperator:','
	}
	function getVotes(options){
		if(!!$.isEmptyObject(voteIdMap)){
			return false;
		}
		if(!options.callback){
			return false;
		}
		var opts=$.extend({},defaults,options);
		var finalData,finalUrl;
		var prior=opts.prior;
		var seperator=opts.seperator;
		var finalidArr=prior ? voteIdMap['prior'][prior] : opts.id ? opts.id : voteIdMap.id;
		if(finalidArr.length==1||typeof finalidArr=="string"){
			if(typeof finalidArr=="string"){
				var temp=finalidArr;
				finalidArr=[];
				finalidArr[0]=temp;
			}
			finalUrl=opts.singleurl+finalidArr[0];
			finalData={
				ids: finalidArr.join(opts.seperator)
			};
		}else{
			finalData={
				ids:finalidArr.join(opts.seperator)
			}
			finalUrl=opts.url;
		}
		if(!finalData.ids){
			return false;
		}
		finalData.__config__={
			cdn:true,
			callback:"updateVote"
		}
		loader.load(finalUrl,finalData,function(data){
			if(data.errors){
				return false;
			}
			//单个id
			if(data.counter!=null&&voteIdMap[finalidArr[0]]){
				voteIdMap[finalidArr[0]]['data']=data;
			}else{
				//多个id
				var votes=data.votes;
				for(var key in votes){
					if(!!voteIdMap[key]){
						voteIdMap[key]['data']=votes[key];
					}
				}
			}
			options.callback.call(opts.context||null,voteIdMap,finalidArr);
		});
	}
	return{
		init : init,
		reset:reset,
		add:add,
		get:getvoteIdMap,
		priority:priority,
		getVotes:getVotes,
		delPrior:delPrior,
		delSingle:delSingle
	}
});
