import React from 'react';
import Actions from '../actions/Actions';
import AppStore from '../stores/AppStore';
import _ from 'lodash';
import MainSection from './MainSection.react';
import MainGraph from './MainGraph.react';
import MainMatrix from './MainMatrix.react';
import MainSection2 from './MainSection2.react';
import SLN from './SLN.react';
import Header from './Header.react';
import Footer from './Footer.react';

function getState() {
    return {
    };
}

export default class AnalysisApp extends React.Component {
    constructor(props, context) {
        super(props, context);
        this.state = getState();
        _.bindAll(this, 'handleChange');
    }

    componentDidMount() {
        //AppStore.addChangeListener(this.handleChange);
    }

    componentWillUnmount() {
        //AppStore.removeChangeListener(this.handleChange);
    }

    /**
     * @return {object}
     */
    render() {
        let page = null;
        switch (app.page) {
            case 'graph':
                {
                    page = (<MainGraph />);
                }
                break;
            case 'matrix':
                {
                    page = (<MainMatrix />);
                }
                break;
            case 'main2':
                {
                    page = (<MainSection2 />);
                }
                break;
            case 'sln':
                {
                    page = (<SLN />);
                }
                break;
            default:
                // default no-op;
                break;

        }
        return (
            <div className="react-root">
                {page}
            </div>
        );
    }

    handleChange() {
        this.setState(getState());
    }

}
