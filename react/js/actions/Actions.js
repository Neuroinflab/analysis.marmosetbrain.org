import AppDispatcher from '../dispatcher/AppDispatcher';

export default class Actions {
    /**
    * @param  {object} candidate
    */
    static saveState(state) {
        AppDispatcher.dispatch({
            actionType: 'SAVE',
            state: state
        });
    }
    static showInjection(inj) {
        AppDispatcher.dispatch({
            actionType: 'SHOW_INJECTION',
            injection: inj
        });
    }
    static pickNode(node) {
        AppDispatcher.dispatch({
            actionType: 'PICK_NODE',
            node: node
        });
    }
    static pickTargetArea(node) {
        AppDispatcher.dispatch({
            actionType: 'PICK_TARGET_AREA',
            node: node
        });
    }
    static nodeDetail(node) {
        AppDispatcher.dispatch({
            actionType: 'NODE_DETAIL',
            node: node
        });
    }
    static saveInjectionsStatic(injections_static) {
        AppDispatcher.dispatch({
            actionType: 'SAVE_INJECTIONS_STATIC',
            injections: injections_static
        });
    }
    static expandInjection(injection) {
        AppDispatcher.dispatch({
            actionType: 'EXPAND_INJECTION',
            injection: injection
        });
    }
    static hideInjection(injection) {
        AppDispatcher.dispatch({
            actionType: 'HIDE_INJECTION',
            injection: injection
        });
    }
    static highlightEdge(from_, to, color) {
        AppDispatcher.dispatch({
            actionType: 'HIGHLIGHT_EDGE',
            from_: from_,
            to: to,
            color: color
        });
    }
    static unhighlightEdge(from_, to) {
        AppDispatcher.dispatch({
            actionType: 'UNHIGHLIGHT_EDGE',
            from_: from_,
            to: to
        });
    }
    static boldEdge(from_, to) {
        AppDispatcher.dispatch({
            actionType: 'BOLD_EDGE',
            from_: from_,
            to: to,
        });
    }
    static unboldEdge(from_, to) {
        AppDispatcher.dispatch({
            actionType: 'UNBOLD_EDGE',
            from_: from_,
            to: to
        });
    }
    static ajaxProgress() {
        AppDispatcher.dispatch({
            actionType: 'AJAX_PROGRESS'
        });
    }
    static set3DIndex(axis, value) {
        AppDispatcher.dispatch({
            actionType: 'SET_3D_INDEX',
            axis: axis,
            value: value
        });
    }
    static saveAreas(areas) {
        AppDispatcher.dispatch({
            actionType: 'SAVE_AREAS',
            areas: areas
        });
    }
    static modalHide(origin) {
        AppDispatcher.dispatch({
            actionType: 'MODAL_HIDE',
            origin: origin
        });
    }
    static setDownloadLink(href, event, filename) {
        AppDispatcher.dispatch({
            actionType: 'SET_DOWNLOAD_LINK',
            href: href,
            event: event,
            filename: filename

        });
    }
    static setFocusedViewState(state) {
        if (state == true) {
            localStorage.setItem('focusedView', true);
        } else {
            localStorage.removeItem('focusedView');
        }
    }
    static setDataOverlay(overlay) {
        AppDispatcher.dispatch({
            actionType: 'SET_DATA_OVERLAY',
            overlay: overlay
        });
    }
    static processAreas(data) {
        AppDispatcher.dispatch({
            actionType: 'PROCESS_AREAS',
            data: data
        });
    }
    static processConnectivity(data, injectionInfo) {
        AppDispatcher.dispatch({
            actionType: 'PROCESS_CONNECTIVITY',
            data: data,
            injectionInfo: injectionInfo
        });
    }
};

