import React, {Component} from 'react';
import Actions from '../actions/Actions';
import AppStore from '../stores/AppStore';
import _ from 'lodash';
import classNames from 'classnames';
import numberFormat from '../lib/numberformat';
import * as d3 from 'd3';
import Modal from '../lib/modal';
import Slider from './Slider.react';
import Pseudo3D from './Pseudo3D.react';
import {toTitleCase, getLogColorFunc, getBlueColorFunc, showTooltipAreaName,
    hideTooltip, svgAddHatchLine} from '../lib/utils';
import ToolTip from './ToolTip.react';

let modalStyle = {
    width: '80%',
    maxWidth: '1200px',
    scrollX: 'auto',
    overflow: 'scroll',
    maxHeight: '100%'
};

export default class MainFlne extends Component {
    constructor(props, context) {
        super(props, context);
        _.bindAll(
            this, 'handleChange', 'getBarWidthFunc', 'handleDownloadSVG', 'handleDownloadCSV',
            'handleDownloadGraph', 'handleDownloadSVGHelp', 'handleCloseDownloadSVGHelp');
        this.flne = undefined;;
        this.state = {
            injections: [],
            strengthExists: false
        };
    }
    componentDidMount() {
        let that = this;
        AppStore.addChangeListener(this.handleChange);
        this.svg_flne_parent = d3.select('.flne-bar');
        this.svg_flne = this.svg_flne_parent.append('svg')
            .attr('width', 365)
            .attr('height', 200)
        svgAddHatchLine(this.svg_flne);
        let flne = this.svg_flne
            .append('g')
            .attr('transform', 'translate(50, 5)');
        this.flne = flne;

    }
    componentWillUnmount() {
        AppStore.removeChangeListener(this.handleChange);
    }
    showTooltip(source_id, x = null, y = null) {
        let source = this.props.areas.byAbbrev[source_id];
        let tooltip = d3.select('div.tooltip');
        tooltip.classed('matrix-view', false);
        tooltip
            .style('opacity', .9);
        let x_ = x, y_ = y;
        if (x_ === null) {
            x_ = d3.event.pageX + 24;
        }
        if (y_ === null) {
            y_ = d3.event.pageY - 40;
        }
        let txt = source.fullname; //this.abbrev_lookup[source].fullname;
        tooltip.html(txt)
            .style("left", (x_) + "px")
            .style("top", (y_) + "px");
    }
    getBarWidthFunc(min, max) {
        if (this.props.mode == 'SLN') {
            min = 0;
            max = 1;
        } else {
            min = -5.5, max = 0;
        }
        let func = d3.scaleLinear().domain([min, max]).range([1, 300]);
        return func;
    }

    handleChange() {
        let that = this;
        let _areas = AppStore.getAreas();
        let area = AppStore.getTargetAreaPicked();
        if (!area) {
            return;
        }
        let data_attr;
        let strength;
        if (this.props.mode == 'SLN') {
            data_attr = 'sln';
            const conn = AppStore.getConnectivity();
            strength = [];
            _.each(conn.get_by_target(area), s => {
                if (s.source !== undefined) {
                    if (s.sln >= 0) {
                        strength.push({
                            source: s.source.abbrev,
                            gmeannz: s.gmeannz,
                            log10_flne: Math.log10(s.flne),
                            sln: s.sln,
                            sln_notdefined: s.sln_notdefined,
                        });
                    } else if (s.sln_notdefined) {
                        /*
                        strength.push({
                            source: s.source.abbrev,
                            gmeannz: s.gmeannz,
                            log10_flne: Math.log10(s.flne),
                            sln: 1.0,
                            sln_notdefined: s.sln_notdefined,
                        });
                        */
                    }
                }
            });
            strength = _.sortBy(strength, data_attr);
            that.strength_area_count = _.filter(strength, {sln_notdefined: false}).length;
        } else {
            data_attr = 'log10_flne';
            const conn = AppStore.getConnectivity();
            strength = [];
            _.each(conn.get_by_target(area), s => {
                if (s.source !== undefined && s.flne > 0) {
                    strength.push({
                        source: s.source.abbrev,
                        gmeannz: s.gmeannz,
                        log10_flne: Math.log10(s.flne),
                    });
                }
            });
            strength = _.reverse(_.sortBy(strength, data_attr));
            that.strength_area_count = strength.length;
        }
        let scaler, scaler_dom;
        let y = null, flne_height = 100;

        if (strength.length > 0) {
            let flne = this.flne;
            that.setState({strengthExists: true});
            flne_height = 10 * strength.length;
            d3.select('.flne-bar svg').attr('height', flne_height + 45);
            y = d3.scaleBand().range([0, flne_height]);
            y.round(true);
            y.paddingInner(.1);
            flne.selectAll('.row').remove();
            flne.selectAll('.axis-bottom').remove();
            let srcs = _.map(strength, 'source');
            y.domain(srcs);
            let flne_arr = _.map(strength, data_attr);

            let min = _.min(flne_arr), max = _.max(flne_arr);
            let colorFunc;
            if (this.props.mode == 'SLN') {
                const _func = getBlueColorFunc();
                colorFunc = function(d) {
                    if (d.sln_notdefined) {
                        return 'url("#diagonalHatch")';
                    } else {
                        return _func(d[data_attr]);
                    }
                }
            } else {
                const _func = getLogColorFunc();
                colorFunc = function(d) {
                    return _func(d[data_attr]);
                }
            }
            let barWidthFunc = that.getBarWidthFunc(min, max);
            let row = flne.selectAll('.row')
                .data(strength, d => d);
            let row_enter = row.enter()
                .append('g')
                .attr('class', 'row');
            row_enter.append('text')
                .attr('class', 'flne-label');
            row_enter.append('rect')
                .attr('class', 'flne-rect');

            function showValue(node, d) {
                d3.select(node).selectAll('rect').attr('fill', 'brown');
                console.log('value', d[data_attr]);
                let textAtBehindThreshold;
                if (that.props.mode == 'SLN') {
                    textAtBehindThreshold = 0.12;
                } else {
                    textAtBehindThreshold = -4.5;
                }
                let anchor, x, fill;
                if (d[data_attr] < textAtBehindThreshold) {
                    anchor = 'begin';
                    x = barWidthFunc(d[data_attr]) + 5;
                    fill = 'black';
                } else {
                    anchor = 'end';
                    x = barWidthFunc(d[data_attr]) - 5;
                    fill = 'white';
                }
                d3.select(node).append('text')
                    .attr('x', x)
                    .attr('y', (d, i) => y(d.source) + y.bandwidth() / 2)
                    .attr('text-anchor', anchor)
                    .attr('alignment-baseline', 'middle')
                    .attr('stroke', 'none')
                    .style('font-weight', 'bold')
                    .attr('fill', fill)
                    .attr('class', 'num')
                    .text(d[data_attr].toFixed(2));
            }
            row_enter.selectAll('.flne-label')
                .attr('x', -6)
                .attr('y', (d, i) => {
                    return y(d.source) + y.bandwidth() / 2
                })
                .attr('text-anchor', 'end')
                .attr('alignment-baseline', 'middle')
                .text(d => d.source)
                .on('mouseover', function(d, i) {
                    let me = d3.select(this);
                    that.areaBarMouseOver(me, _areas.byAbbrev[d.source], area);
                    that.areaLabelMouseOver(me, _areas.byAbbrev[d.source], area);
                    showValue(this.parentNode, d);
                })
                .on('mouseout', function(d, i) {
                    let me = d3.select(this);
                    that.areaBarMouseOut(me, _areas.byAbbrev[d.source], area);
                    that.areaLabelMouseOut(me, _areas.byAbbrev[d.source], area);
                    d3.select(this.parentNode).selectAll('rect').attr('fill', colorFunc(d));
                    d3.select(this.parentNode).selectAll('.num').remove();
                })
            row_enter.selectAll('.flne-rect')
                .attr('x', 0)
                .attr('y', (d, i) => y(d.source))
                .attr('width', d => {
                    return barWidthFunc(d[data_attr]);
                })
                .attr('height', y.bandwidth())
                .attr('fill', d => colorFunc(d))
                .on('mouseover', function(d, i) {
                    let me = d3.select(this);
                    that.areaBarMouseOver(me, _areas.byAbbrev[d.source], area);
                    that.areaLabelMouseOver(me, _areas.byAbbrev[d.source], area);
                    showValue(this.parentNode, d);
                })
                .on('mouseout', function(d, i, p) {
                    let me = d3.select(this);
                    that.areaBarMouseOut(me, _areas.byAbbrev[d.source], area);
                    that.areaLabelMouseOut(me, _areas.byAbbrev[d.source], area);
                    d3.select(this).attr('fill', colorFunc(d));
                    d3.select(this.parentNode).selectAll('.num').remove();
                })
            if (this.props.mode == 'FLN') {
                scaler = d3.axisBottom()
                    .scale(barWidthFunc)
                    .tickSizeInner(-flne_height)
                    .tickSizeOuter(0)
                    .tickValues([-5, -4, -3, -2, -1, 0])
                    .tickFormat(d3.format(',d'));
                    //.ticks(6);
            } else {
                scaler = d3.axisBottom()
                    .scale(barWidthFunc)
                    .tickSizeInner(-flne_height)
                    .tickSizeOuter(0)
                    .tickValues([0, 0.2, 0.4, 0.6, 0.8, 1])
                    .tickFormat(d3.format(',.1f'));
                    //.ticks(6);
            }
            scaler_dom = flne.append("g")
                .attr("transform", "translate(0," + flne_height + ")")
                .attr('class', 'axis-bottom')
                .call(scaler);
            scaler_dom.selectAll('.tick line').filter((d, i, l) => (i === l.length - 1)).attr('display', 'none');
            d3.selectAll('.main-bar-scale-x-title').remove();
            let title = flne.append('text')
                .attr('class', 'main-bar-scale-x-title')
                .attr('transform', 'translate(' + (320 / 2 - 20) + ', ' + (flne_height + 25) + ')')
                .attr('text-anchor', 'middle')
            if (this.props.mode == 'FLN') {
                title.append('tspan').attr('font-size', '12').text('log');
                title.append('tspan').text('10').attr('baseline-shift', 'sub');
                title.append('tspan').attr('font-size', '12').text('(' + this.props.mode + 'e)');
            } else {
                title.append('tspan').attr('font-size', '12').text('' + this.props.mode + 'e');
            }
        } else {
            let flne = this.flne;
            that.setState({strengthExists: false});
            flne.selectAll('.row').remove();
            d3.select('.flne-bar svg').attr('height', flne_height);
            if (scaler_dom) {
                scaler_dom.remove();
            }
        }
        // continue to furnish injection detail
        let injections = _.filter(that.static_inj, {abbrev: area.abbrev});
        //Actions.nodeDetail(injections);
        this.setState({nodePicked: AppStore.getNodePicked()});
    }
    areaBarMouseOver(me, from_, to) {
        Actions.highlightEdge(from_, to, '#000000');
        Actions.boldEdge(from_, to);
    }
    areaBarMouseOut(me, from_, to) {
        Actions.unhighlightEdge(from_, to, '#000000');
        Actions.unboldEdge(from_, to);
    }
    areaLabelMouseOver(me, from_, to) {
        let bbox = me.node().getBoundingClientRect();
        let top = bbox.top + $(document).scrollTop();
        showTooltipAreaName({area: from_, x: bbox.left, y: top - 35});
    }
    areaLabelMouseOut(me, from_, to) {
        hideTooltip();
    }
    handleDownloadSVG(e) {
        let html = this.svg_flne_parent.html();
        let b64 = btoa(html);
        let href = 'data:image/svg+xml;base64,\n' + b64;
        e.target.href = href;
        Actions.setDownloadLink(href, e, 'export_flatmap_graph.svg');

    }
    handleDownloadCSV(e) {
        if (this.state.nodePicked) {
            let href = '/static/data/individual_areas/flne_area_' + this.state.nodePicked.abbrev + '.csv';
            e.target.href = href;
            Actions.setDownloadLink(href, e);
        }
    }
    handleDownloadGraph(e) {
        let html = this.graph_parent.html();
        let b64 = btoa(html);
        let href = 'data:image/svg+xml;base64,\n' + b64;
        e.target.href = href;
        Actions.setDownloadLink(href, true);

    }
    handleDownloadSVGHelp(e) {
    }
    handleCloseDownloadSVGHelp(e) {
    }
    /*
    showDownloadSVGHelp(e) {
    }
    showDownloadCSVHelp(e) {
    }
    hideDownloadSVGHelp(e) {
    }
    hideDownloadCSVHelp(e) {
    }
    */
    /**
     * @return {object}
     */
    render() {
        let area_name = null;
        if (this.state.nodePicked) {
            if (this.props.mode == 'SLN') {
                //area_name = <span className="area-name" title={toTitleCase(this.state.nodePicked.fullname)}>area {this.state.nodePicked.abbrev}</span>;
                area_name = <ToolTip className="area-name" title={toTitleCase(this.state.nodePicked.fullname)}>area {this.state.nodePicked.abbrev}</ToolTip>;
            } else {
                area_name = toTitleCase(this.state.nodePicked.fullname) + ' (' + this.state.nodePicked.abbrev + ')';
            }
        }
        let download_svg = (
            <div className="link-button"><a onClick={this.handleDownloadGraph} download="export_flatmap_graph.svg">Download the graph as SVG</a></div>
        );
        let content = null;

            let sources = null;
            if (this.state.nodePicked) {
                sources = ', ' + this.strength_area_count + ' sources:';
            }
            // XXX hack to remove source summary
            sources = null;

        let header;
        if (this.props.mode == 'SLN') {
            header = (<span>Fraction of extrinsic supragranular neurons<br/>for </span>);
        } else {
            header = (<span>Connectivity profile for the<br/></span>);
        }
        return (
            <div className={classNames('main-flne', {hidden: !this.state.strengthExists})}>
                <div className="info-label">
                    {header}
                    <span className="injection-area-name">{area_name}{sources}</span>
                </div>
                <div className="flne-bar">
                </div>
                <div className="download">
                    <ul>
                        <li className="download-svg"><a onClick={this.handleDownloadSVG} download="export_svg.svg" title="Download FLNe bar chart as SVG drawing">Download bar chart as SVG drawing</a>
                        </li>
                        <li className="download-csv"><a onClick={this.handleDownloadCSV} title="Download FLNe data in CSV format">Download data as CSV file</a>&nbsp;
                        </li>
                    </ul>
                </div>
            </div>
        );
    }

};
