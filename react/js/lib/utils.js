import * as d3 from 'd3';
import moment from 'moment';
export function toTitleCase(str) {
    //return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    return str.charAt(0).toUpperCase() + str.substr(1);
}
/*
export function getColorFunc(min, max) {
    let w = max - min;
    min = min - w * 0.1;
    min = 0, w = 1;
    max = 1;
    let colorFunction = d3.scaleLinear().domain([min, min + 0.005 * w, min + 0.13 * w, min + 0.28 * w, min + 0.32 * w, min + 0.74 * w, min + 0.92 * w, max])
        .range(['rgb(230, 230, 230)', 'rgb(244, 247, 140)', 'rgb(226, 139, 33)', 'rgb(215, 82, 35)', 'rgb(212, 67, 36)', 'rgb(124, 83, 89)', 'rgb(81, 51, 49)', 'rgb(81, 51, 49)']);
    function _colorFunction(v) {
        return colorFunction(Math.pow(10, v));
    }
    return _colorFunction;
}
*/
export function scientificNotion(value) {
    if (value < 0) {
        value = -value;
        negative = true;
    }
    let exp = Math.floor(Math.log10(value));
    let base = value;
    base = base * Math.pow(10, -exp);
    let v = '';
    v += base.toFixed(2);
    if (exp != 0) {
        v += '&#215;10<sup>' + (exp) + '</sup>';
    }
    return v;
}
export function showTooltipAreaName({area, x, y} = {}) {
    let tooltip = d3.select('div.tooltip');
    tooltip
        .style('opacity', .9)
        .classed('matrix-view', false);
    let x_ = x, y_ = y;
    if (x_ === null) {
        x_ = d3.event.pageX + 24;
    }
    if (y_ === null) {
        y_ = d3.event.pageY - 40;
    }
    let txt = area.fullname;
    tooltip.html(txt)
        .style("left", (x_) + "px")
        .style("top", (y_) + "px");
}
export function showTooltipTargetSummary({target_area, source_area, matrix, x, y} = {}) {
    let tooltip = d3.select('div.tooltip');
    tooltip
        .style('opacity', .9)
        .classed('matrix-view', false);
    let x_ = x, y_ = y;
    if (x_ === null) {
        x_ = d3.event.pageX + 24;
    }
    if (y_ === null) {
        y_ = d3.event.pageY - 40;
    }
    let txt = getTargetAreaSummaryHTML(target_area, source_area, matrix);
    tooltip.html(txt)
        .style("left", (x_) + "px")
        .style("top", (y_) + "px");
}
export function hideTooltip() {
    let tooltip = d3.select('div.tooltip');
    tooltip
        .style("opacity", 0);
}

export function getColorFunc() {
    let min = 0, max = 1, w = 1;
    let colorFunction = d3.scaleLinear().domain([min, min + 0.005 * w, min + 0.13 * w, min + 0.28 * w, min + 0.32 * w, min + 0.74 * w, min + 0.92 * w, max])
        .range(['rgb(230, 230, 230)', 'rgb(244, 247, 140)', 'rgb(226, 139, 33)', 'rgb(215, 82, 35)', 'rgb(212, 67, 36)', 'rgb(124, 83, 89)', 'rgb(81, 51, 49)', 'rgb(81, 51, 49)']);
    return colorFunction;
}
export function getBlueColorFunc() {
    let min = 0, max = 1, w = 1;
    const domain = [0.0, 0.0156, 0.0312, 0.0469, 0.0625, 0.0781, 0.0938, 0.1094, 0.125, 0.1406, 0.1562, 0.1719, 0.1875, 0.2031, 0.2188, 0.2344, 0.25, 0.2656, 0.2812, 0.2969, 0.3125, 0.3281, 0.3438, 0.3594, 0.375, 0.3906, 0.4062, 0.4219, 0.4375, 0.4531, 0.4688, 0.4844, 0.5, 0.5156, 0.5312, 0.5469, 0.5625, 0.5781, 0.5938, 0.6094, 0.625, 0.6406, 0.6562, 0.6719, 0.6875, 0.7031, 0.7188, 0.7344, 0.75, 0.7656, 0.7812, 0.7969, 0.8125, 0.8281, 0.8438, 0.8594, 0.875, 0.8906, 0.9062, 0.9219, 0.9375, 0.9531, 0.9688, 0.9844, 1.0];
    const range = ['rgb(180, 4, 38)', 'rgb(191, 7, 41)', 'rgb(202, 11, 44)', 'rgb(212, 15, 48)', 'rgb(223, 20, 51)', 'rgb(233, 24, 55)', 'rgb(242, 30, 58)', 'rgb(252, 35, 62)', 'rgb(255, 41, 65)', 'rgb(255, 45, 67)', 'rgb(255, 50, 70)', 'rgb(255, 56, 72)', 'rgb(255, 61, 75)', 'rgb(255, 67, 78)', 'rgb(255, 72, 81)', 'rgb(255, 78, 85)', 'rgb(255, 85, 89)', 'rgb(255, 91, 93)', 'rgb(255, 98, 98)', 'rgb(255, 105, 103)', 'rgb(255, 113, 109)', 'rgb(255, 121, 115)', 'rgb(255, 129, 122)', 'rgb(255, 138, 130)', 'rgb(255, 147, 139)', 'rgb(255, 157, 148)', 'rgb(255, 168, 159)', 'rgb(255, 180, 170)', 'rgb(255, 192, 184)', 'rgb(255, 206, 198)', 'rgb(245, 213, 207)', 'rgb(235, 218, 215)', 'rgb(223, 223, 223)', 'rgb(214, 221, 226)', 'rgb(204, 218, 229)', 'rgb(195, 215, 231)', 'rgb(186, 212, 233)', 'rgb(177, 209, 236)', 'rgb(169, 205, 238)', 'rgb(161, 201, 239)', 'rgb(153, 197, 241)', 'rgb(146, 193, 242)', 'rgb(139, 188, 243)', 'rgb(132, 184, 244)', 'rgb(126, 179, 245)', 'rgb(120, 174, 245)', 'rgb(114, 169, 245)', 'rgb(109, 164, 244)', 'rgb(103, 159, 244)', 'rgb(99, 153, 243)', 'rgb(94, 148, 242)', 'rgb(90, 143, 240)', 'rgb(86, 137, 238)', 'rgb(83, 132, 236)', 'rgb(79, 127, 233)', 'rgb(76, 121, 231)', 'rgb(74, 116, 227)', 'rgb(71, 111, 224)', 'rgb(69, 106, 220)', 'rgb(67, 101, 216)', 'rgb(65, 96, 212)', 'rgb(63, 91, 207)', 'rgb(61, 86, 203)', 'rgb(60, 81, 198)', 'rgb(59, 76, 192)'];
    let colorFunction = d3.scaleLinear().domain(domain)
        .range(range);
    return colorFunction;
}

export function getLogColorFunc() {
    let min = 0, max = 1, w = 1;
    let colorFunction = d3.scaleLinear().domain([min, min + 0.005 * w, min + 0.13 * w, min + 0.28 * w, min + 0.32 * w, min + 0.74 * w, min + 0.92 * w, max])
        .range(['rgb(230, 230, 230)', 'rgb(244, 247, 140)', 'rgb(226, 139, 33)', 'rgb(215, 82, 35)', 'rgb(212, 67, 36)', 'rgb(124, 83, 89)', 'rgb(81, 51, 49)', 'rgb(81, 51, 49)']);
    function _colorFunction(v) {
        return colorFunction(Math.pow(10, v));
    }
    return _colorFunction;
}

export function getColorGradient() {
    let grad = [
        {offset: 0, color: 'rgb(230, 230, 230)'},
        {offset: 0.005, color: 'rgb(244, 247, 140)'},
        {offset: 0.13, color: 'rgb(226, 139, 33)'},
        {offset: 0.28, color: 'rgb(215, 82, 35)'},
        {offset: 0.32, color: 'rgb(212, 67, 36)'},
        {offset: 0.74, color: 'rgb(124, 83, 89)'},
        {offset: 0.92, color: 'rgb(81, 51, 49)'},
        {offset: 1, color: 'rgb(81, 51, 49)'}
    ];
    return _.map(grad, v => {
        return {
            offset: (Math.log10(v.offset) + 6) / 6,
            color: v.color
        };
    });
}

export function expandTracerID(t) {
    switch (t) {
        case 'DY':
            return 'Diamidino yellow';
            break;
        case 'FB':
            return 'Fast blue';
            break;
        case 'FR':
            return 'Fluoro ruby';
            break;
        case 'FE':
            return 'Fluoro emerald';
            break;
        case 'CTBgr':
            return 'CTB Green';
            break;
        case 'CTBr':
            return 'CTB Red';
            break;
        case 'CTBg':
            return 'CTB Gold';
            break;
        default:
            return t;
            break;
    }
}
export function humanReadableDate(m) {
    let d = moment(m);
    if (d.isValid()) {
        return d.format('DD/MMM/YYYY');
    }  else {
        return 'Not provided';
    }
}
export function humanReadableDiffInMonth(a, b) {
    a = moment(a);
    b = moment(b);
    if (!a.isValid() || !b.isValid()) {
        return null;
    }
    let years = Math.floor(a.diff(b, 'years', true));
    let months = Math.floor(a.diff(b, 'months', true));
    if (years == 0) {
        years = '';
    } else if (years == 1) {
        years = '' + years + ' year';
    } else {
        years = '' + years + ' years';
    }
    months = months % 12;
    if (months == 0) {
        months = '';
    } else if (months == 1) {
        months = '' + months + ' month';
    } else {
        months = '' + months + ' months';
    }
    if (years == 0) {
        return months;
    } else {
        return years + ' ' + months;
    }
}

export function parseAP(v) {
    let dist;
    if (v == 0) {
        return 'At interaural line';
    } else if (v > 0) {
        dist = parseFloat(v).toFixed(1);
        return '' + dist + ' mm rostral to interaural line';
    } else {
        dist = parseFloat(-v).toFixed(1);
        return '' + dist + ' mm caudal to interaural line';
    }
}
export function parseML(v) {
    let dist;
    if (v == 0) {
        return 'At the midline';
    } else if (v > 0) {
        dist = parseFloat(v).toFixed(1);
        return '' + dist + ' mm lateral to the midline';
    } else {
        dist = parseFloat(-v).toFixed(1);
        return '' + dist + ' mm lateral to the midline';
    }
}
export function parseDV(v) {
    let dist;
    if (v == 0) {
        return 'At interaural line';
    } else if (v > 0) {
        dist = parseFloat(v).toFixed(1);
        return '' + dist + ' mm dorsal to the interaural line';
    } else {
        dist = parseFloat(-v).toFixed(1);
        return '' + dist + ' mm ventral to the interaural line';
    }
}
export function getOffset( el ) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return { top: _y, left: _x };
}
export function getBarWidthFunc(min, max, width) {
    let func = d3.scaleLinear().domain([min, max]).range([2, width]);
    return func;
}
export function getTargetAreaSummaryHTML(target_area, source_area, matrix, mode) {
        mode = mode || 'FLN';
        let txt = 'Target: ' + target_area.fullname + '<br/>';
        txt += 'Source: ' + source_area.fullname + '<br/>';
        const data = matrix.getData(target_area, source_area);
        let value;
        if (mode == 'SLN') {
            value = matrix.getData(target_area, source_area).sln;
        } else {
            value = matrix.getData(target_area, source_area).flne;
        }
        if (value !== undefined && value !== null && (mode == 'SLN' && value >= 0 || mode == 'FLN' && value > 0)) {
            let colorFunc, barWidthFunc, s;
            if (mode == 'SLN') {
                colorFunc = getBlueColorFunc();
                barWidthFunc = getBarWidthFunc(0, 1, 180);
                s = value.toFixed(2);
            } else {
                colorFunc = getLogColorFunc();
                barWidthFunc = getBarWidthFunc(-5.5, 0, 180);
                s = scientificNotion(value);
            }
            let negative = false;
            let log10 = Math.log10(value).toFixed(2);
            if (mode == 'FLN') {
                txt += 'Connection strength: <br/>';
                txt += '<span style="padding-left: 30px;">' + mode + 'e: ' + s + '</span><br/>';
            } else {
                txt += 'Fraction of supragranular extrinsic neurons, <br/>';
                txt += '<span style="padding-left: 30px;">' + mode + 'e: ' + s + '</span><br/>';
            }
            if (mode == 'FLN') {
                txt += '<span style="padding-left: 30px;">' + 'log<sub>10</sub>(' + mode + 'e): ' + log10 + '</span><br/>';
            }
            let summary;
            if (mode == 'FLN') {
                summary = ', log<sub>10</sub>(' + mode + 'e):';
            } else {
                summary = ':';
            }
            txt += '<div style="margin-top: 8px;">Based on ' + data.injections.length + ' injection' + (data.injections.length > 1 ? 's' : '') + summary + '</div>';
            txt += '<table class="injection-strength"><tbody>';
            let injection_strength = [];
            const injections = data.injections;
            let _injections = _.sortBy(injections, i => {
                //let injection_id = i.case_id + '-' + i.tracer_id;
                //let flne = _.find(flne_per_injection[injection_id], {source: source_area.abbrev});
                if (mode == 'SLN') {
                    if (i.sln >= 0) {
                        return i.sln;
                    } else {
                        return Infinity;
                    }
                } else {
                    if (i.flne > 0) {
                        return -i.flne;
                    } else {
                        return Infinity;
                    }
                }
                /*
                let flne = i.sln;
                if (flne) {
                    return -flne.flne;
                } else {
                    return Infinity;
                }
                */
            });
            _.each(_injections, _inj => {
                let injection_id = _inj.injection_id;;
                let injection_name = (_inj.display_name ? _inj.display_name : _inj.case_id) + '-' + _inj.tracer_id;
                let value;
                if (mode == 'SLN') {
                    value = _inj.sln;
                } else {
                    value = _inj.flne;
                }
                let strength;

                if (mode == 'SLN') {
                    if (!isNaN(value)) {
                        strength = '<div class="summary-flne"><div class="summary-flne-bar" style="width: ' + barWidthFunc(value) + 'px; background-color: ' + colorFunc(value) + '"></div>' +
                            '<div class="summary-flne-value">' + value.toFixed(2) + '</div></div>';
                    } else {
                        strength = '<div class="summary-flne"><div class="summary-flne-value nan">not found</div></div>';
                    }
                    injection_strength.push('<tr><td>' + injection_name + '</td><td>' + strength + '</td></tr>');
                } else {
                    if (value > 0) {
                        let log10_value = Math.log10(value);
                        strength = '<div class="summary-flne"><div class="summary-flne-bar" style="width: ' + barWidthFunc(log10_value) + 'px; background-color: ' + colorFunc(log10_value) + '"></div>' +
                            '<div class="summary-flne-value">' + log10_value.toFixed(2) + '</div></div>';
                    } else {
                        strength = '<div class="summary-flne"><div class="summary-flne-value nan">not found</div></div>';
                    }
                    injection_strength.push('<tr><td>' + injection_name + '</td><td>' + strength + '</td></tr>');
                }
            });

            txt += injection_strength.join('');
        } else {
            if (target_area.id === source_area.id) {
                txt += 'Intrinsic connections not shown<br/>';
            } else {
                if (mode == 'SLN' && data.sln_notdefined) {
                    txt += 'SLNe in area ' + source_area.abbrev + ' is not defined.<br/>';
                } else {
                    txt += 'Connection not detected<br/>';
                }
            }
        }
        txt += '</tbody></table>';
        return txt;
}

export class Area {
    constructor() {
    }
}
export class Areas {
    constructor() {
    }
}
export class Injection {
    constructor() {
    }
}
export class Injections {
    constructor() {
    }
}
export function svgAddHatchLine(svg) {
    svg.append('pattern')
        .attr('id', 'diagonalHatch')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', '4')
        .attr('height', '4')
        .append('path')
        .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
        .attr('style', 'stroke:black; stroke-width:1');

}
