import React from 'react';
import Actions from '../actions/Actions';
import AppStore from '../stores/AppStore';
import _ from 'lodash';
import * as d3 from 'd3';
import MainFlne from './MainFlne.react';
import ViewSwitch from './ViewSwitch.react';
import InjectionList from './InjectionList.react';
import classNames from 'classnames';
import AppDispatcher from '../dispatcher/AppDispatcher';
import {toTitleCase, getLogColorFunc, showTooltipAreaName, showTooltipTargetSummary, hideTooltip, getTargetAreaSummaryHTML} from '../lib/utils';
import {Connectivity} from '../lib/connectivity';
import ColorBar from './ColorBar.react';
import QuickLinks from './QuickLinks.react';
//
//function toTitleCase(str) {
//    //return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
//    return str.charAt(0).toUpperCase() + str.substr(1);
//}

const DATA_BASE = '/static/data/';
const IMG_BASE = '/static/images/';
export default class MainGraph extends React.Component {
    constructor(props, context) {
        window.d3js = d3;
        super(props, context);
        _.bindAll(
            this, 'handleChange', 'handleMouseOverNode', 'handleMouseOutNode', 'handleClick', 'highlightNode',
            'handleDownloadSVG', 'handleDownloadGraph', 'handleDownloadCSV', 'ajaxLoad', 'handleSwitchToMatrixView',
            'handleMouseOverEdge', 'handleMouseOutEdge',
            'handleFocusViewer', 'handleBlurViewer',
        );
        let state = {
            strengthExists: false,
            ajaxDone: false,
            controlExpanded: true,
            focused: false
        };

        let focused = localStorage.getItem('focusedView');
        let that = this;
        if (focused) {
            state.focused = true;
            state.controlExpanded = false;
            $('body').addClass('focused');
        }
        this.state = state;
        this._matrix = AppStore.getConnectivity();
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
            Actions.processAreas(struct);
            _.each(struct, s => {
                let txt = s.fullname;
                txt = txt.charAt(0).toUpperCase() + txt.slice(1);
                s.fullname = txt;
                let cc = s.color;
                s.hex_color = 'rgba(' + cc[0] + ',' + cc[1] + ',' + cc[2] + ', 1)';
            });
            this.atlas_struct = struct;
        });
        this.ajaxLoad('connectivity_1_0_1.json', (conn) => {

            let node_lookup = {};
            let nodes = [];
            _.each(conn.nodes, (node, i) => {
                node_lookup[i] = node;
                nodes.push({
                    nodeName: node,
                    abbrev: node,
                    index: i
                });
                this._areas.byIndex[i] = {abbrev: node, serial: i};
                this._areas.byAbbrev[node] = this._areas.byIndex[i];
            });
            let links = [];
            _.each(conn.links, (link, i) => {
                let target = node_lookup[link[0]];
                let source = node_lookup[link[1]];
                links.push({
                    target: link[0],
                    source: link[1],
                    value: link[2]
                });
            });
            this.nodes = nodes;
            this.links = links;
        });
        this.ajaxLoad('marmoset_brain_connectivity_FLN.json', (data) => {
            this._connectivity_data = data;
        });
    }
    ajaxLoad(file, callback) {
        this.pendingAjax.push(file);
        d3.json(DATA_BASE + file, (error, data) => {
            if (error) throw error;
            callback(data);
            _.pull(this.pendingAjax, file);
            this.ajaxProgress();
        });
    }
    componentDidMount() {
        AppStore.addChangeListener(this.handleChange);
        let that = this;
        $(window).on('keyup', function(e) {
            if (e.keyCode == 70 && e.shiftKey) { /* 70 for letter 'f' */
                if (that.state.focused) {
                    that.handleBlurViewer();
                } else {
                    that.handleFocusViewer();
                }
            } else if (e.keyCode == 77 && e.shiftKey) {
                window.location.href = "/index.html";
            }
        });
    }
    initialDraw() {
        let that = this;
        let width = 860, height= 880;
        this.graph_parent = d3.select('#d3');
        let svg = this.graph_parent.append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink');

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
            .attr('width', 842)
            .attr('height', 882)
            .attr('xlink:href', IMG_BASE + 'all_injections_on_flatmap.png');
        svg = svg.append('g')
            .attr('transform', 'translate(20, -50)');
        let color = d3.scaleOrdinal(d3.schemeCategory20);
        let flatmapScaleX = d3.scaleLinear().range([0, 960]);
        let flatmapScaleY = d3.scaleLinear().range([0, 960]);
        flatmapScaleX.domain([-20, 20]);
        flatmapScaleY.domain([20, -20]);

        // prepare all the structures
        let atlas_struct = this.atlas_struct;

        // abbrev_lookup to look for an area by node abbre
        let abbrev_lookup = {};
        _.each(atlas_struct, (area) => {
            abbrev_lookup[area.abbrev] = area;
            let cc = area.color;
            area.hex_color = 'rgba(' + cc[0] + ',' + cc[1] + ',' + cc[2] + ', 1)';
        });
        this.abbrev_lookup = abbrev_lookup;


        // processing the connectivity data
        // Compute the distinct nodes from the links.
        this.nodes.forEach((n, i) => {
            n.area = abbrev_lookup[n.abbrev];
        });
        let z = d3.scaleLog().domain([1, 676]).clamp(true);
        let link_hash = {};
        let alphaScale = d3.scaleLinear().range([.2, .75]);
        alphaScale.domain([0, 60]).clamp(true);
        this.links.forEach(function(link) {
            link.source = that.nodes[link.source].area;
            link.target = that.nodes[link.target].area;
            link.source.to = link.source.to || {};
            link.source.to[link.target.abbrev] = link.target;
            link.target.from = link.target.from || {};
            link.target.from[link.source.abbrev] = link.source;

            link.value = +link.value;
            link.alpha = alphaScale(link.value);
            //link_hash[link.target.nodeName] = link_hash[link.target.nodeName] || {};
            //link_hash[link.target.nodeName][link.source.nodeName] = link;
        });

        //let maxZ = 676;
        let links = svg.append('g')
            .attr('class', 'links')
            .selectAll('.link')
            .data(this.links)
            .enter().append('g')
            .attr('class', d => 'link')
            .attr('data-from', d => d.source.abbrev)
            .attr('data-to', d => d.target.abbrev)
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
                        let s_coord = abbrev_lookup[d.source.abbrev].flatmap_coord;
                        let sx = flatmapScaleX(s_coord[0]);
                        let sy = flatmapScaleY(s_coord[1]);
                        let t_coord = abbrev_lookup[d.target.abbrev].flatmap_coord;
                        let tx = flatmapScaleX(t_coord[0]);
                        let ty = flatmapScaleY(t_coord[1]);
                        return 'M' + sx + ',' + sy + ' L' + tx + ',' + ty;
                    })
                    .on('mouseover', function(d, i) {
                        that.handleMouseOverEdge(this, d);
                    })
                    .on('mouseout', function(d, i) {
                        that.handleMouseOutEdge(this, d);
                    })
            })
        let nodes = svg.append('g')
            .attr('class', 'nodes')
            .selectAll('.node')
            .data(this.nodes)
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
                    return flatmapScaleX(abbrev_lookup[d.abbrev].flatmap_coord[0]);
                })
                .attr('cy', (d) => {
                    return flatmapScaleY(abbrev_lookup[d.abbrev].flatmap_coord[1]);
                })
                .on('mouseover', function(d) {
                    that.handleMouseOverNode(this, d);
                })
                .on('mouseout', function(d) {
                    that.handleMouseOutNode(this, d);
                })
                .on('click', function(n) {
                    // undo any other hovering if happened
                    //Actions.unhighlightEdge(src, tgt);
                    //Actions.unboldEdge(src, tgt);
                    // create the bar chart to show connectivity strength from each area
                    let currentNode = AppStore.getNodePicked();
                    //let area = that._areas.byAbbrev[n.abbrev];
                    let area = n.area;
                    if (currentNode && currentNode != area) {
                        Actions.unhighlightEdge(area, currentNode);
                        Actions.unboldEdge(area, currentNode);
                    }
                    that.handleClick(n);
                    that.clicked = true;

                    Actions.pickNode(area);
                    // continue to furnish injection detail
                    let injections = _.filter(that.static_inj, {abbrev: n.abbrev});
                    Actions.nodeDetail(injections);
                    let x_ = d3.event.pageX + 24;
                    let y_ = d3.event.pageY - 20;
                    let flne = [];
                    const conn = AppStore.getConnectivity();
                    _.each(conn.get_by_target(area), s => {
                        if (s.source !== undefined && s.flne > 0) {
                            flne.push({
                                source: s.source.abbrev,
                                gmeannz: s.gmeannz,
                                log10_flne: Math.log10(s.flne)
                            });
                        }
                    });
                    showTooltipTargetSummary({
                        target_area: area,
                        source_area: area,
                        matrix: that._matrix,
                        x: x_,
                        y: y_});

                })
                d3.select(this).selectAll('.text')
                .data([d]).enter()
                .append('text')
                .attr('class', 'text')
                .text(function(d) { return d.abbrev.replace('-', '/'); })
                .attr('text-anchor', 'middle')
                .attr("pointer-events", "none")
                .attr('x', (d) => {
                    return flatmapScaleX(abbrev_lookup[d.abbrev].flatmap_coord[0]);
                })
                .attr('y', (d) => {
                    return flatmapScaleY(abbrev_lookup[d.abbrev].flatmap_coord[1]) + 3 ;
                })
            });
        that.d3_nodes = nodes;
        that.d3_links = links;
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
        Actions.processConnectivity(this._connectivity_data, that.static_inj);
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
                    let color = action.color || '#ff0000';
                    let link = d3.selectAll('g.link').filter('[data-from=' + from_.abbrev + ']').filter('[data-to=' + to.abbrev + ']');
                    if (!link.empty()) {
                        link.style('opacity', 1).selectAll('.link-path').style('stroke', color);
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
                case 'BOLD_EDGE': {
                    let from_ = action.from_;
                    let to = action.to;
                    let link = d3.selectAll('g.link').filter('[data-from=' + from_.abbrev + ']').filter('[data-to=' + to.abbrev + ']');
                    if (!link.empty()) {
                        link.style('marker-end', 'none');
                    }

                    link.selectAll('.link-path').attr('stroke-width', 3);
                    break;
                }
                case 'UNBOLD_EDGE': {
                    let from_ = action.from_;
                    let to = action.to;
                    let link = d3.selectAll('g.link').filter('[data-from=' + from_.abbrev + ']').filter('[data-to=' + to.abbrev + ']');
                    if (!link.empty()) {
                        link.style('marker-end', 'none');
                    }

                    link.style('marker-end', d => d.semi ? 'url(#end-short)' : 'url(#end)');
                    link.selectAll('.link-path').attr('stroke-width', 1);
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
        //let strength = this.flne_per_area[n.abbrev];
        let strength = [];
        const conn = AppStore.getConnectivity();
        const areas = AppStore.getAreas();
        _.each(conn.get_by_target(areas.getByAbbrev(n.abbrev)), s => {
            if (s.source !== undefined && s.flne > 0) {
                strength.push({
                    source: s.source.abbrev,
                    gmeannz: s.gmeannz,
                    log10_flne: Math.log10(s.flne)
                });
            }
        });

        let emitter = n.area.from || {};
        this.d3_nodes.classed('semi', (d, i) => {
            return d.abbrev != n.abbrev;
        })
        .classed('active', (d, i) => d.abbrev == n.abbrev)
        .sort((a, b) => {
            if (a.abbrev != n.abbrev) {
                return -1;
            } else {
                return 1;
            }
        })
        let flne_arr = _.map(strength, 'log10_flne');
        let min = _.min(flne_arr), max = _.max(flne_arr);
        let colorFunc = getLogColorFunc(min, max);

        this.d3_nodes.selectAll('.node-circle').attr('r', d => d.abbrev == n.abbrev ? 26 : 18)
        .attr('fill', d => {
            if (d.abbrev in emitter || d.abbrev == n.abbrev) {
                let info = _.find(strength, {source: d.abbrev});
                if (info) {
                    return colorFunc(info.log10_flne);
                } else if (d.abbrev == n.abbrev) {
                    return d.area.hex_color;

                } else {
                    return 'rgba(50, 50, 50, .2)';
                    //return d.area.hex_color;
                }
            } else {
                return 'rgba(50, 50, 50, .2)';
            }
        })
        this.d3_links.classed('hidden', (d) => {
                if (d.target.abbrev != n.abbrev) {
                    return true;
                } else {
                    let info = _.find(strength, {source: d.source.abbrev});
                    return !info;
                }
            })
            .attr('marker-end', d => d.semi ? 'url(#end-short)' : 'url(#end)')
            .style('opacity', d => d.alpha)
            .selectAll('path').style('stroke', d => {
                return 'rgba(50, 50, 50)';
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
    handleMouseOverNode(elem, data) {
        let me = d3.select(elem);
        let pickedNode = AppStore.getNodePicked();
        let bbox = elem.getBoundingClientRect();
        let top = bbox.top + $(document).scrollTop();
        if (!this.clicked) {
            this.highlightNode(data);
            showTooltipAreaName({area: data.area, x: bbox.left, y: top - 50});
        } else {
            let tgt = this._areas.byAbbrev[pickedNode.abbrev];
            let src = this._areas.byAbbrev[data.area.abbrev];
            //let self = (tgt == src);
            //let strength = this.flne_per_area[tgt.abbrev];
            //let info = _.find(strength, {source: src.abbrev});
            let strength = [];
            const conn = AppStore.getConnectivity();
            const areas = AppStore.getAreas();
            _.each(conn.get_by_target(areas.getByAbbrev(tgt.abbrev)), s => {
                if (s.source !== undefined && s.flne > 0) {
                    strength.push({
                        source: s.source.abbrev,
                        gmeannz: s.gmeannz,
                        log10_flne: Math.log10(s.flne)
                    });
                }
            });

            Actions.highlightEdge(src, tgt, '#000000');
            Actions.boldEdge(src, tgt);
            let x_ = bbox.left + 50;
            let y_ = top;
            showTooltipTargetSummary({
                target_area: tgt,
                source_area: src,
                matrix: this._matrix,
                x: x_,
                y: y_});
        }
    }
    handleMouseOutNode(elem, data) {
        if (!this.clicked) {
            this.d3_nodes.classed('semi', false);
            this.d3_links.classed('hidden', false);
            this.d3_links.attr('marker-end', '');
            this.d3_nodes.selectAll('.node-circle').attr('r', 18)
                .attr('fill', d => {
                    return d.area.hex_color;
                });
        } else {
            let me = d3.select(elem);
            let pickedNode = AppStore.getNodePicked();
            let tgt = this._areas.byAbbrev[pickedNode.abbrev];
            let src = this._areas.byAbbrev[data.area.abbrev];
            Actions.unhighlightEdge(src, tgt);
            Actions.unboldEdge(src, tgt);
        }
        hideTooltip();
    }
    handleMouseOverEdge(elem, data) {
        if (this.clicked) {
            let me = d3.select(elem);
            let x_ = d3.event.pageX + 24;
            let y_ = d3.event.pageY - 20;
            Actions.highlightEdge(data.source, data.target, '#000000');
            Actions.boldEdge(data.source, data.target);
            showTooltipTargetSummary({
                target_area: this._areas.byAbbrev[data.target.abbrev],
                source_area: this._areas.byAbbrev[data.source.abbrev],
                matrix: this._matrix,
                x: x_,
                y: y_});

        }
    }
    handleMouseOutEdge(elem, data) {
        if (this.clicked) {
            let me = d3.select(elem);
            Actions.unhighlightEdge(data.source, data.target);
            Actions.unboldEdge(data.source, data.target);
            hideTooltip();
        }
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
        e.target.href = DATA_BASE + 'individual_areas/flne_area_' + this.state.nodePicked.abbrev + '.csv';
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
    handleFocusViewer(e) {
        this.setState({
            focused: true,
            controlExpanded: false
        });
        $('body').addClass('focused');
        Actions.setFocusedViewState(true);
    }
    handleBlurViewer(e) {
        this.setState({
            focused: false,
            controlExpanded: true
        });
        $('body').removeClass('focused');
        Actions.setFocusedViewState(false);
    }
    noop() {
    }
    /**
     * @return {object}
     */
    renderContent() {
        if (!this.state.ajaxDone) {
            return (
                <section className="graph">
                    <section className="graph-container">
                        <section id="d3_control" className="d3-control">
                        </section>
                        <div className="loading">
                        </div>
                        <div className="loading-image">
                            <img src={IMG_BASE + '/loading.svg'} width="120" height="120"/>
                            <div className="loading-image-caption">Loading additional data, please be patient...</div>
                        </div>
                    </section>
                    <section className="info-panel graph-view">
                    </section>
                </section>
            );
        } else {
            let sources = null;
            if (this.state.nodePicked) {
                sources = ', ' + this.strength_area_count + ' sources.';
            }
            return (
                <section className="graph">
                    <section id="graph-container">
                        <section id="d3_control" className="d3-control">
                            <div className={classNames(['foldable-control', 'thin-control'], {expanded: this.state.controlExpanded}, {folded: !this.state.controlExpanded})}>
                                <div className="brief">
                                </div>
                                <div className="full">
                                    <div className="control-row">
                                        <div className="control-group">
                                            <p>This view presents the weighed and directed connectivity graph based on the results of <a href="http://www.marmosetbrain.org/whitepaper#tracer_injections" target="_blank">injections of monosynaptic retrograde fluorescent tracers</a> injections.</p>
                                            <p>The graph view highlights the spatial relations between the connected areas. Pointing at an edge, provides information about the cases in which a specific connection was observed, and clicking reveals further information, including an average connectivity profile, interactive visualizations of the data for each injection, and metadata.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </section>
                        <section id="d3" className="d3">
                        </section>
                        <div className="color-bar-container">
                            <ColorBar style="graph" />
                        </div>
                    </section>
                    <section id="info-panel" className="graph-view">
                        <QuickLinks/>
                        <div className="injection-info">
                            <MainFlne flne={this.flne_per_area} areas={this._areas} mode='FLN' />
                            <InjectionList flne={this.state.flne_per_injection} mode='FLN' />
                        </div>
                    </section>
                </section>
            );
        }
    }
    /**
     * @return {object}
     */
    render() {
        let area_name = null;
        if (this.state.nodePicked) {
            area_name = toTitleCase(this.state.nodePicked.fullname) + ' (' + this.state.nodePicked.abbrev + ')';
        }
        let download_svg = (
            <div className="link-button"><a onClick={this.handleDownloadGraph} download="export_flatmap_graph.svg">Download the graph as SVG</a></div>
        );
        return (
            <section className="main">
                <ViewSwitch view="graph" />
                {this.renderContent()}
            </section>
        );
    }

};
