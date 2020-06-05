import React, {Component} from 'react';
import Actions from '../actions/Actions';
import AppStore from '../stores/AppStore';
import _ from 'lodash';
import classNames from 'classnames';
import numberFormat from '../lib/numberformat';
import * as d3 from 'd3';
import Modal from '../lib/modal';
import Slider from './Slider.react';

let modalStyle = {
    width: '80%',
    maxWidth: '1200px',
    scrollX: 'auto',
    overflow: 'scroll',
    maxHeight: '100%'
};

export default class Pseudo3D extends Component {
    constructor(props, context) {
        super(props, context);
        _.bindAll(this, 'handleChange', 'handleEnhanceBorder',
                  'handleSet3D', 'handleShowTip', 'handleHideTip',
                  'handle3DEnter', 'handle3DLeave',
                  'handleShowFlatmapTip', 'handleHideFlatmapTip',
                  'handleShow3DTip', 'handleHide3DTip',
                  'handle3DReset', 'handleSpinLeft', 'handleSpinRight',
                  'incX', 'decX', 'incY', 'decY', 'handleStopSpinning',
                  'handleModalHide',
                  'handleDragStart', 'handleDragEnd', 'handleMouseMove',

                 );
        this.state = {
            p3d: AppStore.getPseudo3D(),
            top_lowres: false,
            bottom_lowres: false,
            top_done: false,
            bottom_done: false,
            showTip: false,
            showReset: false,
            spinning: false,
        };
        this.minX = -12;
        this.maxX = 12;
        this.minY = 0;
        this.maxY = 6;
        this.spinHandle = null;
    }
    componentDidMount() {
        AppStore.addChangeListener(this.handleChange);
        AppStore.addListener('modal_hide', this.handleModalHide);

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
        this.handleModalHide();
        AppStore.removeListener('modal_hide', this.handleModalHide);
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
    handleShowTip() {
        this.setState({showTip: true});
    }
    handleHideTip() {
        this.setState({showTip: false});
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
        this.handleStopSpinning();
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
    incX() {
        let newX = this.state.p3d.x + 1;
        if (newX > this.maxX) {
            newX = this.minX + 1;
        }
        Actions.set3DIndex('x', newX);
    }
    decX() {
        let newX = this.state.p3d.x - 1;
        if (newX < this.minX) {
            newX = this.maxX - 1;
        }
        Actions.set3DIndex('x', newX);
    }
    incY() {
        let newY = this.state.p3d.y + 1;
        if (newY > this.maxY) {
            newY = this.maxY;
        }
        Actions.set3DIndex('y', newY);
    }
    decY() {
        let newY = this.state.p3d.y - 1;
        if (newY < this.minY) {
            newY = this.minY;
        }
        Actions.set3DIndex('y', newY);
    }
    handleSpinLeft(e) {
        if (this.spinHandle) {
            clearInterval(this.spinHandle);
        }
        this.spinHandle = setInterval(() => {
            this.decX();
        }, 150);
        this.setState({spinning: true});
    }
    handleSpinRight(e) {
        if (this.spinHandle) {
            clearInterval(this.spinHandle);
        }
        this.spinHandle = setInterval(() => {
            this.incX();
        }, 150);
        this.setState({spinning: true});
    }
    handleStopSpinning() {
        if (this.spinHandle) {
            clearInterval(this.spinHandle);
            this.spinHandle = null;
        }

        this.setState({spinning: false});
    }
    handleModalHide() {
        this.handle3DReset();
    }
    handleDragStart(e) {
        let _f = e => {
            this.dragging = false;
        }

        $(window).one('mouseup', _f);

        this.dragging = true;
        this.startingPoint = [e.screenX, e.screenY];
        this.dragLastX = e.screenX;
        this.dragLastY = e.screenY;
    }
    handleDragEnd() {
        this.dragging = false;
    }
    handleMouseMove(e) {
        if (this.dragging) {
            console.log(e.screenX);
            if (Math.abs(e.screenX - this.dragLastX) > 8) {
                if (e.screenX < this.dragLastX) {
                    this.incX();
                } else {
                    this.decX();
                }
                this.dragLastX = e.screenX;
            }
            if (Math.abs(e.screenY - this.dragLastY) > 20) {
                if (e.screenY < this.dragLastY) {
                    this.incY();
                } else {
                    this.decY();
                }
                this.dragLastY = e.screenY;
            }
        }
    }
    render() {
        let index_x = -this.state.p3d.x, index_y = 6 - this.state.p3d.y;
        if (index_x < 0) {
            index_x += 24;
        }
        const offset_x = 540 * -(index_x);
        const offset_y = 540 * -(index_y);
        const bg_pos = offset_x + 'px ' + offset_y + 'px';
        const opacity = 1 - (parseFloat(this.state.p3d.alpha) / 100);
        const borderOpacity = (parseFloat(this.state.p3d.borderAlpha) / 100);

        let top_image, bottom_image;
        if (this.state.top_done) {
            top_image = 'url(/static/data/individual_injections_3d_visualization/' + this.props.injection_name + '_website_view_midthickness_opaque.jpg)';
        } else {
            top_image = 'url(/static/data/individual_injections_3d_visualization/lowres/' + this.props.injection_name + '_website_view_midthickness_opaque.jpg)';
        }

        if (this.state.bottom_done) {
            bottom_image = 'url(/static/data/individual_injections_3d_visualization/' + this.props.injection_name + '_website_view_midthickness_transparent.jpg)';
        } else {
            bottom_image = 'url(/static/data/individual_injections_3d_visualization/lowres/' + this.props.injection_name + '_website_view_midthickness_transparent.jpg)';
        }

        let loading;
        if (this.state.top_lowres && this.state.bottom_lowres) {
            if (this.state.top_done && this.state.bottom_done) {
                loading = null;
            } else {
                loading = (<div className="preloading">Loading High Resolution 3D Model</div>);
            }
        } else {
            loading = (<div className="preloading">Loading 3D Model</div>);
        }
        let reset;
        let p3d = this.state.p3d;
        let default3D = AppStore.getDefault3D();
        if (p3d.x != default3D.x || p3d.y != default3D.y || p3d.alpha != default3D.alpha) {
            reset = (<button className={classNames('reset-button', {hidden: !this.state.showReset})} onClick={this.handle3DReset}>Reset to lateral</button>);
        }
        let stopSpinning;
        if (this.state.spinning) {
            stopSpinning = (<button className={classNames('stop-button')} onClick={this.handleStopSpinning}>Stop Spinning</button>);
            stopSpinning = null;
        }
        let area;
        let nodePicked = AppStore.getNodePicked();
        let injection_name = this.props.injection.display_name ? this.props.injection.display_name : this.props.injection_name;
        let title = (<div className="main-title">{injection_name},  Injection into the <span className="area-fullname">{nodePicked.fullname}</span>, {nodePicked.abbrev}</div>);
        let jump_href = 'http://www.marmosetbrain.org/goto/' + this.props.case_id + '/'
            + this.props.injection.section + '/'
            + this.props.injection.section_x + '/'
            + this.props.injection.section_y
            + '/3';
        let sub_title = (<div className="sub-title">
            <a className={classNames('jump', this.props.tracer_id)} href={jump_href} target="_blank" title="Click to jump to injection in high resolution viewer"><span className={classNames('icon-jump', this.props.tracer_id)}/></a>
            <span className="coordinates" onMouseEnter={this.handleShowTip} onMouseLeave={this.handleHideTip}>
                ML: {parseFloat(this.props.meta.l).toFixed(1)} mm,
                AP: {parseFloat(this.props.meta.a).toFixed(1)} mm,
                DV: {parseFloat(this.props.meta.h).toFixed(1)} mm</span>
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
        let spinLeft = (<div className="button cursor-pointer spin-button" title="Spin the 3D model anti-clockwise" onClick={this.handleSpinLeft} data-dest="left">&#x21ba;</div>);
        let spinRight = (<div className="button cursor-pointer spin-button" title="Spin the 3D model clockwise" onClick={this.handleSpinRight} data-dest="right">&#x21bb;</div>);
        if (this.state.spinning) {
            spinLeft = (<div className="button cursor-pointer" onClick={this.handleStopSpinning} title="Stop spinning" data-dest="left">◻</div>);
            spinRight = (<div className="button cursor-pointer" onClick={this.handleStopSpinning} title="Stop spinning" data-dest="right">◻</div>);
        }
        return (
            <div className="modal-content">
                <div className="modal-title">
                    <div className="title-box">
                        {title}
                        {sub_title}
                    </div>
                </div>
                <div className="flatmap-container">
                    <div className="caption">Labelled cells projected onto the flatmap <span className="cursor-pointer" onMouseEnter={this.handleShowFlatmapTip} onMouseLeave={this.handleHideFlatmapTip}>[?]</span></div>
                    <div className={classNames('tooltip', 'flatmap-tip', {hidden: !this.state.showFlatmapTip})}>
                        Flattened mid-thickness cortical surface.<br/>Different colors correspond to various areas. Black dots denote individual cells projected onto the flat map, while the sphere indicates the injection location.
                    </div>
                    <img className="flatmap" src={'http://flatmap.marmosetbrain.org/flatmap/' + this.props.case_id + '/' + this.props.tracer_id + '.png'}/>
                    <img className="flatmap-border" src="http://flatmap.marmosetbrain.org/flatmap/flatmap_border.png"
                        style={{opacity: borderOpacity}} />
                    <div className="opacity-slider">
                        <div className="wrapper">
                            <input type="checkbox" value="1" checked={this.state.p3d.borderAlpha == '100'} onChange={this.handleEnhanceBorder} /><span className="enhance-border">Enhance borders</span><br/>
                            <i className="download-csv" />
                            <a href={'http://flatmap.marmosetbrain.org/flatmap/' + this.props.case_id + '/' + this.props.tracer_id + '.png'} target="_blank" title={'Download the flatmap image for injection ' + this.props.injection_name}>Download the image</a>
                        </div>
                    </div>
                    <div className="note">
                        Hit [<strong>Esc</strong>] to close the window.<br/>
                        See the Majka et al. (2016) article, figs. 7 and 8 (<a href="https://doi.org/10.1002/cne.24023" target="_blank">10.1002/cne.24023</a>)<br/>for detailed description of the mapping procedure.
                    </div>
                </div>
                <div className="pseudo-3d-container">
                    <div className="caption">3D visualization of the projection pattern<br/>visualized against the midthickness surface <span className="" onMouseEnter={this.handleShow3DTip} onMouseLeave={this.handleHide3DTip}>[?]</span></div>
                    <div className={classNames('tooltip', 'p3d-tip', {hidden: !this.state.show3DTip})}>
                        Individual cells plotted against the mid-thickness cortical surface.<br/>The tip of the cone denotes the center of mass of the injection.
                    </div>
                    <div className="pseudo-3d"
                            onMouseEnter={this.handle3DEnter}
                            onMouseLeave={this.handle3DLeave}
                        >
                        <div className="pseudo-3d-top"
                            onMouseDown={this.handleDragStart}
                            onMouseUp={this.handleDragEnd}
                            onMouseMove={this.handleMouseMove}
                            style={{
                                backgroundImage: top_image,
                                backgroundPosition: bg_pos,
                                opacity: opacity
                            }}
                        />
                        <div className="pseudo-3d-bottom"
                            style={{
                                backgroundImage: bottom_image,
                                backgroundPosition: bg_pos
                            }}
                        />
                        {loading}
                        {reset}
                        {stopSpinning}
                    </div>
                    <div className="pseudo-3d-horizontal-slider">
                        <div className="left-legend">
                            {spinLeft}
                            <div className="button cursor-pointer" onClick={this.handleSet3D} title="Medial view" data-dest="left">&#x25c1;</div>
                        </div>
                        <Slider axis="x" min={-12} max={12} step={1} orient="horizontal" />
                        <div className="right-legend">
                            <div className="button cursor-pointer" onClick={this.handleSet3D} title="Medial view" data-dest="right">&#x25b7;</div>
                            {spinRight}
                        </div>
                    </div>
                    <div className="pseudo-3d-vertical-slider">
                        <div className="top-legend-row">
                            <div className="top-legend cursor-pointer" onClick={this.handleSet3D} title="Ventral view"  data-dest="ventral">Ventral</div>
                        </div>
                        <div className="slider-row">
                            <Slider axis="y" min={0} max={6} step={-1} orient="vertical" />
                        </div>
                        <div className="bottom-legend-row">
                            <div className="bottom-legend cursor-pointer" onClick={this.handleSet3D} title="Dorsal view" data-dest="dorsal">Dorsal</div>
                        </div>
                    </div>
                    <div className="pseudo-3d-opacity-slider">
                        <div className="left-legend cursor-pointer" onClick={this.handleSet3D} data-dest="opaque">Opaque</div>
                        <Slider axis="alpha" min={0} max={100} step={10} orient="horizontal">
                        </Slider>
                        <div className="right-legend cursor-pointer" onClick={this.handleSet3D} data-dest="transparent">Transparent</div>
                    </div>
                </div>
            </div>);
    }
    //<div className="pseudo-3d-label-opaque">Opaque</div>
    //<div className="pseudo-3d-label-transparent">Transparent</div>
}
