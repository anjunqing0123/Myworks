define(function(require,exports) {
	var client_suffix='?plt=clt';
	var redirectiUrl={
		'registration':'http://chang.pptv.com/pc/registration',
		'registrationComplete':'http://chang.pptv.com/pc/registration/pg_complete',
		'usercenter':'http://passport.pptv.com/usercenter.aspx',
		'oneSingTab':'http://passport.pptv.com/v2/profile/yichangchengming.jsp',
		'upload':'http://chang.pptv.com/pc/upload',
		'contract_client':'http://w2c.pptv.com/p/zt.chang.pptv.com/news/protocol/17551401.html',
		'contract_pc':'http://zt.chang.pptv.com/news/protocol/17551401.html'
	}
	// chackSign 确认是否报名
	var interfaceUrl={
		'checkSign':'http://api.chang.pptv.com/api/checksign',
		'phonetoken':'http://api.chang.pptv.com/api/phonetoken',
		'sign':'http://api.chang.pptv.com/api/sign',
		'voteCollection': 'http://api.cdn.vote.pptv.com/vote/collection',
		'videoRank': 'http://chang.pptv.com/api/video_rank',
		'gettreadmill': 'http://api.cdn.chang.pptv.com/api/gettreadmill',
		'speed': 'http://chang.pptv.com/api/speed',
		'singList': 'http://api.cdn.chang.pptv.com/api/singList',
		'uploadCommit': 'http://api.chang.pptv.com/api/cimmit_video',
		'tagMarquee':'http://chang.pptv.com/api/rank_list',
		'PKList_pc':'http://api.cdn.chang.pptv.com/api/PKList_pc',
		'reward':'http://chang.pptv.com/api/reward',
		'videoList':'http://chang.pptv.com/api/video_list',
		'pklistAll':'http://chang.pptv.com/api/pk',
		'concertAll':'http://chang.pptv.com/api/concert',
		'goldlist':'http://chang.pptv.com/api/sprint_players',
		'matchResult':'http://chang.pptv.com/api/match_result',
		'goldExtra':'http://chang.pptv.com/api/pg_sprint_players_extra'
	};
	var commonUrl={
		'pc':{
			'player':'http://chang.pptv.com/pc/player/',
			'suffix':''
		},
		'clt':{
			'player':'http://chang.pptv.com/pc/player/',
			'suffix':'plt=clt'
		},
		'app':{
			'player':'http://chang.pptv.com/app/player/',
			'suffix':'type=app'
		},
		'h5':{
			'player':'http://chang.pptv.com/app/player/',
			'suffix':'type=share'
		},
		'ipad':{
			'player':'http://chang.pptv.com/ipad/player/',
			'suffix':'type=app'
		}
	}
	return {
		'redirect':redirectiUrl,
		'interface':interfaceUrl,
		'commonUrl':commonUrl
	}
});