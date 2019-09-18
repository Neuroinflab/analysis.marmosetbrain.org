import React, {Component} from 'react';
import Actions from '../actions/Actions';
import AppStore from '../stores/AppStore';
import InjectionList from './InjectionList.react';
import Modal from '../lib/modal';
import {toTitleCase} from '../lib/utils';
import _ from 'lodash';
import * as d3 from 'd3';
import classNames from 'classnames';

export default class Slider extends Component {
    constructor (props, context) {
        super(props, context)
        //let state = _.extend({}, AppStore.getPseudo3D());
        let state = {
            [this.props.axis]: AppStore.getPseudo3D()[this.props.axis]
        };
        //this.state = AppStore.getPseudo3D();
        this.state = state;
        _.bindAll(this, 'handleChange', 'handleExternalChange', 'handleMouseWheel');
    }

    componentDidMount() {
        let slider = this.slider;
        //document.getElementById("myItem");
        if (slider.addEventListener)
        {
            // IE9, Chrome, Safari, Opera
            slider.addEventListener('mousewheel', this.handleMouseWheel, false);
            // Firefox
            slider.addEventListener('DOMMouseScroll', this.handleMouseWheel, false);
        }
        // IE 6/7/8
        else
        {
            slider.attachEvent('onmousewheel', this.handleMouseWheel);
        }
        AppStore.addChangeListener(this.handleExternalChange);
    }
    componentWillUnmount() {
        AppStore.removeChangeListener(this.handleExternalChange);
    }
    handleChange(e) {
        let value = parseInt(e.target.value, 10);
        Actions.set3DIndex(this.props.axis, value);
        //this.setState(AppStore.getPseudo3D());
        this.setState({[this.props.axis]: value});
    }
    handleExternalChange() {
        let state = AppStore.getPseudo3D();
        this.setState({[this.props.axis]: state[this.props.axis]});
    }
    handleMouseWheel(e) {
        e.preventDefault();
        // cross-browser wheel delta
        //let e = window.event || e; // old IE support
        let delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        let value;
        if (delta > 0) {
            value = this.state[this.props.axis] - this.props.step;
        } else {
            value = this.state[this.props.axis] + this.props.step;
        }
        if (value < this.props.min) {
            value = this.props.min;
        } else if (value > this.props.max) {
            value = this.props.max;
        }
        Actions.set3DIndex(this.props.axis, value);
        this.setState({[this.props.axis]: value});
        return false;
    }
    render () {
        const value = this.state[this.props.axis];
        return (
            <div className="slider">
                <input type="range" min={this.props.min} max={this.props.max}
                    orient={this.props.orient}
                    onChange={this.handleChange} value={value}

                    ref={(input) => this.slider = input} />
                {this.props.children}
            </div>
        )
    }
}
