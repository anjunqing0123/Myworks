import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux'
import { connect,Provider } from 'react-redux'
import Header from '../components/Header';
import Content from '../components/Content';
import * as Actions from '../actions';

import { render } from 'react-dom'
import bindAction from './bindAction'
import configureStore from '../store/configureStore'

import CommonUtils from '../utils/CommonUtils';

class App extends Component{
    render(){
        const {todos, actions} = this.props;
        return (
            <div>
                <Header actions={actions} />
                <Content todos={todos} actions={actions} />
            </div>
        );
    }
}

const Page = bindAction.bind(App)
const store = configureStore()

render(
  <Provider store={store}>
    <Page />
  </Provider>,
  CommonUtils.getDom('app')
)