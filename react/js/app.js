import React from 'react';
import ReactDOM from 'react-dom';
import AnalysisApp from './components/AnalysisApp.react';
import Footer from './components/Footer.react';

ReactDOM.render(
    <AnalysisApp />,
    document.getElementById('reactjs')
);
ReactDOM.render(
    <Footer />,
    document.getElementById('react_footer')
);
