import _ from 'lodash';
import AppStore from '../stores/AppStore';
export class ConnectivityRow {
    constructor() {
        return new Proxy({}, {
            get: (target, name) => {
                if (name in target) {
                    return target[name];
                } else {
                    let ret = {};
                    target[name] = ret;
                    return ret;
                }
            }
        });
    }
};
export class Connectivity {
    constructor() {
        this.data = new Proxy({}, {
            get: (target, name) => {
                if (name in target) {
                    return target[name];
                } else {
                    target[name] = new ConnectivityRow();
                    return target[name];
                }
            },
        });
        this.targets = {};
        this.sources = {};
        this._data = new Proxy({}, {
            get: (target, source) => {
                if (source in target) {
                    return target[source];
                } else {
                    target[source] = new ConnectivityRow();
                    return target[source];
                }
            },
        });
    }
    get size() {
        return {
            x: _.keys(this.targets).length,
            y: _.keys(this.sources).length
        }
    }
    link(target, source, data) {
        return;
        this.data[target.id][source.id] = data;
        let t = this.targets[target.id];
        this.targets[target.id] = (t === undefined ? 1 : t + 1);
        let s = this.sources[source.id];
        this.sources[source.id] = (s === undefined ? 1 : s + 1);
    }
    add(d, injectionInfo) {
        const areas = AppStore.getAreas();
        const target = areas.getByAbbrev(d.target);
        const source = areas.getByAbbrev(d.source);

        const t = this.targets[target.id];
        this.targets[target.id] = (t === undefined ? 1 : t + 1);
        const s = this.sources[source.id];
        this.sources[source.id] = (s === undefined ? 1 : s + 1);

        const sln_average = parseFloat(d.SLNeA);
        const data = this._data[target.id][source.id];
        let notdefined = false;
        let sln = parseFloat(d.SLNe);
        if (d.SLNe == 'N/A' && d.cell_count != '0') {
            if (d.source !== d.target) {
                notdefined = true;
                sln = 1.;
            }
        }
        let display_name;
        if (injectionInfo) {
            let injection_id = d.case_id + '-' + d.tracer_id;
            let ii = injectionInfo[injection_id];
            if (ii.display_name) {
                display_name = ii.display_name;
            }
        }
        const inj = {
            case_id: d.case_id,
            tracer_id: d.tracer_id,
            injection_id: d.case_id + '-' + d.tracer_id,
            display_name: display_name,

            sln: sln,
            target: target,
            source: source,
            flne: parseFloat(d.flne),
            log10_flne: Math.log10(d.flne),
            sln_notdefined: notdefined,

        };
        if (data.target === undefined) {
            this._data[target.id][source.id] = {
                source: source,
                target: target,
                sln: parseFloat(sln_average),
                injections: [inj],
                gmeannz: parseFloat(d.gmeannz),
                flne: parseFloat(d.mean),
                mean: parseFloat(d.mean),
                sln_notdefined: notdefined,
            };
        } else {
            data.injections.push(inj);
            /*
            let sum = 0;
            let count = 0;
            _.each(data.injections, inj => {
                if (inj.flne > 0) {
                    console.log('summing', data.target.abbrev, '<-', data.source.abbrev, inj.injection_id, inj.flne);
                    sum += inj.flne;
                    count++;
                } else {
                    console.log('less than 0', data.target.abbrev, '<-', data.source.abbrev, inj.injection_id, inj.flne);
                }
            });
            console.log('data.sln', data.sln, 'sum', sum, 'count', count);
            if (count > 0) {
                data.sln = sum / count;
            } else {
                data.sln = NaN;
            }
            */
        }
    }
    get_sln(target, source) {
        return this._data[target.id][source.id];
    }
    getData(target, source) {
        return this._data[target.id][source.id];
    }
    get_by_target(target) {
        return this._data[target.id];
    }
    getByTargetAndInjection(target, injection_id) {
        const conn = this._data[target.id];
        const injections = [];
        _.each(conn, s => {
            if (s.source) {
                _.each(s.injections, _inj => {
                    if (_inj.injection_id == injection_id && !isNaN(_inj.sln) && !_inj.sln_notdefined) {
                        injections.push(_inj);
                    }
                });
            }
        });
        return injections;
    }
};
export class Area {
    constructor(elem) {
        /*
        this.data = new Proxy({}, {
            get: (target, name) => {
                if (name in target) {
                    return target[name];
                } else {
                    target[name] = new ConnectivityRow();
                    return target[name];
                }
            },
        });
        */
        _.assign(this, elem);
    }
};

export class Areas {
    constructor() {
        this._areas = [];
        this._idTable = {};
        this._abbrevTable = {};
    }
    push(item) {
        this._areas.push(item);
        this._abbrevTable[item.abbrev] = this._areas.length - 1;
        this._idTable[item.id] = this._areas.length - 1;
    }
    get(id) {
        const idx = this._idTable[id];
        return this._areas[idx];;
    }
    getByAbbrev(abbrev) {
        return this._areas[this._abbrevTable[abbrev]];
    }
};
export function processAreas(data) {
    let areas = new Areas();
    _.each(data, (elem, key) => {
        let area = new Area(elem);
        areas.push(area);
    });
    return areas;
}
function _toObject(data) {
    let obj = [];
    _.each(data.data, (d) => {
        let elem = {}
        _.each(data.headers, (key, idx) => {
            elem[key] = d[idx];
        });
        obj.push(elem);
    });
    return obj;
}
export function processConnectivity(data, injectionInfo) {
    let conn = AppStore.getConnectivity();
    let conn_data = _toObject(data);
    _.each(conn_data, d => {
        conn.add(d, injectionInfo);

    });
    return conn;
}
