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
import Modal from '../lib/modal';
import ColorBar from './ColorBar.react';
import {toTitleCase, getLogColorFunc, showTooltipAreaName, hideTooltip} from '../lib/utils';
//
//function toTitleCase(str) {
//    //return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
//    return str.charAt(0).toUpperCase() + str.substr(1);
//}
export default class MainSection2 extends React.Component {
    constructor(props, context) {
        window.d3js = d3;
        super(props, context);
        _.bindAll(
            this, 'handleChange', 'handleMouseOver', 'handleMouseOut', 'handleClick', 'highlightNode',
            'handleDownloadSVG', 'handleDownloadGraph', 'handleDownloadCSV', 'ajaxLoad', 'handleSwitchToMatrixView'
        );
        this.state = {
            strengthExists: false,
            ajaxDone: false,
        };
        this._areas = {
            byAbbrev: {},
            byIndex: {},
            byId: {}
        };
        this.pendingAjax = [];
        let pendingAjax = this.pendingAjax;
        this.ajaxLoad('injections_static.json', (inj) => {
            this.static_inj = inj;
            _.each(this.static_inj, (inj, key) => {
                inj.name = key;
                inj.collapse = true;
            });
            Actions.saveInjectionsStatic(inj);
        });
        this.ajaxLoad('flne_gmeannz_areas.json', (flne) => {
            this.flne_per_area = flne;
        });
        this.ajaxLoad('flne_gmeannz_injections.json', (flne) => {
            this.flne_per_injection = flne;
            this.setState({flne_per_injection: flne});
        });
        this.ajaxLoad('structures.json', (struct) => {
            _.each(struct, s => {
                let txt = s.fullname;
                txt = txt.charAt(0).toUpperCase() + txt.slice(1);
                s.fullname = txt;
                let cc = s.color;
                s.hex_color = 'rgba(' + cc[0] + ',' + cc[1] + ',' + cc[2] + ', 1)';
            });
            this.atlas_struct = struct;
        });
        this.ajaxLoad('connectivity_1_0_0.json', (conn) => {
            let that = this;
            this.connectivity = conn;
            let nodes = conn.nodes;
            let n = nodes.length;
            _.each(nodes, (node, i) => {
                node.index = i;
                that._areas.byIndex[i] = {abbrev: node.nodeName, serial: i};
                that._areas.byAbbrev[node.nodeName] = that._areas.byIndex[i];
            });
        });
    }
    ajaxLoad(file, callback) {
        this.pendingAjax.push(file);
        d3.json('/static/data/' + file, (error, data) => {
            if (error) throw error;
            callback(data);
            _.pull(this.pendingAjax, file);
            this.ajaxProgress();
        });
    }
    componentDidMount() {
        AppStore.addChangeListener(this.handleChange);
    }
    initialDraw() {
        let that = this;
        let width = 860, height= 880;
        this.graph_parent = d3.select('#d3');
        let svg = this.graph_parent.append('svg')
            .attr('width', width)
            .attr('height', height);

        svg.append("svg:defs").selectAll("marker")
            .data(["end", 'end-short'])      // Different link/path types can be defined here
            .enter().append("marker")    // This section adds in the arrows
            .attr("id", String)
            .attr("viewBox", "0 -5 10 10")
            //.attr("refX", d => (d == 'end' ? 40 : 75))
            .attr('refX', 35)
            .attr("refY", d => 0)
            .attr("markerWidth", 10)
            .attr("markerHeight", 10)
            .attr("orient", "auto")
            .style('stroke', '#333333')
            .style('fill', '#333333')
            .append("svg:path")
            .attr("d", "M1,-4L9,0L1,4");
        svg.append('g')
            .style('opacity', '0.1')
            .attr('transform', 'translate(0, 0)')
            .append('image')
            .attr('href', '/static/images/all_injections_on_flatmap.png');
        svg = svg.append('g')
            .attr('transform', 'translate(20, -50)');
        let color = d3.scaleOrdinal(d3.schemeCategory20);
        let flatmapScaleX = d3.scaleLinear().range([0, 960]);
        let flatmapScaleY = d3.scaleLinear().range([0, 960]);
        flatmapScaleX.domain([-20, 20]);
        flatmapScaleY.domain([20, -20]);

        // prepare all the structures
        let atlas_struct = this.atlas_struct;
        let abbrev_lookup = {};
        _.each(atlas_struct, (area) => {
            abbrev_lookup[area.abbrev] = area;
            let cc = area.color;
            area.hex_color = 'rgba(' + cc[0] + ',' + cc[1] + ',' + cc[2] + ', 1)';
        });
        this.abbrev_lookup = abbrev_lookup;


        // processing the connectivity data
        let connectivity = this.connectivity;
        // Compute the distinct nodes from the links.
        connectivity.nodes.forEach((n, i) => {
            n.index = i;
            n.area = abbrev_lookup[n.nodeName];
        });
        let z = d3.scaleLog().domain([1, 676]).clamp(true);
        let link_hash = {};
        let alphaScale = d3.scaleLinear().range([.2, .75]);
        alphaScale.domain([0, 60]).clamp(true);
        connectivity.links.forEach(function(link) {
            link.source = connectivity.nodes[link.source]
            link.target = connectivity.nodes[link.target]
            link.source.to = link.source.to || {};
            link.source.to[link.target.nodeName] = link.target;
            link.target.from = link.target.from || {};
            link.target.from[link.source.nodeName] = link.source;

            link.value = +link.value;
            link.alpha = alphaScale(link.value);
            //link_hash[link.target.nodeName] = link_hash[link.target.nodeName] || {};
            //link_hash[link.target.nodeName][link.source.nodeName] = link;
        });

        //let maxZ = 676;
        let links = svg.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(connectivity.links)
            .enter().append('g')
            .attr('class', d => 'link')
            .attr('data-from', d => d.source.nodeName)
            .attr('data-to', d => d.target.nodeName)
            .attr('data-alpha', d => d.alpha)
            .style('opacity', d => d.alpha)
            .each(function(d, i) {
                d3.select(this)
                    .selectAll('.link-path')
                    .data([d])
                    .enter()
                    .append('path')
                    .attr('class', 'link-path')
                    //.attr('marker-end', d => d.semi ? 'url(#end-short)' : '')
                    //.attr('stroke-width', function(d) { return Math.sqrt(d.value); });
                    .attr('stroke-width', d => 1)
                    .style('stroke', d => {
                        return 'rgb(50, 50, 50)';
                    })
                    .attr('d', d => {
                        let s_coord = abbrev_lookup[d.source.nodeName].flatmap_coord;
                        let sx = flatmapScaleX(s_coord[0]);
                        let sy = flatmapScaleY(s_coord[1]);
                        let t_coord = abbrev_lookup[d.target.nodeName].flatmap_coord;
                        let tx = flatmapScaleX(t_coord[0]);
                        let ty = flatmapScaleY(t_coord[1]);
                        return 'M' + sx + ',' + sy + ' L' + tx + ',' + ty;
                    });
            })
        /*
        this.svg_flne_parent = d3.select('.flne-bar');
        this.svg_flne = this.svg_flne_parent.append('svg')
            .attr('width', 365)
            .attr('height', 200)
        let flne = this.svg_flne
            .append('g')
            .attr('transform', 'translate(50, 5)');
        let scaler, scaler_dom;
        */
        let nodes = svg.append('g')
            .attr('class', 'nodes')
            .selectAll('.node')
            .data(connectivity.nodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .each(function(d, i) {
                d3.select(this)
                .selectAll('.node-circle')
                .data([d])
                .enter()
                .append('circle')
                .attr('r', 18)
                .attr('class', 'node-circle')
                .attr('fill', (d) => (
                    d.area.hex_color
                ))
                .style('stroke', d => {
                    return 'rgba(0, 0, 0, 0.5)';
                })
                .attr('cx', (d) => {
                    return flatmapScaleX(abbrev_lookup[d.nodeName].flatmap_coord[0]);
                })
                .attr('cy', (d) => {
                    return flatmapScaleY(abbrev_lookup[d.nodeName].flatmap_coord[1]);
                })
                .on('mouseover', function(n) {
                    let elem = d3.select(this);
                    that.handleMouseOver(n, elem);
                })
                .on('mouseout', function(n) {
                    that.handleMouseOut(n);
                })
                .on('click', function(n) {
                    // create the bar chart to show connectivity strength from each area
                    that.handleClick(n);
                    that.clicked = true;
                    //d3.selectAll('.injection-area-name')
                    //    .text(toTitleCase(n.area.fullname) + ' (' + n.nodeName + ')');

                    Actions.pickNode(that._areas.byAbbrev[n.nodeName]);

                    /*
                    let strength = that.flne_per_area[n.nodeName];
                    let y = null, flne_height = 100;
                    if (strength) {
                        that.strength_area_count = strength.length;
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
                        let flne_arr = _.map(strength, 'log10_flne');
                        let min = _.min(flne_arr), max = _.max(flne_arr);
                        let colorFunc = getColorFunc(min, max);
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
                                that.areaBarMouseOver(me, d.source, n.nodeName);
                                that.areaLabelMouseOver(me, d.source, n.nodeName);
                                d3.select(this.parentNode).selectAll('rect').attr('fill', 'brown');
                                d3.select(this.parentNode).append('text')
                                    .attr('x', barWidthFunc(d.log10_flne) - 5)
                                    .attr('y', (d, i) => y(d.source) + y.bandwidth() / 2)
                                    .attr('text-anchor', 'end')
                                    .attr('alignment-baseline', 'middle')
                                    .attr('stroke', 'none')
                                    .style('font-weight', 'bold')
                                    .attr('fill', 'white')
                                    .attr('class', 'num')
                                    .text(d.log10_flne.toFixed(2));
                            })
                            .on('mouseout', function(d, i) {
                                let me = d3.select(this);
                                that.areaBarMouseOut(me, d.source, n.nodeName);
                                that.areaLabelMouseOut(me, d.source, n.nodeName);
                                //d3.select(this).attr('fill', colorFunc(d.log10_flne));
                                d3.select(this.parentNode).selectAll('rect').attr('fill', colorFunc(d.log10_flne));
                                d3.select(this.parentNode).selectAll('.num').remove();
                            })
                        row_enter.selectAll('.flne-rect')
                            .attr('x', 0)
                            .attr('y', (d, i) => y(d.source))
                            .attr('width', d => barWidthFunc(d.log10_flne))
                            .attr('height', y.bandwidth())
                            .attr('fill', d => colorFunc(d.log10_flne))
                            .on('mouseover', function(d, i) {
                                let me = d3.select(this);
                                that.areaBarMouseOver(me, d.source, n.nodeName);
                                that.areaLabelMouseOver(me, d.source, n.nodeName);
                                d3.select(this).attr('fill', 'brown');
                                d3.select(this.parentNode).append('text')
                                    .attr('x', barWidthFunc(d.log10_flne) - 5)
                                    .attr('y', (d, i) => y(d.source) + y.bandwidth() / 2)
                                    .attr('text-anchor', 'end')
                                    .attr('alignment-baseline', 'middle')
                                    .attr('stroke', 'none')
                                    .style('font-weight', 'bold')
                                    .attr('fill', 'white')
                                    .attr('class', 'num')
                                    .text(d.log10_flne.toFixed(2));
                            })
                            .on('mouseout', function(d, i, p) {
                                let me = d3.select(this);
                                that.areaBarMouseOut(me, d.source, n.nodeName);
                                that.areaLabelMouseOut(me, d.source, n.nodeName);
                                d3.select(this).attr('fill', colorFunc(d.log10_flne));
                                d3.select(this.parentNode).selectAll('.num').remove();
                            })
                        scaler = d3.axisBottom()
                            .scale(barWidthFunc)
                            .tickSizeInner(-flne_height)
                            .tickSizeOuter(0)
                            .ticks(5);
                        scaler_dom = flne.append("g")
                            .attr("transform", "translate(0," + flne_height + ")")
                            .attr('class', 'axis-bottom')
                            .call(scaler);
                        scaler_dom.selectAll('.tick line').filter((d, i, l) => i == 0 || (i === l.length - 1)).attr('display', 'none');
                        d3.selectAll('.main-bar-scale-x-title').remove();
                        let title = flne.append('text')
                            .attr('class', 'main-bar-scale-x-title')
                            .attr('transform', 'translate(' + (320 / 2 - 20) + ', ' + (flne_height + 25) + ')')
                            .attr('text-anchor', 'middle')
                        title.append('tspan').attr('font-size', '12').text('log');
                        title.append('tspan').text('10').attr('baseline-shift', 'sub');
                        title.append('tspan').attr('font-size', '12').text('(FLNe)');
                    } else {
                        that.setState({strengthExists: false});
                        flne.selectAll('.row').remove();
                        d3.select('.flne-bar svg').attr('height', flne_height);
                        if (scaler_dom) {
                            scaler_dom.remove();
                        }
                    }
                    */
                    // continue to furnish injection detail
                    let injections = _.filter(that.static_inj, {abbrev: n.nodeName});
                    Actions.nodeDetail(injections);
                })
                d3.select(this).selectAll('.text')
                .data([d]).enter()
                .append('text')
                .attr('class', 'text')
                .text(function(d) { return d.nodeName.replace('-', '/'); })
                .attr('text-anchor', 'middle')
                .attr("pointer-events", "none")
                .attr('x', (d) => {
                    return flatmapScaleX(abbrev_lookup[d.nodeName].flatmap_coord[0]);
                })
                .attr('y', (d) => {
                    return flatmapScaleY(abbrev_lookup[d.nodeName].flatmap_coord[1]) + 3 ;
                })
            });
        that.nodes = nodes;
        that.links = links;
    }
    shouldComponentUpdate(nextProps, nextState) {
        return true;
    }
    componentWillUnmount() {
        AppStore.removeChangeListener(this.handleChange);
    }
    ajaxProgress() {
        if (this.pendingAjax.length == 0 && !this.state.ajaxDone) {
            this.setState({ajaxDone: true}, () => {
                this.prepare();
                this.initialDraw();
            });
        }
    }
    prepare() {
        let that = this;
        //let abbrev_lookup = {};
        _.each(this.atlas_struct, (area) => {
            let _area = this._areas.byAbbrev[area.abbrev];
            _.assign(_area, area);
            this._areas.byId[_area.id] = _area;
            let injections = _.filter(that.static_inj, {abbrev: area.abbrev});
            _area.injections = injections;
        });
        let matrix = that._matrix;
        _.each(this.links, (link) => {
            let target = that._areas.byIndex[link.target];
            let source = that._areas.byIndex[link.source];
            matrix.link(target, source, {target: target, source: source, value: link.value});
            //matrix[link.target][link.source].z += link.value;
            //nodes[link.source].count += link.value;
            //nodes[link.target].count += link.value;
        });
        AppDispatcher.register(action => {
            AppDispatcher.waitFor([AppStore.dispatchToken]);
            switch (action.actionType) {
                case 'HIGHLIGHT_EDGE': {
                    let from_ = action.from_;
                    let to = action.to;
                    let link = d3.selectAll('g.link').filter('[data-from=' + from_.abbrev + ']').filter('[data-to=' + to.abbrev + ']');
                    if (!link.empty()) {
                        link.style('opacity', 1).selectAll('.link-path').style('stroke', '#ff0000');
                    }
                    break;
                }
                case 'UNHIGHLIGHT_EDGE': {
                    let from_ = action.from_;
                    let to = action.to;
                    let link = d3.selectAll('g.link').filter('[data-from=' + from_.abbrev + ']').filter('[data-to=' + to.abbrev + ']');
                    if (!link.empty()) {
                        link.style('opacity', link.attr('data-alpha')).selectAll('.link-path').style('stroke', 'rgb(50, 50, 50)');
                    }
                    break;
                }
            }
        });
        // end preparing work, save it to appState
        Actions.saveAreas(that._areas);
    }
    getBarWidthFunc(min, max) {
        min = -5, max = 0;
        let func = d3.scaleLinear().domain([min, max]).range([0, 300]);
        return func;
    }
    highlightNode(n) {
        let strength = this.flne_per_area[n.nodeName];
        let emitter = n.from || {};
        this.nodes.classed('semi', (d, i) => {
            return d.nodeName != n.nodeName;
        })
        .classed('active', (d, i) => d.nodeName == n.nodeName)
        .sort((a, b) => {
            if (a.nodeName != n.nodeName) {
                return -1;
            } else {
                return 1;
            }
        })
        let flne_arr = _.map(strength, 'log10_flne');
        let min = _.min(flne_arr), max = _.max(flne_arr);
        let colorFunc = getLogColorFunc(min, max);

        this.nodes.selectAll('.node-circle').attr('r', d => d.nodeName == n.nodeName ? 26 : 18)
        .attr('fill', d => {
            if (d.nodeName in emitter || d.nodeName == n.nodeName) {
                let info = _.find(strength, {source: d.nodeName});
                if (info) {
                    return colorFunc(info.log10_flne);
                } else {
                    return d.area.hex_color;
                }
            } else {
                return 'rgba(50, 50, 50, .2)';
            }
        })
        this.links.classed('hidden', (d) => (d.target.nodeName != n.nodeName))
            .attr('marker-end', d => d.semi ? 'url(#end-short)' : 'url(#end)')
            .style('opacity', d => d.alpha)
            .selectAll('path').style('stroke', d => {
                return 'rgba(50, 50, 50)';
                //let info = _.find(strength, {source: d.source.nodeName});
                //if (info) {
                //    return colorFunc(info.log10_flne);
                //} else {
                //    return 'rgb(50, 50, 50)';
                //}
            });
    }
    handleClick(n) {
        this.highlightNode(n);
        /* function to make links interactive after a node is picked
        this.links.filter(':not(.hidden)')
        .on('mouseover', function(n) {
            d3.select(this).style('opacity', 1).selectAll('.link-path').style('stroke', '#ff0000');
        })
        .on('mouseout', function(n) {
            d3.select(this).style('opacity', n.alpha).selectAll('.link-path').style('stroke', 'rgb(50, 50, 50)');
        })
        */
    }
    handleMouseOver(n, elem) {
        if (!this.clicked) {
            this.highlightNode(n);
        }
        let bbox = elem.node().getBoundingClientRect();
        let top = bbox.top + $(document).scrollTop();
        showTooltipAreaName({area: this._areas.byAbbrev[n.area.abbrev], x: bbox.left, y: top - 50});
    }
    handleMouseOut(n) {
        if (!this.clicked) {
            //elem.selectAll('.node').classed('semi', false);
            this.nodes.classed('semi', false);
            //_.each(links, (v) => {
            //    v.semi = false;
            //});
            this.links.classed('hidden', false);
            this.links.attr('marker-end', '');
            this.nodes.selectAll('.node-circle').attr('r', 18)
                .attr('fill', d => {
                    return d.area.hex_color;
                });
        }
        hideTooltip();
    }
    handleChange() {
        this.setState({nodePicked: AppStore.getNodePicked()});
    }
    handleDownloadSVG(e) {
        let html = this.svg_flne_parent.html();
        let b64 = btoa(html);
        let href = 'data:image/svg+xml;base64,\n' + b64;
        e.target.href = href;

    }
    handleDownloadCSV(e) {
        e.target.href = '/static/data/individual_areas/flne_area_' + this.state.nodePicked.abbrev + '.csv';
    }
    handleDownloadGraph(e) {
        let html = this.graph_parent.html();
        let b64 = btoa(html);
        let href = 'data:image/svg+xml;base64,\n' + b64;
        e.target.href = href;

    }
    handleSwitchToMatrixView(e) {
        window.location.href = '/';
    }

    showDownloadSVGHelp(e) {
    }
    showDownloadCSVHelp(e) {
    }
    hideDownloadSVGHelp(e) {
    }
    hideDownloadCSVHelp(e) {
    }
    /**
     * @return {object}
     */
    render() {
        /*
                            <div className={classNames('main-flne', {hidden: !this.state.strengthExists})}>
                                <div className="info-label">
                                    Connectivity profile for the<br/>
                                    <span className="injection-area-name">{area_name}{sources}</span>
                                </div>
                                <div className="flne-bar">
                                </div>
                                <div className="download">
                                    <ul>
                                        <li className="download-svg"><a onClick={this.handleDownloadSVG} download="export_svg.svg">Download bar chart as SVG drawing</a>
                                            <a
                                                onMouseOver={this.handleDownloadSVGHelp}
                                                onMouseOut={this.handleCloseDownloadSVGHelp}></a>&nbsp;
                                            <a onMouseOver={this.showDownloadSVGHelp}>[?]</a></li>
                                        <li className="download-csv"><a onClick={this.handleDownloadCSV} target="_blank">Download data as CSV file</a>&nbsp;
                                            <a onMouseOver={this.showDownloadCSVHelp}>[?]</a></li>
                                    </ul>
                                </div>
                            </div>
                            */
        let modalStyle = {
            width: '80%',
            maxWidth: '1200px',
            scrollX: 'auto',
            overflow: 'scroll',
            maxHeight: '100%'
        };

        let area_name = null;
        if (this.state.nodePicked) {
            area_name = toTitleCase(this.state.nodePicked.fullname) + ' (' + this.state.nodePicked.abbrev + ')';
        }
        let download_svg = (
            <div className="link-button"><a onClick={this.handleDownloadGraph} download="export_flatmap_graph.svg">Download the graph as SVG</a></div>
        );
        let content = null;
        if (!this.state.ajaxDone) {
            content = (
                <section className="main">
                    <section className="graph-container">
                        <div className="loading">
                        </div>
                        <div className="loading-image">
                            <img src="/static/images/loading.svg" width="120" height="120"/>
                            <div className="loading-image-caption">Loading additional data, please be patient...</div>
                        </div>
                    </section>
                    <section className="info-panel">
                    </section>
                </section>
            );
        } else {
            let sources = null;
            if (this.state.nodePicked) {
                sources = ', ' + this.strength_area_count + ' sources.';
            }
            content = (
                <section className="main">
                    <section id="graph-container">
                        <section id="d3_control" className="d3-control">
                            <div className="control-row">
                                <div className="control-group">
                                    <input type="radio" onChange={this.handleSwitchToMatrixView} /><label>Matrix View</label>
                                    <input type="radio" checked /><label>Graph View</label>
                                </div>
                            </div>
                        </section>
                        <section id="d3" className="d3">
                        </section>
                        <ColorBar style="graph" />
                    </section>
                    <section id="info-panel">
                        <div className="injection-info">
                            <MainFlne flne={this.flne_per_area} areas={this._areas} />
                            <InjectionList flne={this.state.flne_per_injection} />
                        </div>
                    </section>
                    <Modal ref={modal => this.modal = modal} modalStyle={modalStyle}>
                        Test modal
                    </Modal>
                </section>
            );
        }
        return content;
    }

};

