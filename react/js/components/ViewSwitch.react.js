import React from 'react';
import classNames from 'classnames';

export default class MainMatrix extends React.Component {
    constructor(props, context) {
        super(props, context);
        let that = this;
        _.bindAll(this, 'handleSwitchToGraphView', 'handleSwitchToSLNView', 'handleSwitchToMatrixView',
            'handleFocusViewer', 'handleBlurViewer');
        let state = {
            controlExpanded: true,
            focused: false
        };
        this.state = state;

    }

    handleSwitchToGraphView(e) {
        window.location.href = '/graph.html';
    }
    handleSwitchToSLNView(e) {
        window.location.href = '/sln.html';
    }
    handleSwitchToMatrixView(e) {
        window.location.href = '/index.html';
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

    render() {
        return (
            <section className="switch-view">
                    <div className="control-row switch-view">
                        <div className="control-group">
                            <div className="switch-view-control">
                                <a href="/index.html">
                                    <label htmlFor="view_checkbox_matrix" className={classNames({active: this.props.view == 'matrix' })} title="Change to FLNe Matrix view (Shift + M)">FLNe Matrix</label>
                                </a>
                                <a href="/graph.html">
                                    <label htmlFor="view_checkbox_graph" className={classNames({active: this.props.view == 'graph' })} title="Change to FLNe graph view (Shift + G)">FLNe Graph</label>
                                </a>
                                <a href="/sln.html">
                                    <label htmlFor="view_checkbox_sln" className={classNames({active: this.props.view == 'SLN' })} title="Change to SLN view (Shift + S)">SLN Matrix</label>
                                </a>
                                <a href="https://github.com/Neuroinflab/analysis.marmosetbrain.org/wiki/Marmoset-Brain-Connectivity-Atlas-Project" target="_blank">
                                    <label className="">
                                        Learn More
                                    </label>
                                </a>
                                <input type="radio" id="view_checkbox_matrix" name="view" checked={this.props.view == 'matrix'} onChange={this.handleSwitchToMatrixView} />
                                <input type="radio" id="view_checkbox_graph" name="view" checked={this.props.view == 'graph'} onChange={this.handleSwitchToGraphView} />
                                <input type="radio" id="view_checkbox_sln" name="view" checked={this.props.view == 'sln'} onChange={this.handleSwitchToSLNView} />
                                <input type="radio" id="view_checkbox_api" name="view"/>
                            </div>
                            <div className="focused-display" onClick={this.state.focused ? this.handleBlurViewer : this.handleFocusViewer}><img width="32" height="32" src={this.state.focused ? '/static/images/fullscreen_1.png' : '/static/images/fullscreen_0.png'} title={this.state.focused ? "Click to exit expanded view (Shift + F)" : "Click to switch to expanded view (Shift + F)" }/></div>
                        </div>
                    </div>
            </section>
        );

    }
}
