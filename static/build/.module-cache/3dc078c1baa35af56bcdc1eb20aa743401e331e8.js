// React.render(
//   <h1>Hello, world!</h1>,
//   document.getElementById('box1')
// );

React.render(
  React.createElement('h1', null, 'Hello, world!'),
  document.getElementById('box1')  
);