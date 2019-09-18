import React, {Component} from 'react';
import Actions from '../actions/Actions';
import AppStore from '../stores/AppStore';
import _ from 'lodash';
import classNames from 'classnames';
import numberFormat from '../lib/numberformat';
import * as d3 from 'd3';
import Slider from './Slider.react';
import moment from 'moment';
import {expandTracerID, humanReadableDate, humanReadableDiffInMonth, parseAP, parseML, parseDV, getOffset} from '../lib/utils';

export default class MetadataModal extends Component {
    constructor(props, context) {
        super(props, context);
        _.bindAll(this, 'handleChange', 'handleEnhanceBorder',
                  'handleSet3D', 'handleShowCoordTip', 'handleHideCoordTip',
                  'handle3DEnter', 'handle3DLeave',
                  'handleShowFlatmapTip', 'handleHideFlatmapTip',
                  'handleShow3DTip', 'handleHide3DTip',
                  'handleShowCrossSectionTip', 'handleHideCrossSectionTip', 'handleUpdateCrossSectionTip',
                  'handle3DReset'
                 );
        this.state = {
            p3d: AppStore.getPseudo3D(),
            top_lowres: false,
            bottom_lowres: false,
            top_done: false,
            bottom_done: false,
            showTip: false,
            showCrossSectionTip: false,
            showReset: false
        };
    }
    componentDidMount() {
        AppStore.addChangeListener(this.handleChange);
        let this_ = this;

        let top_lowres = new Image();
        top_lowres.onload = function() {
            this_.setState({
                top_lowres: true
            });
            let top_img = new Image();
            top_img.onload = function() {
                this_.setState({
                    top_done: true
                });
            };
            top_img.src = '/static/data/individual_injections_3d_visualization/' + this_.props.injection_name + '_website_view_midthickness_opaque.jpg';
        }
        top_lowres.src = '/static/data/individual_injections_3d_visualization/lowres/' + this.props.injection_name + '_website_view_midthickness_opaque.jpg';

        let bottom_lowres = new Image();
        bottom_lowres.onload = function() {
            this_.setState({
                bottom_lowres: true
            });
            let bottom_img = new Image();
            bottom_img.onload = function() {
                this_.setState({
                    bottom_done: true
                });
            };
            bottom_img.src = '/static/data/individual_injections_3d_visualization/' + this_.props.injection_name + '_website_view_midthickness_transparent.jpg';
        }
        bottom_lowres.src = '/static/data/individual_injections_3d_visualization/lowres/' + this.props.injection_name + '_website_view_midthickness_transparent.jpg';


    }
    componentWillUnmount() {
        AppStore.removeChangeListener(this.handleChange);
    }
    handleChange() {
        this.setState({
            p3d: AppStore.getPseudo3D()
        });
    }
    handleEnhanceBorder(e) {
        let checked = e.target.checked;
        if (checked) {
            Actions.set3DIndex('borderAlpha', 100);
        } else {
            Actions.set3DIndex('borderAlpha', 0);
        }
    }
    handleSet3D(e) {
        let dest = $(e.target).data('dest');
        switch (dest) {
            case 'dorsal':
                Actions.set3DIndex('y', 0);
                break;
            case 'ventral':
                Actions.set3DIndex('y', 6);
                break;
            case 'left':
                Actions.set3DIndex('x', -12);
                break;
            case 'right':
                Actions.set3DIndex('x', 12);
                break;
            case 'transparent':
                Actions.set3DIndex('alpha', 100);
                break;
            case 'opaque':
                Actions.set3DIndex('alpha', 0);
                break;
        }

    }
    handleShowCoordTip() {
        //this.setState({showTip: true});
    }
    handleHideCoordTip() {
        //this.setState({showTip: false});
    }
    handleShowCrossSectionTip() {
        this.setState({showCrossSectionTip: true});
    }
    handleHideCrossSectionTip() {
        this.setState({showCrossSectionTip: false});
    }
    handleUpdateCrossSectionTip(e) {
        if (this.state.showCrossSectionTip) {
            let tooltip = d3.select(this.tt);
            let x_ = e.clientX + 0;
            let y_ = e.clientY - 80;
            /*
            let offset = getOffset($('.injection-detail-container')[0]);
            x_ -= offset.left;
            y_ -= offset.top;
            console.log('offset', offset);
            console.log('x, y', x_, y_);
                var node = $('.injection-detail-container')[0];
                var curtop = 0;
                var curtopscroll = 0;
                if (node.offsetParent) {
                    do {
                        curtop += node.offsetTop;
                        curtopscroll += node.offsetParent ? node.offsetParent.scrollTop : 0;
                    } while (node = node.offsetParent);

                    y_ -= (curtop - curtopscroll);
                    console.log('offset i get', (curtop - curtopscroll));
                    y_ += 400;
                }
            */
            let bbox = $('.injection-detail-container')[0].getBoundingClientRect();
            x_ -= bbox.left;
            y_ -= bbox.top;
            tooltip
                .style("left", (x_) + "px")
                .style("top", (y_) + "px");
        }
    }
    handle3DEnter() {
        this.setState({showReset: true});
    }
    handle3DLeave() {
        this.setState({showReset: false});
    }
    handle3DReset() {
        let default_ = AppStore.getDefault3D();
        Actions.set3DIndex('x', default_.x);
        Actions.set3DIndex('y', default_.y);
        Actions.set3DIndex('alpha', default_.alpha);
    }
    handleShowFlatmapTip() {
        this.setState({showFlatmapTip: true});
    }
    handleHideFlatmapTip() {
        this.setState({showFlatmapTip: false});
    }
    handleShow3DTip() {
        this.setState({show3DTip: true});
    }
    handleHide3DTip() {
        this.setState({show3DTip: false});
    }
    render() {
        let loading;
        let injection_name = this.props.injection.display_name ? this.props.injection.display_name : this.props.injection_name;
        loading = (<div className="preloading">Loading Metadata for {injection_name}</div>);
        let area;
        let nodePicked = AppStore.getNodePicked();
        let title = (<div className="main-title">{injection_name},  Injection into the <span className="area-fullname">{nodePicked.fullname}</span>, {nodePicked.abbrev}</div>);
        let jump_href = 'http://www.marmosetbrain.org/goto/' + this.props.case_['case'] + '/'
            + this.props.injection.section + '/'
            + this.props.injection.section_x + '/'
            + this.props.injection.section_y
            + '/3';

        //<a className={classNames('jump', this.props.meta.tracer)} href={jump_href} target="_blank"><span className={classNames('icon-jump', this.props.meta.tracer)}/></a>
        let sub_title = (<div className="sub-title">
            <span className="coordinates" onMouseEnter={this.handleShowCoordTip} onMouseLeave={this.handleHideCoordTip}>
                {parseML(this.props.meta.l)} <br/>
                {parseAP(this.props.meta.a)} <br/>
                {parseDV(this.props.meta.h)}</span>
            <div className={classNames('tooltip', {hidden: !this.state.showTip})}>
                <div className="tip-title">
                    Stereotaxic coordinates (mm)
                </div>
                <div className="tip-item">
                    ML: Mediolateral, lateral to the midsagittal plane
                </div>
                <div className="tip-item">
                    AP: Rostrocaudal,
                    <div className="tip-subitem">
                        Positive: Caudal to interaural line<br/>
                        Negative: Rostral to interaural line
                    </div>
                </div>
                <div className="tip-item">
                    DV: Dorsoventral, Dorsal to the interaural line
                </div>
            </div>
        </div>);
        let sex;
        switch (this.props.case_.sex) {
            case 'M':
                sex = 'Male';
                break;
            case 'F':
                sex = 'Female';
                break;
            default:
                sex = 'Unknown';
                break;
        }
        let dob = humanReadableDate(this.props.case_.date_of_birth);
        let injection_date = humanReadableDate(this.props.case_.injection_date);
        let age = humanReadableDiffInMonth(this.props.case_.injection_date, this.props.case_.date_of_birth);
        let perfusion_date = humanReadableDate(this.props.case_.perfusion_date);
        let survival;
        if (this.props.case_.survival_days) {
            survival = '' + this.props.case_.survival_days + ' day' + (this.props.case_.survival_days > 1 ? 's' : '');
        }
        //<td>A {this.props.injection.a} L: {this.props.injection.l} H: {this.props.injection.h}</td>
        let case_memo = this.props.case_.memo;
        if (/^\s*$/.test(case_memo)) {
            case_memo = 'No case specific memo provided';
        }
        let injection_memo = this.props.meta.memo;
        if (/^\s*$/.test(injection_memo)) {
            injection_memo = 'No injection specific memo provided';
        }
        //<span className="cursor-pointer" onMouseEnter={this.handleShowFlatmapTip} onMouseLeave={this.handleHideFlatmapTip}>[?]</span>
        //<span className="" onMouseEnter={this.handleShow3DTip} onMouseLeave={this.handleHide3DTip}>[?]</span>
        return (
            <div className="modal-content">
                <div className="modal-title">
                    <div className="title-box">
                        {title}
                    </div>
                </div>
                <div className="case-detail-container">
                    <div className="caption">Case details</div>
                    <table className="case-detail">
                        <tbody>
                            <tr>
                                <th>Case ID:</th><td>{this.props.case_id}</td>
                            </tr>
                            <tr>
                                <th>Sex:</th><td>{sex}</td>
                            </tr>
                            <tr>
                                <th>Date of birth:</th>
                                <td>{dob}</td>
                            </tr>
                            <tr>
                                <th>Injection date:</th>
                                <td>{injection_date} &nbsp;&nbsp; {age ? '(' + age + ' old)' : ''}</td>
                            </tr>
                            <tr>
                                <th>Perfusion date:</th>
                                <td>
                                    {perfusion_date} &nbsp;&nbsp;
                                    {survival ? '(' + survival + ' survival time)' : ''}
                                </td>
                            </tr>
                            <tr>
                                <th colSpan="2" className="case-memo">Memo:</th>
                            </tr>
                            <tr>
                                <td colSpan="2">{case_memo}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="note">
                        Hit [<strong>Esc</strong>] to close the window.<br/>
                    </div>
                </div>
                <div className="injection-detail-container">
                    <div className="caption">Injection details</div>
                    <div className={classNames('tooltip', 'p3d-tip', {hidden: !this.state.show3DTip})}>
                        Individual cells plotted against the mid-thickness cortical surface.<br/>The tip of the cone denotes the center of mass of the injection.
                    </div>
                    <table className="injection-detail">
                        <tbody>
                            <tr>
                                <th>Tracer:</th><td>{this.props.meta.tracer} ({expandTracerID(this.props.meta.tracer)})</td>
                            </tr>
                            <tr>
                                <td></td><td></td>
                            </tr>
                            <tr>
                                <th>Injection hemisphere:</th>
                                <td>{this.props.meta.hemisphere == 'R' ? 'Right hemisphere' : 'Left hemisphere'}</td>
                            </tr>
                            <tr>
                                <th>Area:</th>
                                <td>{nodePicked.fullname}, {this.props.meta.region}</td>
                            </tr>
                            <tr>
                                <td colSpan="2" className="cross-section">
                                    <div className="cross-section-caption">
                                        Injection site plotted against the reference template
                                    </div>
                                    <div className="cross-section-sub-caption">
                                        <div className="coronal label">Coronal</div>
                                        <div className="sagittal label">Sagittal</div>
                                        <div className="axial label">Horizontal</div>
                                    </div>
                                    <div className="cross-section-image-container">
                                        <a href={jump_href} target="_blank">
                                            <img src={'/static/data/cross_sections/cross_section_' + this.props.injection_name + '.png?_=' + Date.now()}
                                                onMouseEnter={this.handleShowCrossSectionTip}
                                                onMouseLeave={this.handleHideCrossSectionTip}
                                                onMouseMove={this.handleUpdateCrossSectionTip}
                                            /></a>
                                    </div>
                                    <div className={classNames('tooltip', {hidden: !this.state.showCrossSectionTip})} ref={tt => {this.tt = tt; }}>
                                        <div className="tip-title">
                                            Click to view the injection site in the high-resolution viewer
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <th>Injection coordinates:</th>
                                <td>{sub_title}</td>
                            </tr>
                            <tr>
                                <th colSpan="2" className="injection-memo">Comments:</th>
                            </tr>
                            <tr>
                                <td colSpan="2">{injection_memo}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>);
    }
}
