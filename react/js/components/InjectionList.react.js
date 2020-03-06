import React, {Component} from 'react';
import Actions from '../actions/Actions';
import AppStore from '../stores/AppStore';
import _ from 'lodash';
import classNames from 'classnames';
import numberFormat from '../lib/numberformat';
import * as d3 from 'd3';
import Modal, {defaultModalStyle} from '../lib/modal';
import Slider from './Slider.react';
import Pseudo3D from './Pseudo3D.react';
import MetadataModal from './MetadataModal.react';
import {showTooltipAreaName, hideTooltip, getLogColorFunc, getBlueColorFunc,
    svgAddHatchLine} from '../lib/utils';
import ToolTip from './ToolTip.react';

function toTitleCase(str) {
    //return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    return str.charAt(0).toUpperCase() + str.substr(1);
}

class Injection extends Component {
    constructor(props, context) {
        super(props, context);
        this.d3Applied = false;
        this.barWidthFunc = undefined;
        _.bindAll(
            this, 'handleToggleCollapse', 'drawStrength',
            'areaBarMouseOver', 'areaBarMouseOut',
            'areaLabelMouseOver', 'areaLabelMouseOut',
            'handleDownloadCSV', 'handleDownloadSVG',
            'handleDownloadCells', 'handleDownloadNifti',
            'handleChange', 'show3DView', 'showCaseMeta',
            'handleModalHide'
        );
        this.asyncDone = false;
        this.state = {
            meta: null,
            in_degree: 0,
        };
    }
    componentDidMount() {
        //AppStore.addChangeListener(this.handleChange);
        $.get('/static/data/metadata/metadata_' + this.props.case_id + '.json')
        .done(data => {
            this.asyncDone = true;
            this.setState({meta: data});
        });
        let strength = this.props.strength;
        let in_degree = 0;
        if (this.props.mode == 'SLN') {
            in_degree = _.filter(strength, {sln_notdefined: false}).length;
            console.log('calculated in_degree', in_degree);
        } else {
            in_degree = strength.length;
        }
        this.setState({in_degree: in_degree});
    }
    componentWillUnmount() {
        //AppStore.removeChangeListener(this.handleChange);
        let flne = d3.select('#flne-' + this.props.name);
        //Actions.hideInjection(this.props.injection);
        flne.remove();
    }
    handleChange() {
    }
    handleToggleCollapse() {
        let collapse = !this.props.collapse;
        if (!collapse) {
            let other_injections = _.without(AppStore.getInjectionsToShow(), this.props.injection);
            _.each(other_injections, o => {
                Actions.hideInjection(o);
            });
            Actions.expandInjection(this.props.injection);
        } else {
            Actions.hideInjection(this.props.injection);
        }
    }
    drawStrength() {
        const mode = this.props.mode;
        let that = this;
        let strength = this.props.strength;
        let colorFunc;
        let data_attr;
        if (this.props.mode == 'SLN') {
            data_attr = 'sln';
            const _func = getBlueColorFunc();
            colorFunc = function(d) {
                if (d.source.abbrev == 'Ent') {
                    console.log('dump Ent', d);
                }
                if (d.sln_notdefined) {
                    return 'url("#diagonalHatch")';
                } else {
                    return _func(d[data_attr]);
                }
            }
        } else {
            data_attr = 'log10_flne';
            const _func = getLogColorFunc();
            colorFunc = function(d) {
                return _func(d[data_attr]);
            }
        }

        let _areas = AppStore.getAreas();
        let area = AppStore.getTargetAreaPicked();
        this.svg_flne_parent = d3.select('#flne-' + this.props.name);
        let svg = this.svg_flne_parent.append('svg')
            .attr('width', 365)
            .attr('height', 200);
        let flne = svg
            .append('g')
            .attr('transform', 'translate(50, 5)');
        svgAddHatchLine(svg);

        let y = null, flne_height = 100;
        let scaler, scaler_dom;
        if (strength) {
            flne_height = 10 * strength.length;
            d3.select('#flne-' + this.props.name + ' svg').attr('height', flne_height + 45);
            y = d3.scaleBand().range([0, flne_height]);
            y.round(true);
            y.paddingInner(.1);
            flne.selectAll('.row').remove();
            flne.selectAll('.axis-bottom').remove();
            strength = _.sortBy(strength, data_attr);
            if (mode == 'FLN') {
                _.reverse(strength);
            }
            let srcs = _.map(_.map(strength, 'source'), 'abbrev');
            y.domain(srcs);
            let flne_arr;
            flne_arr = _.map(strength, data_attr);
            let min = _.min(flne_arr), max = _.max(flne_arr);
            let barWidthFunc;
            if (this.props.mode == 'SLN') {
                barWidthFunc = this.getBarWidthFunc(-1, 1);
            } else {
                barWidthFunc = this.getBarWidthFunc(min, max);
            }
            this.barWidthFunc = barWidthFunc;
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
                    .attr('y', (d, i) => {
                        return y(d.source.abbrev) + y.bandwidth() / 2;
                    })
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
                    return y(d.source.abbrev) + y.bandwidth() / 2
                })
                .attr('text-anchor', 'end')
                .attr('alignment-baseline', 'middle')
                .attr('title', 'testtest')
                .text(d => d.source.abbrev)
                .on('mouseover', function(d, i) {
                    let me = d3.select(this);
                    that.areaBarMouseOver(me, _areas.byAbbrev[d.source.abbrev]);
                    that.areaLabelMouseOver(me, _areas.byAbbrev[d.source.abbrev]);
                    showValue(this.parentNode, d);
                })
                .on('mouseout', function(d, i) {
                    let me = d3.select(this);
                    that.areaBarMouseOut(me, _areas.byAbbrev[d.source.abbrev]);
                    that.areaLabelMouseOut(me, _areas.byAbbrev[d.source.abbrev]);
                    d3.select(this.parentNode).selectAll('rect').attr('fill', colorFunc(d));
                    d3.select(this.parentNode).selectAll('.num').remove();
                })

            row_enter.selectAll('.flne-rect')
                .attr('x', 0)
                .attr('y', (d, i) => {
                    return y(d.source.abbrev);
                })
                .attr('width', d => barWidthFunc(d[data_attr]))
                .attr('height', y.bandwidth())
                .attr('fill', d => colorFunc(d))
                .on('mouseover', function(d, i) {
                    let me = d3.select(this);
                    that.areaLabelMouseOver(me, _areas.byAbbrev[d.source.abbrev]);
                    that.areaBarMouseOver(me, _areas.byAbbrev[d.source.abbrev]);
                    showValue(this.parentNode, d);
                })
                .on('mouseout', function(d, i, p) {
                    let me = d3.select(this);
                    that.areaLabelMouseOut(me, _areas.byAbbrev[d.source.abbrev]);
                    that.areaBarMouseOut(me, _areas.byAbbrev[d.source.abbrev]);
                    d3.select(this.parentNode).selectAll('rect').attr('fill', colorFunc(d));
                    d3.select(this.parentNode).selectAll('.num').remove();
                })

            if (this.props.mode == 'FLN') {
                scaler = d3.axisBottom()
                    .scale(barWidthFunc)
                    .tickSizeInner(-flne_height)
                    .tickSizeOuter(0)
                    .tickValues([-5, -4, -3, -2, -1, 0])
                    .tickFormat(d3.format(',d'));
                    //.ticks(5);
            } else {
                scaler = d3.axisBottom()
                    .scale(barWidthFunc)
                    .tickSizeInner(-flne_height)
                    .tickSizeOuter(0)
                    .tickValues([0, 0.2, 0.4, 0.6, 0.8, 1])
                    .tickFormat(d3.format(',.1f'));
                    //.ticks(5);
            }
            scaler_dom = flne.append("g")
                .attr("transform", "translate(0," + flne_height + ")")
                .attr('class', 'axis-bottom')
                .call(scaler);
            scaler_dom.selectAll('.tick line').filter((d, i, l) => (i === l.length - 1)).attr('display', 'none');
            flne.selectAll('.individual-bar-scale-x-title').remove();
            let title = flne.append('text')
                .attr('class', 'individual-bar-scale-x-title')
                .attr('transform', 'translate(' + (320 / 2 - 20) + ', ' + (flne_height + 25) + ')')
                .attr('text-anchor', 'middle')
            if (this.props.mode == 'FLN') {
                title.append('tspan').attr('font-size', '12').text('log');
                title.append('tspan').text('10').attr('baseline-shift', 'sub');
                title.append('tspan').attr('font-size', '12').text('(FLNe)');
            } else {
                title.append('tspan').attr('font-size', '12').text('SLNe');
            }
        }
    }
    getBarWidthFunc(min, max) {
        if (this.props.mode == 'SLN') {
            min = 0, max = 1;
        } else {
            min = -5.5, max = 0;
        }

        let func = d3.scaleLinear().domain([min, max]).range([1, 300]);
        return func;
    }

    areaBarMouseOver(me, from_) {
        let target = AppStore.getNodePicked();
        Actions.highlightEdge(from_, target, '#000000');
        Actions.boldEdge(from_, target);
    }
    areaBarMouseOut(me, from_, to) {
        let target = AppStore.getNodePicked();
        Actions.unhighlightEdge(from_, target);
        Actions.unboldEdge(from_, target);
    }
    areaLabelMouseOver(me, from_) {
        let bbox = me.node().getBoundingClientRect();
        let top = bbox.top + $(document).scrollTop();
        let target = AppStore.getNodePicked();
        showTooltipAreaName({area: from_, x: bbox.left, y: top - 35});
    }
    areaLabelMouseOut(me, from_, to) {
        hideTooltip();
    }
    show3DView(e) {
        e.stopPropagation();
        this.setState({modal: '3dview'}, () => {
            this.modal.show();
        });
    }
    showCaseMeta(e) {
        e.stopPropagation();
        this.setState({modal: 'case_meta'}, () => {
            this.modal.show();
        });
    }
    handleDownloadSVG(e) {
        let html = this.svg_flne_parent.html();
        let b64 = btoa(html);
        let href = 'data:image/svg+xml;base64,\n' + b64;
        e.target.href = href;
        Actions.setDownloadLink(href, e, 'export_flatmap_graph.svg');
    }
    handleDownloadCSV(e) {
        let injection_name = this.props.injection.display_name ? this.props.injection.display_name + '-' + this.props.tracer_id : this.props.name;
        let href = '/static/data/individual_injections/flne_injection_' + this.props.name + '.csv';
        let download = 'flne_injection_' + injection_name + '.csv';
        e.target.href = href;
        e.target.download = download;
        Actions.setDownloadLink(href, e);
    }
    handleDownloadCells(e) {
        let injection_name = this.props.injection.display_name ? this.props.injection.display_name + '-' + this.props.tracer_id : this.props.name;
        let href = '/static/data/individual_injections/indivdual_cells_injection_' + this.props.name + '.csv';
        e.target.href = href;
        e.target.download = 'individual_cells_injection_' + injection_name + '.csv';
        Actions.setDownloadLink(href, e);
    }
    handleDownloadNifti(e) {
        let injection_name = this.props.injection.display_name ? this.props.injection.display_name + '-' + this.props.tracer_id : this.props.name;
        let href = '/static/data/individual_injections/nifti_map_' + this.props.name + '.zip';
        e.target.href = href;
        e.target.download = 'nifti_map_' + injection_name + '.zip';
        Actions.setDownloadLink(href, e);
    }
    handleModalHide(e) {
        Actions.modalHide('injection');
    }

    render() {
        let href='http://www.marmosetbrain.org/goto/' + this.props.case_id + '/'
            + this.props.section + '/'
            + this.props.section_x + '/'
            + this.props.section_y
            + '/3';
        let collapse = null;
        collapse = (
            <span className={classNames('collapse-toggle', {collapse: !this.props.collapse, expand: this.props.collapse})}></span>
        );
        let modal_content = 'Loading';
        if (this.asyncDone) {
            if (!this.d3Applied) {
                this.drawStrength();
                this.d3Applied = true;
            }
            let m = this.state.meta;
            let inj;

            let meta = _.find(this.state.meta.injections, {tracer: this.props.tracer_id});
            switch (this.state.modal) {
                case 'case_meta':
                    //inj = _.find(this.state.meta.injections, {tracer: this.props.tracer_id});
                    let inj = AppStore.findInjection(this.props.case_id, this.props.tracer_id);
                    modal_content = (
                        <div className="metadata-container">
                            <table className="metadata">
                                <tbody>
                                    <tr>
                                        <th>Case ID</th><td>{m['case']}</td>
                                    </tr>
                                    <tr>
                                        <th>Sex</th><td>{m.sex}</td>
                                    </tr>
                                    <tr>
                                        <th>Tracer</th><td>{this.props.tracer_id}</td>
                                    </tr>
                                    <tr>
                                        <th>Hemisphere</th><td>{m.hemisphere}</td>
                                    </tr>
                                    <tr>
                                        <th>Region</th><td>{inj.region}</td>
                                    </tr>
                                    <tr>
                                        <th>Atlas Coordinate</th><td>A {inj.a} L: {inj.l} H: {inj.h}</td>
                                    </tr>
                                    <tr>
                                        <th>Sectioning Plane</th><td>{m.sectioning_plane}</td>
                                    </tr>
                                    <tr>
                                        <th>Date of birth</th><td>{m.date_of_birth}</td>
                                    </tr>
                                    <tr>
                                        <th>Injection date</th><td>{m.injection_date}</td>
                                    </tr>
                                    <tr>
                                        <th>Survival days</th><td>{m.survival_days}</td>
                                    </tr>
                                    <tr>
                                        <th>Memo</th>
                                        <td>
                                            <div className="case-meta">
                                               {m.memo}
                                            </div>
                                            <div className="injection-meta">
                                               {inj.memo}
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>);
                    modal_content = (
                        <MetadataModal injection={inj} case_={m} meta={meta} case_id={this.props.case_id} injection_name={this.props.name} />
                    );
                    break;
                case '3dview':
                    inj = AppStore.findInjection(this.props.case_id, this.props.tracer_id);
                    modal_content = (
                        <Pseudo3D
                            injection={inj}
                            injection_name={this.props.name}
                            meta={meta}
                            case_id={this.props.case_id}
                            tracer_id={this.props.tracer_id}
                         />
                    );
                    break;
            }
        }
        let density_map = (
            <li className="density-map">
                Download density map [?]
                <div className="density-map">
                    Flatmap (500, 200, 100)<br/>
                    3D map (500, 200, 100)
                </div>
            </li>);
        density_map = null;
        /*
            <a
                onMouseOver={this.handleDownloadSVGHelp}
                onMouseOut={this.handleCloseDownloadSVGHelp}>[?]</a>
        */
        let injection_name = this.props.injection.display_name ? this.props.injection.display_name + '-' + this.props.tracer_id : this.props.name;
        let title_collapse = this.props.collapse ? 'Click to see connectivity profile for ' + injection_name + ' injection' : 'Click to close the details of ' + injection_name + ' injection';
        let modalStyle = _.clone(defaultModalStyle);
        let connectivity_header;
        if (this.props.mode == 'SLN') {
            connectivity_header = 'SLNe profile';
        } else {
            connectivity_header = 'Connectivity profile';
        }
        //{numberFormat(this.state.in_degree, 0, '.', '\u2009')} sources, {numberFormat(this.props.cells_ext, 0, '.', '\u2009')} extrinsic cells
        return (
            <div className="injection">
                <div className={classNames('injection-bar', this.props.tracer_id)} onClick={this.handleToggleCollapse} title={title_collapse}>
                    {collapse}
                    <span className={classNames('injection-name', this.props.tracer_id)}>
                        {injection_name}
                    </span>
                    <a className={classNames('jump-to-injection', this.props.tracer_id)}
                        target="_blank"
                        href={href}
                        title={'Click to jump to the injection site in high resolution viewer'}
                        >
                        <span className={classNames('icon-jump', this.props.tracer_id)}></span>
                    </a>
                    <a className="button-metadata"
                        onClick={this.showCaseMeta}
                        title={'Click to show metadata of Case ' + this.props.case_id}
                        >
                    </a>
                    <a className="button-3dview"
                        onClick={this.show3DView}
                        title={'Click to show 3D visualization of the projection pattern'}
                        >
                        3D
                    </a>
                </div>
                <div className={classNames('per-injection-detail', {hidden: this.props.collapse})}>
                    <span className="injection-cells">
                        {connectivity_header} for the {injection_name} injection<br/>
                    </span>
                    <div className="d3 flne-per-injection" id={'flne-' + this.props.name}></div>
                    <div className="download">
                        <ul>
                            <li className="download-svg">
                                <a onClick={this.handleDownloadSVG} download={'flne_' + this.props.name + '.svg'}
                                    title={'click to download the FLNe drawing in SVG format'}>
                                    Download bar chart as SVG drawing
                                </a>
                            </li>
                            <li className="download-csv"><a onClick={this.handleDownloadCSV} title={'click to download FLNe values of injection ' + injection_name + ' in csv format'}>Download results as CSV file</a>
                            </li>
                            <li className="download-csv"><a onClick={this.handleDownloadCells} title="click to download individual cell data in csv format">Download individual cells</a>
                            </li>
                            <li className="download-csv"><a onClick={this.handleDownloadNifti} title="click to download nifti 3D image of results">Download results as 3D image</a>
                            </li>
                            {density_map}
                        </ul>
                    </div>
                </div>
                <div className="clear-both"></div>
                <Modal ref={modal => this.modal = modal} modalStyle={modalStyle} onHide={this.handleModalHide}>
                    {modal_content}
                </Modal>
            </div>
        );
    }
}
export default class InjectionList extends Component {
    constructor(props, context) {
        super(props, context);
        _.bindAll(this, 'handleChange');
        this.state = {
            injections: [],
        };
    }
    componentDidMount() {
        AppStore.addChangeListener(this.handleChange);
    }
    componentWillUnmount() {
        AppStore.removeChangeListener(this.handleChange);
    }
    handleChange() {
        //this.setState({stage: AppStore.getActiveStage()});
        this.setState({
            nodePicked: AppStore.getNodePicked(),
            injections: AppStore.getInjectionsToShow()
        });
    }
    /**
     * @return {object}
     */
    render() {
        const mode = this.props.mode;
        let area_name = null;
        let nodePicked = this.state.nodePicked;
        if (nodePicked) {
            if (mode == 'SLN') {
                area_name = <ToolTip className="area-name" title={toTitleCase(nodePicked.fullname)}>area {nodePicked.abbrev}</ToolTip>;
            } else {
                area_name = toTitleCase(nodePicked.fullname) + ' (' + nodePicked.abbrev + ')';
            }
        }
        let info = null;
        let injection_count = this.state.injections.length;;
        if (injection_count > 0) {
            info = (
                <div className="info-label">
                    Individual injections into <span className="injection-area-name">{area_name}</span><br/>
                    (<span className="injection-count">{injection_count}</span> {injection_count > 1 ? 'injections' : 'injection'})
                </div>
            );
        } else {
            info = (
                <div className="info-label">
                    No injections into <span className="injection-area-name">{area_name}</span> in the database.
                </div>
            );
        }
        if (nodePicked) {
            return (
                <div className="injections-in-area">
                    {info}
                    <div className="injection-detail">
                        {_.map(this.state.injections, inj => {
                            let strength;
                            if (mode == 'SLN') {
                                const conn = AppStore.getConnectivity();
                                const areas = AppStore.getAreas();
                                strength = conn.getByTargetAndInjection(areas.getByAbbrev(nodePicked.abbrev), inj.name);
                            } else {
                                const conn = AppStore.getConnectivity();
                                const areas = AppStore.getAreas();
                                strength = conn.getByTargetAndInjection(areas.getByAbbrev(nodePicked.abbrev), inj.name);
                            }
                            return (
                                <Injection key={inj.name} name={inj.name}
                                    case_id={inj.case_id}
                                    section={inj.section}
                                    section_x={inj.section_x}
                                    section_y={inj.section_y}
                                    in_degree={inj.in_degree}
                                    tracer_id={inj.tracer_id}
                                    cells_ext={inj.cells_ext}
                                    cells_intr={inj.cells_intr}
                                    strength={strength}
                                    injection={inj}
                                    collapse={inj.collapse}
                                    mode={this.props.mode}
                                />);
                            })}
                    </div>
                </div>
            );
        } else {
            if (app.page == 'main3') {
                return (
                    <div className="injections-in-area">
                        <div className="info-label">
                            No area selected.<br/><br/>
                            Please select an area by clicking it on the graph to see detailed information on the retrograde connections.
                        </div>
                    </div>
                );
            } else {
                return (
                    <div className="injections-in-area">
                        <div className="info-label">
                            No area selected.<br/><br/>
                            Please select an area by clicking it on the matrix to see detailed information on the retrograde connections.
                        </div>
                    </div>
                );
            }
        }
    }

};
