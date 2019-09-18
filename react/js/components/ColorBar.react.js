import React from 'react';
import Actions from '../actions/Actions';
import AppStore from '../stores/AppStore';
import _ from 'lodash';
import * as d3 from 'd3';
import MainFlne from './MainFlne.react';
import InjectionList from './InjectionList.react';
import numberFormat from '../lib/numberformat';
import classNames from 'classnames';
import AppDispatcher from '../dispatcher/AppDispatcher';
import {toTitleCase, getLogColorFunc, showTooltipAreaName, hideTooltip, getColorGradient} from '../lib/utils';
//
//function toTitleCase(str) {
//    //return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
//    return str.charAt(0).toUpperCase() + str.substr(1);
//}
export default class ColorBar extends React.Component {
    constructor(props, context) {
        super(props, context);
        _.bindAll(this, 'handleChange');
    }
    componentDidMount() {
        AppStore.addChangeListener(this.handleChange);
        let svg = d3.selectAll('.color-bar').append('img');
        switch (this.props.style) {
            case 'matrix':
            default:
                if (this.props.mode == 'FLN') {
                    svg.attr('src', '/static/images/color_bar.svg');
                    svg.attr('width', '630');
                } else {
                    svg.attr('src', '/static/images/color_bar_sln.svg');
                    svg.attr('width', '630');
                }
                break;
            case 'graph':
                //svg.attr('src', '/static/images/color_bar_graph.svg');
                svg.attr('src', '/static/images/2017-11-01-10-13-connectivity_graph_colorbar.png');
                svg.attr('width', '288');
                break;
        }
        /*
        let svg = d3.selectAll('.color-bar').append('svg');
        let defs = svg.append("defs");
        let that = this;
        let linearGradient = defs.append('linearGradient')
            .attr('id', 'linear-gradient');
        let a = linearGradient
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%")
            .selectAll('stop')
            .data(getColorGradient())
            .enter()
            .append("stop")
            .attr("offset", function(d) { console.log('wtf', d); return d.offset; })
            .attr("stop-color", function(d) { return d.color; });
        svg.append("rect")
            .attr("width", 300)
            .attr("height", 20)
            .style("fill", "url(#linear-gradient)");
            let scaler = d3.axisBottom()
                .scale(that.getBarWidthFunc(0, 0))
                .tickSizeInner(10)
                .tickSizeOuter(0)
                .ticks(5);
        let scaler_dom = svg.append('g')
            .attr('transform', 'translate(0,' + 20 + ')')
            .attr('class', 'axis-buttom')
            .call(scaler);
        scaler_dom.selectAll('.tick line').filter((d, i, l) => i == 0 || (i === l.length - 1)).attr('display', 'none');
        let title = svg.append('text')
            .attr('class', 'scale-x-title')
            .attr('transform', 'translate(' + (320 / 2 - 20) + ', ' + (180) + ')')
            .attr('text-anchor', 'middle');
        title.append('tspan').attr('font-size', '12').text('log');
        title.append('tspan').text('10').attr('baseline-shift', 'sub');
        title.append('tspan').attr('font-size', '12').text('');
        */

    }
    getBarWidthFunc(min, max) {
        min = -6, max = 0;
        let func = d3.scaleLinear().domain([min, max]).range([0, 300]);
        return func;
    }
    handleChange() {
        this.setState({nodePicked: AppStore.getNodePicked()});
    }
    /**
     * @return {object}
     */
    render() {
        let content = (
                <section className={classNames('color-bar', this.props.style)}>
                </section>
            );
        return content;
    }

};

