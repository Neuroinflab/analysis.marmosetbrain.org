import AppDispatcher from '../dispatcher/AppDispatcher';
import EventEmitter from 'events';
import {processAreas, processConnectivity} from '../lib/connectivity';
import {Connectivity} from '../lib/connectivity';
let appState = {
    nodePicked: null,
    injectionsToShow: [],
    injectionToExpand: null,
    pseudo3D: {x: 0, y: 3, alpha: 50, borderAlpha: 0},
    areas: {},
    download: {},
    connectivity: new Connectivity(),
};

class AppStore extends EventEmitter {
    getAll() {
        return appState;
    }
    emitChange() {
        this.emit('change');
    }

    getNodePicked() {
        return appState.nodePicked;
    }
    getTargetAreaPicked() {
        return appState.nodePicked;
    }
    getInjectionsToShow() {
        let injs;
        if (appState.nodePicked) {

            if (appState.nodePicked.area) {
                injs = _.filter(appState.injectionsStatic, {abbrev: appState.nodePicked.nodeName});
            } else {
                injs = _.filter(appState.injectionsStatic, {abbrev: appState.nodePicked.abbrev});
            }
        } else {
            injs = [];
        }
        return injs;
    }
    getInjectionToExpand() {
        return appState.injectionToExpand;
    }
    findInjection(case_id, tracer_id) {
        let inj = _.find(appState.injectionsStatic, {case_id: case_id, tracer_id, tracer_id});
        return inj;
    }
    getPseudo3D() {
        return appState.pseudo3D;
    }
    getDefault3D() {
        return {
            x: 0, y: 3, alpha: 50, borderAlpha: 0
        }
    }
    getAreas() {
        return appState.areas;
    }
    getConnectivity() {
        return appState.connectivity;
    }
    getDownloadHref() {
        return appState.download.href;
    }
    getDownloadEvent() {
        return appState.download.event;
    }
    getDownloadFilename() {
        return appState.download.filename;
    }
    getDataOverlay() {
        return appState.dataOverlay;
    }
    /**
      * @param {function} callback
      */
    addChangeListener(callback) {
        this.on('change', callback);
    }

    /**
      * @param {function} callback
      */
    removeChangeListener(callback) {
        this.removeListener('change', callback);
    }
    /*
    addListener(event, callback) {
        this.on(event, callback);
    }
    removeListener(event, callback) {
        this.removeListener(event, callback);
    }
    */
}

let appStoreInstance = new AppStore();

// Register callback to handle all updates
appStoreInstance.dispatchToken = AppDispatcher.register(action => {
    switch (action.actionType) {
        case 'SAVE':
            appState = action.state;
            break;
        case 'PICK_NODE':
            appState.nodePicked = action.node;
            appStoreInstance.emitChange();
            break;
        case 'PICK_TARGET_AREA':
            appState.nodePicked = action.node;
            appStoreInstance.emitChange();
            break;
        case 'NODE_DETAIL':
            appStoreInstance.emitChange();
            break;
        case 'SAVE_INJECTIONS_STATIC':
            appState.injectionsStatic = action.injections;
            break;
        case 'EXPAND_INJECTION':
            appState.injectionToExpand = action.injection;
            let injs = _.filter(appState.injectionsStatic, {abbrev: appState.nodePicked.nodeName});
            _.each(injs, inj => {
                inj.collapse = true;
            });
            action.injection.collapse = false;
            appStoreInstance.emitChange();
            break;
        case 'HIDE_INJECTION':
            //appState.injectionToExpand = action.injection;
            action.injection.collapse = true;
            appStoreInstance.emitChange();
            break;
        case 'AJAX_PROGRESS':
            appStoreInstance.emit('ajax');
            break;
        case 'SET_3D_INDEX':
            appState.pseudo3D[action.axis] = action.value;
            appStoreInstance.emitChange();
            break;
        case 'SAVE_AREAS':
            _.assign(appState.areas, action.areas);
            break;
        case 'MODAL_HIDE':
            appStoreInstance.emit('modal_hide');
            break;
        case 'SET_DOWNLOAD_LINK':
            appState.download.href = action.href;
            appState.download.event = action.event;
            appState.download.filename = action.filename;
            appStoreInstance.emit('download');
            break;
        case 'SET_DATA_OVERLAY':
            appState.dataOverlay = action.overlay;
            appStoreInstance.emitChange();
            break;
        case 'PROCESS_CONNECTIVITY':
            appState.connectivity = processConnectivity(action.data, action.injectionInfo);
            appStoreInstance.emitChange();
            break;
        case 'PROCESS_AREAS':
            appState.areas = processAreas(action.data);
            appStoreInstance.emitChange();
            break;
        default:

            // no op
            break;
    }
    //sessionStorage.setItem('appState', JSON.stringify(appStoreInstance.getAll()));
});

export default appStoreInstance;
