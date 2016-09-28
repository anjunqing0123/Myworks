{

    var ReqUrl = "http://qr.liantu.com/api.php?m=5&text=";
    var Container = React.createClass({
        render: function () {
            let code = ReqUrl + encodeURIComponent(this.props.data.url);
            let {title,url} = this.props.data;
            return (
                <div>
                    <div className="title"><b>{title}</b></div>
                    <div className="url">{url}</div>
                    <div className="code">
                        <img src={code}/>
                    </div> 
                    <div className="info" >author: <a href="mailto:tengxia@pptv.com">tengxia@pptv.com</a></div>
                </div> 
            )
        }
    })

    var Error = React.createClass({
        render: function () {
            return (
                <div id="error">
                    <div className="img-contain">
                        <img src="image/tip.png"/>
                    </div>
                    <span className="txt-contain">出现了小问题~！ (｡◕ˇ∀ˇ◕）</span>
                </div>
            )
        }
    })


    var render = (state, data) => {
        if (state) {
            ReactDOM.render(
                <Container data={data}/>,
                document.getElementById('container')
            );
        } else {
            ReactDOM.render(
                <Error/>,
                document.getElementById('container')
            )
        }
    }

    {
        chrome.tabs.getSelected((tab) => {
            console.log(tab);
            if (tab) {
                var data = {
                    title: tab.title,
                    url: tab.url
                }
                render(1, data)
            } else {
                render(0)
            }
        })
    }
}