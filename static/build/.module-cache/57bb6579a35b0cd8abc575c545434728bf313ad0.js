// React.render(
//   <h1>Hello, world!</h1>,
//   document.getElementById('box1')
// );
// 
// 
// 
// 
// 
var ProfilePic = React.createClass({displayName: "ProfilePic",
  render: function() {
    return (
      React.createElement("img", {src: 'http://graph.facebook.com/' + this.props.username + '/picture'})
    );
  }
})

ReactDOM.render(React.createElement(ProfilePic, null), document.getElementById('box1')  
);