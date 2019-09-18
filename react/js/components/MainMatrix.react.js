import React from 'react';
import Actions from '../actions/Actions';
import AppStore from '../stores/AppStore';
import InjectionList from './InjectionList.react';
import ColorBar from './ColorBar.react';
import MainFlne from './MainFlne.react';
import Modal from '../lib/modal';
import ViewSwitch from './ViewSwitch.react';
import AppDispatcher from '../dispatcher/AppDispatcher';
import _ from 'lodash';
import * as d3 from 'd3';
import classNames from 'classnames';
import {toTitleCase, getColorFunc, scientificNotion, getTargetAreaSummaryHTML} from '../lib/utils';
import {Connectivity} from '../lib/connectivity';
import QuickLinks from './QuickLinks.react';
export default class MainMatrix extends React.Component {
    constructor(props, context) {
        super(props, context);
        window.d3js = d3;
        let that = this;
        _.bindAll(this, 'handleChange', 'ajaxProgress', 'handleChangeOrder',
                'showTooltip', 'hideTooltip', 'prepare', 'reorder',
                'handleToggleMissingSources', 'handleModalHide',
                'handleQLConnectivityTxt', 'handleToggleExpand',
                'handleFocusViewer', 'handleBlurViewer',
                'handleChangeDataOverlay',
            );
        this.pendingAjax = [];
        let state = {
            ajaxDone: false,
            order: 'alphabetically',
            controlExpanded: true,
            focused: false
        };
        let focused = localStorage.getItem('focusedView');
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
        this.ajaxLoad('marmoset_brain_connectivity_FLN.json', (data) => {
            this._connectivity_data = data;
        });
        this.ajaxLoad('structures.json', (struct) => {
            Actions.processAreas(struct);
            _.each(struct, s => {
                /* just make the structure name a little more pretty */
                let txt = s.fullname;
                txt = txt.charAt(0).toUpperCase() + txt.slice(1);
                s.fullname = txt;
                let cc = s.color;
                s.hex_color = 'rgba(' + cc[0] + ',' + cc[1] + ',' + cc[2] + ', 1)';
            });
            this.atlas_struct = struct;
            /*
            let abbrev_lookup = {};
            _.each(struct, (area) => {
                abbrev_lookup[area.abbrev] = area;
            });
            this.abbrev_lookup = abbrev_lookup;
            */
        });
        this.ajaxLoad('connectivity_1_0_1.json', (conn) => {
            let node_lookup = {};
            let nodes = [];
            _.each(conn.nodes, (node, i) => {
                node_lookup[i] = node;
                nodes.push({
                    nodeName: node,
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
            window.nodes = nodes;
            window.links = links;
            //targets = _.difference(orders.y, to_clear);
            //targets = _.without.apply(_, [orders.y].concat(to_clear));
            //targets = orders.y;
            //this.targets = targets;
        });
        this.ajaxLoad('connectivity_matrix_sorting_options.json', data => {
            this.sortOptions = data;
        });
        this.svgMargin = {top: 80, right: 0, bottom: 10, left: 80};
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
        let that = this;
        $(window).on('keyup', function(e) {
            if (e.keyCode == 70 && e.shiftKey) {
                if (that.state.focused) {
                    that.handleBlurViewer();
                } else {
                    that.handleFocusViewer();
                }

            }
            if (e.keyCode == 71 && e.shiftKey) {
                window.location.href = "/graph.html";
            }
        });
    }
    showTooltip({target_area, source_area, x, y} = {}) {
        let that = this;
        let tooltip = d3.select('div.tooltip');
        tooltip.classed('matrix-view', true);
        tooltip
            .style('opacity', 1);
        let x_ = x, y_ = y;
        if (x_ === null || x_ === undefined) {
            x_ = d3.event.pageX + 24;
        }
        if (y_ === null || y_ === undefined) {
            y_ = d3.event.pageY - 20;
        }
        let txt = getTargetAreaSummaryHTML(target_area, source_area, that._matrix, 'FLN');
        tooltip.html(txt)
            .style("left", (x_) + "px")
            .style("top", (y_) + "px");
    }
    handleChangeDataOverlay(e) {
        const value = e.target.value;
        Actions.setDataOverlay(value);
    }
    hideTooltip() {
        let tooltip = d3.select('div.tooltip');
        tooltip
            .style("opacity", 0);
    }

    initialDraw() {
        const data_attr = 'flne';
        let that = this;
        let size = this._matrix.size;
        /* width should be around 860px */
        let margin = that.svgMargin,
            width = 13 * size.x,
            height = 13 * size.y;
        //let _left = Math.floor((860 - (width + margin.left)) / 2);
        let _left = 20;
        let colorFunction = getColorFunc();

        let x = d3.scaleBand().range([0, width]),
            y = d3.scaleBand().range([0, height]);
        // let c = d3.scaleOrdinal(d3.schemeCategory10).domain(d3.range(10));
        //let left_ = margin.left + (860 - (13 * size.x + margin.left)) / 2;
        let svg = d3.select("#d3").append("svg")
            .attr("width", width + margin.left + 2)
            .attr("height", height + margin.top + 2)
            .attr('class', 'matrix-view')
            .style("margin-left", _left + "px")

        that.svgTag = svg;

        svg.append('rect').attr('width', width + 1).attr('height', height + 1)
            .attr('x', margin.left)
            .attr('y', margin.top)
            .attr('class', 'main-graph-border');

        svg = svg
          .append("g")
            .attr("transform", "translate(" + (margin.left + 0) + "," + (margin.top + 0) + ")")



        let matrix = this._matrix, nodes = this.nodes, links = this.links;
        //y.domain(this.orders.name);
        //x.domain(this.targets);

        svg.append('rect')
            .attr("class", "background")
            .attr("x", 1)
            .attr("y", 1)
            .attr("width", width - 1)
            .attr("height", height - 1);
        let sources = _.keys(matrix.sources),
            targets = _.keys(matrix.targets);

        x.domain(targets);
        y.domain(sources);
        this.scaleX = x;
        this.scaleY = y;
        const areas = AppStore.getAreas();
        let m = _.map(d3.range(size.y), function(v, i) {
            return _.map(d3.range(size.x), function(v, j) {
                let src_id = sources[i];
                let tar_id = targets[j];
                let elem = matrix.getData(areas.get(tar_id), areas.get(src_id));
                if (elem.target !== undefined) {
                    return elem;
                } else {
                    return {source: areas.get(src_id), target: areas.get(tar_id), flne: 0};
                }
            });
        });
        let row = svg.selectAll(".row")
            .data(m)
            .enter().append("g")
            .attr("class", "row")
            .attr("transform", function(d, i) {
                let offset_y = y(d[0].source.id);
                if (offset_y !== NaN) {
                    return "translate(0," + offset_y + ")";
                } else {
                    console.log('not found in table', d[0].source);
                }
            })
            .each(make_row);


        that.matrixRow = row;
        /*
        row.append("line")
            .each(function(d) {
                d3.select(this).classed('row-' + d[0].source.id, true)
            })
            .attr("x2", width-margin.left-1);
        */
        row.append("text")
            .attr("x", -6)
            .attr("y", x.bandwidth() / 2)
            .attr("dy", ".3em")
            .attr("text-anchor", "end")
            .attr('class', 'label-row')
            .text(function(d, i) { return d[0].source.abbrev; })
            .each(function(d) {
                d3.select(this).classed('row-' + d[0].source.id, true);
                //d3.select(this).classed('column-' + d.target, true)
            });

        row.append('line')
            .attr('x2', width)
            .attr('y1', x.bandwidth() / 2 + 1)
            .attr('y2', x.bandwidth() / 2 + 1)
            .attr('class', 'crosshair')
            .each(function(d) {
                d3.select(this).classed('row-' + d[0].source.id, true);
                //d3.select(this).classed('column-' + d.target, true)
            });

        var label_column = svg.selectAll('g.column')
            .data(targets)
            .enter().append("g")
            .classed('column',  true)
            .attr("transform", function(d, i) {
                return "translate(" + x(d) + ")rotate(-90)";
            });
        /*
        label_column.append("line")
            .each(function(d) {
                d3.select(this).classed('column-' + d, true)
            })
            .attr("x1", -(height - margin.top - 1));
        */
        label_column.append('line')
            .attr('x1', -(height))
            .attr('y1', x.bandwidth() / 2 + 1)
            .attr('y2', x.bandwidth() / 2 + 1)
            .attr('class', 'crosshair')
            .each(function(d) {
                d3.select(this).classed('column-' + d, true)
            });

        label_column.append("text")
            .attr("x", 6)
            .attr("y", y.bandwidth() / 2)
            .attr("dy", ".3em")
            .attr("text-anchor", "start")
            .attr('class', 'label-column')
            .text(function(d, i) {
                //return nodes[that.targets[i]].nodeName;
                let area = that._areas.byId[d];
                return area.abbrev;
            })
            .each(function(d) {
                //d3.select(this).classed('row-' + d.source, true)
                d3.select(this).classed('column-' + d, true)
            });

        that.matrixColumn = label_column;
        function make_row(row) {
            let r = d3.select(this);
            r.classed('row-' + row[0].source.id, true);
            let cell = r.selectAll('.cell')
                .data(row)
                .enter().append("rect")
                .attr("class", "cell")
                .classed('pointer', true)
                .each(function(d) {
                    d3.select(this).classed('row-' + d.source.id, true)
                    d3.select(this).classed('column-' + d.target.id, true)
                })
                .attr("x", function(d, i) {
                    return x(d.target.id) + 1;
                })
                .attr("y", 1)
                .attr("width", x.bandwidth() - 1)
                .attr("height", y.bandwidth() - 1)
                .style("fill-opacity", function(d) { return d[data_attr] > 0 ? 1 : 1; })

                .style("fill", function(d) {
                    if (d.source.id === d.target.id) {
                        return 'rgba(0, 90, 20, 0.7)';
                    } else {
                        if (d[data_attr] > 0) {
                            return colorFunction(d[data_attr]);
                        } else {
                            return '#f9f9f9';
                        }
                    }
                })

                .attr('data-z', d => d[data_attr])
                .on('click', function(n) {
                    //alert('source:'+ nodes[n.x].nodeName);
                    //let source_node = nodes[n.source];
                    //let dest_node = nodes[n.target];
                    //let struct_node = that._areas.byAbbrev[dest_node.nodeName];
                    //Actions.pickNode({nodeName: dest_node.nodeName, area: struct_node});
                    let area = that._areas.byId[n.target.id];
                    Actions.pickTargetArea(area);
                    //let injections = _.filter(that.static_inj, {abbrev: area.abbrev});
                    Actions.nodeDetail();
                    //injections);
                })
                .on('mouseover', function(n) {
                    let this_ = d3.select(this);
                    d3.selectAll('.row-' + n.source.id).classed('highlight', true);
                    d3.selectAll('.column-' + n.target.id).classed('highlight', true);
                    if (that.state.hideMissingSources) {
                        d3.selectAll('rect.row-' + n.target.id + '.column-' + n.source.id).style('stroke', '#000000');
                    }
                    // highlight
                    this_.style('stroke', '#000000');
                    //d3.selectAll('line.row-' + (n.source.id + 1)).classed('highlight', true);
                    //d3.selectAll('line.column-' + (n.target.id + 1)).classed('highlight', true);
                    //let target_area = that._areas.byId[n.target];
                    //let source_area = that._areas.byId[n.source];
                    //that.showTooltip(nodes[n.target] + '<br/>Destination' + that._areas.byIndex[n.target].fullname) ;
                    that.showTooltip({target_area: n.target, source_area: n.source});
                })
                .on('mouseout', function(n) {
                    let this_ = d3.select(this);
                    d3.selectAll('.row-' + n.source.id).classed('highlight', false);
                    d3.selectAll('.column-' + n.target.id).classed('highlight', false);
                    this_.style('stroke', 'none');
                    if (that.state.hideMissingSources) {
                        d3.selectAll('rect.row-' + n.target.id + '.column-' + n.source.id).style('stroke', 'none');
                    }
                    //d3.selectAll('line.row-' + (n.source + 1)).classed('highlight', false);
                    //d3.selectAll('line.column-' + (n.target + 1)).classed('highlight', false);
                    that.hideTooltip();
                })
        }

        /* lastly the title / caption for axis */

        svg.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .attr("dy", "-4em")
            .attr("text-anchor", "middle")
            .attr('class', 'caption-source')
            .text('Source Area')
            .attr("transform", 'translate(0 ' + ((height / 2) + margin.top) + ') rotate(-90)');
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -60)
            .attr("dy", ".3em")
            .attr("text-anchor", "middle")
            .attr('class', 'caption-target')
            .text('Target Area');
        this.reorder(this.state.order);
    }
    componentWillUnmount() {
        AppStore.removeChangeListener(this.handleChange);
    }
    handleChange() {
        if (AppStore.getNodePicked()) {
            this.setState({
                nodePicked: AppStore.getNodePicked(),
            });
        }
    }
    /**
     * This function to be called when every ajax request complete
     * when all pending ajax completes.
     * Mark ajaxDone as true to prevent accidental multiple trigger of
     * initialDraw (though not necessary I guess)
     * @return
     */
    ajaxProgress() {
        let that = this;
        if (this.pendingAjax.length == 0 && !this.state.ajaxDone) {
            this.setState({ajaxDone: true}, () => {
                this.prepare();
                this.initialDraw();
                let search = window.location.search.substring(1);
                if (search) {
                    let query = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
                    if (query.pickArea) {
                        let highlight_area = this._areas.byAbbrev[query.pickArea];
                        d3.selectAll('.row-' + highlight_area.serial).classed('highlight', true);
                        /*
                        d3.selectAll('.column-' + n.target.id).classed('highlight', true);
                        if (that.state.hideMissingSources) {
                            d3.selectAll('rect.row-' + n.target.id + '.column-' + n.source.id).style('stroke', '#000000');
                        }
                        // highlight
                        this_.style('stroke', '#000000');
                        //d3.selectAll('line.row-' + (n.source.id + 1)).classed('highlight', true);
                        //d3.selectAll('line.column-' + (n.target.id + 1)).classed('highlight', true);
                        //let target_area = that._areas.byId[n.target];
                        //let source_area = that._areas.byId[n.source];
                        //that.showTooltip(nodes[n.target] + '<br/>Destination' + that._areas.byIndex[n.target].fullname) ;
                        that.showTooltip({target_area: n.target, source_area: n.source});
                        */
                    } else if (query.pickInjection) {
                        let inj = this.static_inj[query.pickInjection];
                        //let injections = _.filter(that.static_inj, {abbrev: area.abbrev});
                        let area = that._areas.byAbbrev[inj.abbrev];
                        Actions.pickTargetArea(area);
                        //let injections = _.filter(that.static_inj, {abbrev: area.abbrev});
                        //Actions.nodeDetail();
                        Actions.expandInjection(inj);
                        d3.selectAll('.column-' + area.id).classed('highlight', true);

                    }
                }


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
                    let source_id;
                    if (typeof from_ === 'string') {
                        source_id = that._areas.byAbbrev[from_].id;
                    } else {
                        source_id = from_.id;
                    }
                    let target_id;
                    if (typeof to === 'string') {
                        target_id = that._areas.byAbbrev[to].id;
                    } else {
                        target_id = to.id;
                    }
                    d3.selectAll('.row-' + source_id).classed('highlight', true);
                    d3.selectAll('.column-' + target_id).classed('highlight', true);
                    //this_.style('stroke', '#555555');
                    break;
                }
                case 'UNHIGHLIGHT_EDGE': {
                    let from_ = action.from_;
                    let to = action.to;
                    let source_id = from_.id;
                    let target_id = to.id;
                    d3.selectAll('.row-' + source_id).classed('highlight', false);
                    d3.selectAll('.column-' + target_id).classed('highlight', false);
                    //d3.selectAll('rect.row-' + source_id + '.column-' + target_id).style('stroke', 'none');
                    break;
                }
            }
        });
        Actions.saveAreas(this._areas);
        /* work out the sorting options */
    }
    handleChangeOrder(e) {
        // just be safe, it shouldn't be false
        if (e.target.value != this.state.order) {
            this.reorder(e.target.value);
        }
        this.setState({order: e.target.value});
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
    reorder(order) {
        let that = this;
        let y = this.scaleY;
        let x = this.scaleX;
        /*
        let sources = _.keys(this._matrix.sources);
        let newY = _.clone(sources);

        function sortFunc(a, b) {
            switch (order) {
                case 'alphabetically':
                    return d3.ascending(that._areas.byId[a].abbrev, that._areas.byId[b].abbrev);
                    break;
                case 'id':
                    return d3.descending(that._areas.byId[a].id, that._areas.byId[b].id);
                    break;
                case 'flatmapX':
                    return d3.ascending(that._areas.byId[a].flatmap_coord[0], that._areas.byId[b].flatmap_coord[0]);
                    break;
                case 'custom':
                    return d3.ascending(that._areas.byId[a].flatmap_coord[1], that._areas.byId[b].flatmap_coord[1]);
                    return d3.ascending(that._areas.byId[a].id, that._areas.byId[b].id);
                    break;
                case 'hierarchical':
                    return d3.ascending(that._areas.byId[a].id, that._areas.byId[b].id);
                    break;
                case 'random':
                    return Math.random() * 2 - 1;
                    break;
            }
        }

        let targets = _.keys(this._matrix.targets);
        let newX = _.clone(targets);
        let selection;
        */
        let sources = _.map(_.keys(this._matrix.sources), v => parseInt(v, 10));
        let targets = _.map(_.keys(this._matrix.targets), v => parseInt(v, 10));
        let newY = _.map(that.sortOptions[order].axisSources, v => that._areas.byAbbrev[v].id);
        let newX = _.map(that.sortOptions[order].axisTargets, v => that._areas.byAbbrev[v].id);
        newY = _.intersection(newY, sources);
        newX = _.intersection(newX, targets);
        if (this.state.hideMissingSources) {
            newY = _.intersection(newY, newX);
        }
        y.domain(newY);
        x.domain(newX);

        let height = 13 * newY.length;
        that.svgTag.attr('height', height + that.svgMargin.top + 2);
        let range = [0, height];
        y.range(range);

        let width = 13 * newX.length;
        that.svgTag.attr('width', width + that.svgMargin.left + 2);
        range = [0, width];
        x.range(range);

        that.matrixRow
            .attr("transform", function(d, i) {
                let offset_y = y(d[0].source.id);
                if (offset_y !== undefined) {
                    //return "translate(0," + y(i) + ")";
                    return "translate(0," + offset_y + ")";
                } else {
                    return "translate(-65535, -65535)";
                }

            });

        that.matrixRow.each(function() {
            d3.select(this).selectAll('rect')
                .attr("x", function(d, i) {
                    return x(d.target.id) + 1;
                })

        });
        that.matrixColumn
            .attr("transform", function(d, i) {
                return "translate(" + x(d) + ")rotate(-90)";
            });
        that.svgTag.selectAll('.caption-source')
            .attr("transform", 'translate(0 ' + ((height)/ 2) + ') rotate(-90)');
        that.svgTag.selectAll('.background')
            .attr('width', width - 1)
            .attr('height', height - 1);
        that.svgTag.selectAll('rect.main-graph-border')
            .attr('width', width + 1)
            .attr('height', height + 1);

    }
    handleToggleMissingSources(e) {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        this.setState({hideMissingSources: value}, () => this.reorder(this.state.order));
    }
    handleSwitchToGraphView(e) {
        window.location.href = '/graph.html';
    }
    handleSwitchToSLNView(e) {
        window.location.href = '/sln.html';
    }
    handleModalHide(e) {
    }
    handleQLConnectivityTxt(e) {
        this.modal.show();
    }
    handleToggleExpand(e) {
        let state = !this.state.controlExpanded;
        this.setState({controlExpanded: state});
    }
    /**
     * @return {object}
     */
    render() {
        let func = getColorFunc();
        /* temporary code to dump color chart
        function rgb2hex(rgb){
         rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
         return (rgb && rgb.length === 4) ? "#" +
          ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
          ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
          ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
        }
        _.each(_.range(0, -6.25, -0.25), v => {
            let V = Math.pow(10, v);
            console.log('<tr><td>' + v + '</td><td style="color: ' + func(V) + '">' + rgb2hex(func(V)) + '</td><td style="color: ' + func(V) + '">' + func(V) + '</td></tr>');
        });
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
                    <section className="switch-view">
                    </section>
                    <section className="graph">
                        <section className="graph-container">
                            <div className="loading matrix-view">
                            </div>
                            <div className="loading-image">
                                <img src="/static/images/loading.svg" width="120" height="120"/>
                                <div className="loading-image-caption">Loading additional data, please be patient...</div>
                            </div>
                        </section>
                        <section className="info-panel"></section>
                    </section>
                </section>
            );
        } else {
            let sources = null;
            if (this.state.nodePicked) {
                sources = ', ' + this.strength_area_count + ' sources.';
            }
            //this.sortOptions = _.sortBy(this.sortOptions, 'index');
            let sortOptions = _.map(this.sortOptions, (v, k) => {
                v.key = k;
                return v;
            });
            sortOptions = _.sortBy(sortOptions, 'index');
            let options = _.map(sortOptions, (opt) => (<option value={opt.key} key={opt.key}>{opt.display}</option>));
            //<Modal ref={modal => this.modal = modal} modalStyle={modalStyle} onHide={this.handleModalHide}>
            //  Test modal
            //</Modal>
            //let cc = (<a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank"><img src="/static/images/sa_80x15.png"/></a>);
            //<div className="foldable-arrow" onClick={this.handleToggleExpand}>&#x25bf;</div>

            content = (
                <section className="main">
                    <ViewSwitch view="matrix" />
                    <section className="matrix">
                        <section id="graph-container">
                            <section id="d3_control" className="d3-control">
                                <div className={classNames(['foldable-control', 'thin-control'], {expanded: this.state.controlExpanded}, {folded: !this.state.controlExpanded})}>
                                    <div className="brief">
                                    </div>
                                    <div className="full">
                                        <div className="control-row">
                                            <div className="control-group">
                                                <p>This view presents the weighed and directed connectivity matrix based on the results of <a href="http://www.marmosetbrain.org/whitepaper#tracer_injections" target="_blank">injections of monosynaptic retrograde fluorescent tracers</a> injections.</p>
                                                <p>The rows and columns of the matrix represent individual cortical areas. The <i>Targets</i> are the injected areas while the <i>Sources</i> indicate the areas in which the projections originate. The intrinsic connections are excluded from the analysis.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="control-row list-areas">
                                        <div className="control-group">
                                            <div className="control-group-half">
                                                <label>List the areas </label>
                                                <select onChange={this.handleChangeOrder} value={this.state.order}>
                                                    {options}
                                                </select>
                                            </div>
                                            <div className="control-group-half">
                                                <label className="clickable" htmlFor="switch_edge_complete">{this.state.hideMissingSources ? 'Switch to the full matrix' : 'Switch to the edge-complete matrix'}</label>
                                                <input className="hidden" id="switch_edge_complete" type="checkbox" checked={this.state.hideMissingSources}
                                                    value={true}
                                                    onChange={this.handleToggleMissingSources}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                            <section id="d3" className="d3"></section>
                            <div className="color-bar-container">
                                <ColorBar style="matrix" mode="FLN"/>
                            </div>
                        </section>
                        <section id="info-panel" className="matrix-view">
                            <QuickLinks/>
                            <div className="injection-info">
                                <MainFlne flne={this.flne_per_area} areas={this._areas} mode='FLN' />
                                <InjectionList flne={this.state.flne_per_injection} mode='FLN'/>
                            </div>
                        </section>
                    </section>
                </section>
            );
        }
        return content;
    }

};
