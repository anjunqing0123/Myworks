{

    var ReqUrl = "http://qr.liantu.com/api.php?m=5&text=";
    var Container = React.createClass({
        displayName: "Container",

        render: function () {
            let code = ReqUrl + encodeURIComponent(this.props.data.url);
            let { title, url } = this.props.data;
            return React.createElement(
                "div",
                null,
                React.createElement(
                    "div",
                    { className: "title" },
                    React.createElement(
                        "b",
                        null,
                        title
                    )
                ),
                React.createElement(
                    "div",
                    { className: "url" },
                    url
                ),
                React.createElement(
                    "div",
                    { className: "code" },
                    React.createElement("img", { src: code })
                ),
                React.createElement(
                    "div",
                    { className: "info" },
                    "author: ",
                    React.createElement(
                        "a",
                        { href: "mailto:tengxia@pptv.com" },
                        "tengxia@pptv.com"
                    )
                )
            );
        }
    });

    var Error = React.createClass({
        displayName: "Error",

        render: function () {
            return React.createElement(
                "div",
                { id: "error" },
                React.createElement(
                    "div",
                    { className: "img-contain" },
                    React.createElement("img", { src: "image/tip.png" })
                ),
                React.createElement(
                    "span",
                    { className: "txt-contain" },
                    "出现了小问题~！ (｡◕ˇ∀ˇ◕）"
                )
            );
        }
    });

    var render = (state, data) => {
        if (state) {
            ReactDOM.render(React.createElement(Container, { data: data }), document.getElementById('container'));
        } else {
            ReactDOM.render(React.createElement(Error, null), document.getElementById('container'));
        }
    };

    {
        chrome.tabs.getSelected(tab => {
            console.log(tab);
            if (tab) {
                var data = {
                    title: tab.title,
                    url: tab.url
                };
                render(1, data);
            } else {
                render(0);
            }
        });
    }
}