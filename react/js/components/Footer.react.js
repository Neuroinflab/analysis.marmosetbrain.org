import React from 'react';
import Actions from '../actions/Actions';
import AppStore from '../stores/AppStore';
import InjectionList from './InjectionList.react';
import MainFlne from './MainFlne.react';
import AppDispatcher from '../dispatcher/AppDispatcher';
import _ from 'lodash';
import classNames from 'classnames';

export default class Footer extends React.Component {
    constructor(props, context) {
        super(props, context);
    }
    componentDidMount() {
    }
    componentWillUnmount() {
    }
    /**
     * @return {object}
     */
    render() {
        //<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank"><img src="/static/images/cc88x31.png" alt="The provided data is released under the terms of CC BY 4.0 license." title="The provided data is released under the terms of CC BY 4.0 license." /></a>
        //<span className="citation-policy">Please follow the <a href="http://marmoset.mrosa.org/about" target="_blank">citation policy</a></span>.
        return (
            <section className="footer">
                <div className="cc">
                    <a href="http://marmoset.mrosa.org/about" target="_blank"><img src="/static/images/cc88x31.png" alt="The provided data is released under the terms of CC BY 4.0 license." title="The provided data is released under the terms of CC BY 4.0 license." />
                        <div className="cc-tooltip">
                            The provided data is released under the terms of CC BY 4.0 license.<br/>
                            <strong>Please click to see the citation policy.</strong>
                        </div>
                    </a>
                </div>
                <div className="acknowledgement">
                    <section className="acknowledgement">
                        <section className="sponsor incf">
                            <a href="https://www.incf.org/" target="_blank" className="pad">
                                <img className="incf-logo pad" src="/static/images/incf_logo.svg" width="115" height="53"/>
                            </a>
                            <div className="sponsor-tooltip">
                                <div className="tooltip-text">
                                    <span>This project is sponsored by the<br/>
                                    International Neuroinformatics Coordinating Facility<br/>
                                    Seed Funding Grant</span>
                                </div>
                            </div>
                        </section>
                        <section className="sponsor arc">
                            <a href="http://www.arc.gov.au" target="_blank" className="pad">
                                <img className="arc-logo pad" src="/static/images/arc_logo.png" width="234" height="53"/>
                            </a>
                            <div className="sponsor-tooltip">
                                <div className="tooltip-text">
                                    <span>This project is sponsored by<br/>
                                        Australian Research Council</span>
                                </div>
                            </div>
                        </section>
                        <section className="sponsor cibf">
                            <a href="http://www.cibf.edu.au/discovery" target="_blank" className="pad">
                                <img className="cibf-logo pad" src="/static/images/cibf_logo.png" width="268" height="53"/>
                            </a>
                            <div className="sponsor-tooltip">
                                <div className="tooltip-text">
                                    <span>This project is sponsored by<br/>
                                        Australian Research Council<br/>
                                        Center of Excellence for Integrative Brain Function</span>
                                </div>
                            </div>
                        </section>
                        <section className="sponsor nencki">
                            <a href="http://en.nencki.gov.pl/laboratory-of-neuroinformatics" target="_blank" className="">
                                <img className="nencki-logo" src="/static/images/nencki_logo.png" height="66" />
                            </a>
                            <div className="sponsor-tooltip">
                                <div className="tooltip-text">
                                    <span>Data analysis and website development<br/>
                                        conducted in collaboration with<br/>
                                        the Laboratory of Neuroinformatics at<br/>
                                        the Nencki Institute of Experimental Biology;<br/>
                                        Warsaw, Poland.
                                        </span>
                                </div>
                            </div>
                        </section>
                        <section className="sponsor monash">
                            <a href="http://www.monash.edu.au" target="_blank" className="pad">
                                <img className="monash-logo pad" src="/static/images/monash_logo.png" width="181" height="53" />
                            </a>
                            <div className="sponsor-tooltip">
                                <div className="tooltip-text">
                                    <span>This project is sponsored by<br/>
                                        Monash University</span>
                                </div>
                            </div>
                        </section>
                    </section>
                </div>
            </section>
        );
    }
};
