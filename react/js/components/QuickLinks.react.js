import React from 'react';
import Actions from '../actions/Actions';
import AppStore from '../stores/AppStore';
import InjectionList from './InjectionList.react';
import ColorBar from './ColorBar.react';
import MainFlne from './MainFlne.react';
import Modal, {defaultModalStyle} from '../lib/modal';
import AppDispatcher from '../dispatcher/AppDispatcher';
import _ from 'lodash';
import * as d3 from 'd3';
import classNames from 'classnames';
import {toTitleCase, getColorFunc, scientificNotion, getTargetAreaSummaryHTML} from '../lib/utils';
import {Connectivity} from '../lib/connectivity';

const LICENSE_RENEW = 3600;
const CONNECTIVITY_MATRIX = '/static/data/marmoset_brain_architecture_1_0_fln_matrix.txt';
const CONNECTIVITY_MATRIX_GPICKLE = '/static/data/marmoset_brain_architecture_1_0_connectivity_matrix.gpickle';
const ALL_INJECTIONS = '/static/data/marmoset_brain_architecture_1_0_all_injections.txt';
const SQL_DATABASE = '/static/data/marmoset_brain_architecture_1_0_master_database.db';
const INTERAREAL_DISTACE = '/static/data/marmoset_brain_architecture_1_0_interareal_distance_matrix.txt';

export default class QuickLinks extends React.Component {
    constructor(props, context) {
        super(props, context);
        let that = this;
        this.state = {
            showTooltip: false
        };
        _.bindAll(this,
                  'handleAgreementAccept', 'handleAgreementCancel',
                  'handleQLConnectivityTxt', 'handleQLConnectivityPickle',
                  'handleQLAllInjections', 'handleQLSQLite',
                  'handleInterAreal',
                  'handleQLScreenCast', 'handleQLVideoDoc',
                  'openLink', 'removeLicense',
                  'handleLicenseCheck',
                  'handleShowTooltip', 'handleHideTooltip'
                 );
    }
    componentDidMount() {
        AppStore.addListener('download', this.handleLicenseCheck);
    }
    componentWillUnmount() {
        AppStore.removeListener('download', this.handleLicenseCheck);
    }
    handleModalHide(e) {
    }
    handleQLConnectivityTxt(e) {
        let href = CONNECTIVITY_MATRIX;
        Actions.setDownloadLink(href, e, href.split('/').pop());
    }
    handleQLConnectivityPickle(e) {
        let href = CONNECTIVITY_MATRIX_GPICKLE;;
        Actions.setDownloadLink(href, e, href.split('/').pop());
    }
    handleQLAllInjections(e) {
        let href = ALL_INJECTIONS;
        Actions.setDownloadLink(href, e, href.split('/').pop());
    }
    handleQLSQLite(e) {
        e.preventDefault();
        return;
        let href = SQL_DATABASE;
        Actions.setDownloadLink(href, e, href.split('/').pop());
    }
    handleInterAreal(e) {
        let href = INTERAREAL_DISTACE;
        Actions.setDownloadLink(href, e, href.split('/').pop());
    }
    handleQLScreenCast(e) {
        e.preventDefault();
        return;
    }
    handleQLVideoDoc(e) {
        e.preventDefault();
        return;
    }
    handleAgreementAccept(e) {
        let local = window.localStorage;
        local.setItem('CCLicense', JSON.stringify({status: 'Accepted', ts: (Date.now() / 1000 | 0)}));
        this.openLink();
    }
    handleAgreementCancel(e) {
        this.modal.hide();
    }
    handleLicenseCheck(e) {
        let local = window.localStorage;
        let accept = JSON.parse(local.getItem('CCLicense'));
        let ev = AppStore.getDownloadEvent();
        if (accept && accept.status == 'Accepted' && ((Date.now() / 1000 | 0) - accept.ts <= LICENSE_RENEW)) {
            if (ev) {
                // if licensee requirement already accepted, no-op to allow browser to handle the click event
            } else {
                // if no event provided, simulate the download using window.open
                //this.openLink();
            }
        } else {
            if (ev) {
                // if licensing intervention needed, cancel the brower event handling
                ev.preventDefault();
            }
            this.modal.show();
        }
    }
    openLink(e) {
        let href = AppStore.getDownloadHref();
        if (href) {
            if (href.startsWith('data:')) {
                let filename = AppStore.getDownloadFilename();
                let a = $('<a></a>').attr('href', href).css({display: 'none'}).text('Download');
                if (filename) {
                    a.attr('download', filename);
                }
                a.get(0).click();
                a.remove();
            } else {
                if (href != '#') {
                    // actually a no-op may not be a bad idea
                    //window.open(href, '_blank');
                    let filename = AppStore.getDownloadFilename();
                    let a = $('<a></a>').attr('href', href).css({display: 'none'}).text('Download');
                    if (filename) {
                        //a.attr('download', filename);
                        //a.prop('download', filename);
                    }
                    a.get(0).setAttribute('download', filename);
                    a.get(0).click();
                    a.remove();
                }
            }
        }
        if (!this.modal.state.hidden) {
            this.modal.hide();
        }
    }
    removeLicense(e) {
        let local = window.localStorage;
        let accept = local.removeItem('CCLicense');
    }
    handleShowTooltip(e) {
        let bbox = $('.quick-links')[0].getBoundingClientRect();
        let target_bbox = e.target.getBoundingClientRect();
        let y = target_bbox.top - bbox.top + 25;
        //let x = e.pageX - 1000;
        //let x = e.clientX - bbox.left + 20;
        let x = 15;
        $('.quink-link-tips').css({
            top: y + 'px',
            left: x + 'px'
        });
        this.setState({
            showTooltip: true
        });
    }
    handleHideTooltip(e) {
        this.setState({
            showTooltip: false
        });
    }

    /**
     * @return {object}
     */
    render() {
        let modalStyle = _.clone(defaultModalStyle);
        modalStyle.width = '60%';
        modalStyle.maxWidth = '960px';


        let cc = (<a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank"><img src="/static/images/sa_80x15.png"/></a>);
        cc = null;
        /*
                    <li className="with-gap" onMouseEnter={this.handleShowTooltip} onMouseLeave={this.handleHideTooltip}>
                        <a href="#" onClick={this.handleQLVideoDoc} target="_blank"><span className="link">Video documentation of the website</span></a>
                    </li>
                    <li className="transparent">
                        <a href="#" onClick={this.handleQLScreenCast} target="_blank"><span className="link">Screencast on the features of the connectivity matrix</span></a>
                    </li>
                    <li className="transparent">
                        <a href="#" onClick={this.removeLicense}><span className="link">Clear License cache (internal use)</span></a>
                    </li>
                    */
        return (
            <section className="quick-links">
                <strong>Quick Links:</strong>
                <ul>
                    <li>
                        <a href={CONNECTIVITY_MATRIX} download onClick={this.handleQLConnectivityTxt}><span className="link">Connectivity matrix (txt file)</span></a> {cc}
                    </li>
                    <li>
                        <a href={CONNECTIVITY_MATRIX_GPICKLE} download onClick={this.handleQLConnectivityPickle}><span className="link">Connectivity matrix (networkX gpickle)</span></a> {cc}
                    </li>
                    <li>
                        <a href={ALL_INJECTIONS} download onClick={this.handleQLAllInjections}><span className="link">Collated results of all injections (txt file)</span></a> {cc}
                    </li>
                    <li>
                        <a href={INTERAREAL_DISTACE} download onClick={this.handleInterAreal}><span className="link">Interareal distance matrix (txt file)</span></a> {cc}
                    </li>
                    <li className="with-gap">
                        <a href="https://github.com/Neuroinflab/analysis.marmosetbrain.org/wiki/Application-Programming-Interface" target="_blank"><span className="link">Developer API documentation</span></a>
                    </li>
                </ul>
                <Modal ref={modal => this.modal = modal} modalStyle={modalStyle} onHide={this.handleModalHide}>
                    <div className="agreement">
                        <div className="title">Licence agreement</div>
                        <div className="content">
                            <p>I have read and understood <a href="http://www.marmosetbrain.org/about" target="_blank">the citation policy</a>, the <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank">CC BY-SA 4.0 licence</a> and I understand under which condition I can use the data and how to acknowledge the datased I am about to download.</p>
                            <div className="license-modal-how-to-cite">
                                <div className="subtitle">How to cite?</div>
                                <div className="content">
                                    Majka, P., Chaplin, T. A., Yu, H.-H., Tolpygo, A., Mitra, P. P., Wójcik, D. K., &amp; Rosa, M. G. P. (2016). <i>Towards a comprehensive atlas of cortical connections in a primate brain: Mapping tracer injection studies of the common marmoset into a reference digital template.</i> Journal of Comparative Neurology, 524(11), 2161–2181. <a href="http://doi.org/10.1002/cne.24023">http://doi.org/10.1002/cne.24023</a>
                                </div>
                            </div>

                        </div>
                        <div className="agreement-accept">
                            <button onClick={this.handleAgreementAccept}>Accept</button>
                            <button onClick={this.handleAgreementCancel}>Cancel</button>
                        </div>
                    </div>
                </Modal>
                <div className={classNames('quink-link-tips', {hidden: !this.state.showTooltip})}>
                    This function is still under active construction, please check it out later.
                </div>
            </section>
        );
    }

};
