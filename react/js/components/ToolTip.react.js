import React from 'react';
import Actions from '../actions/Actions';
import AppStore from '../stores/AppStore';
import InjectionList from './InjectionList.react';
import ColorBar from './ColorBar.react';
import MainFlne from './MainFlne.react';
import ViewSwitch from './ViewSwitch.react';
import Modal from '../lib/modal';
import AppDispatcher from '../dispatcher/AppDispatcher';
import _ from 'lodash';
import * as d3 from 'd3';
import classNames from 'classnames';
import {toTitleCase, getBlueColorFunc, scientificNotion, getTargetAreaSummaryHTML, svgAddHatchLine} from '../lib/utils';
import {Connectivity} from '../lib/connectivity';
import QuickLinks from './QuickLinks.react';
import {Area, Areas, Injection, Injections} from '../lib/utils';

export default class ToolTip extends React.Component {
    constructor(props, context) {
        super(props, context);
        _.bindAll(this, 'handleMouseEnter', 'handleMouseLeave');
        this.state = {
            showTip: false,
        }
    }
    handleMouseEnter(e) {
        this.setState({
            showTip: true
        });
    }
    handleMouseLeave(e) {
        this.setState({
            showTip: false
        });
    }
    render() {
        let display;
        if (this.state.showTip) {
            display = 'block';
        } else {
            display = 'none';
        }
        return (<span data-title={this.props.content} className={this.props.className}
            onMouseEnter={this.handleMouseEnter}
            onMouseLeave={this.handleMouseLeave}
            style={{position: 'relative'}}
            >{this.props.children}
                <span className="tooltip matrix-view" style={{display: display, position: 'absolute', top: '-30px', width: '350px', backgroundColor: '#fff', border: '1px solid black'}}>{this.props.title}</span>
            </span>);
    }
};
