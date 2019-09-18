import React from 'react';
import Actions from '../actions/Actions';
import AppStore from '../stores/AppStore';
import _ from 'lodash';

export default class Header extends React.Component {
    constructor(props, context) {
        super(props, context);
        _.bindAll(this, 'handleChange');
        this.state = {
            stage: 'initial'
        }
    }
    componentDidMount() {
        AppStore.addChangeListener(this.handleChange);

    }
    componentWillUnmount() {
        AppStore.removeChangeListener(this.handleChange);
    }
    handleChange() {
        //this.setState({stage: AppStore.getActiveStage()});
    }
    /**
     * @return {object}
     */
    render() {
        return (
            <div className="row-wrapper">
              <div className="outer-container">
                <header>
                  <img id="logo" src="static/images/logo.svg" />
                  <nav>
                    <a href="#">Home</a>
                    <a href="#">About</a>
                    <a href="#">Contact</a>
                  </nav>
                </header>
              </div>
            </div>
        );
    }
}
