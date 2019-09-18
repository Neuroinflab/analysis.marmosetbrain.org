import React from 'react';
import Actions from '../actions/Actions';
import AppStore from '../stores/AppStore';
import _ from 'lodash';
import * as d3 from 'd3';
import ColorBar from './ColorBar.react';
export default class MainSection extends React.Component {
    constructor(props, context) {
        window.d3js = d3;
        super(props, context);
        _.bindAll(this, 'handleChange');
        this.state = {
            stage: 'initial'
        }
    }
    componentDidMount() {
        AppStore.addChangeListener(this.handleChange);
        let margin = {top: 80, right: 0, bottom: 10, left: 80},
            width = 1280,
            height = 1280;
            //let maxZ = 676;
            let maxZ = 1000;
            let colorFunction = d3.scaleLinear().domain([0.0 * maxZ, 0.005 * maxZ, 0.13 * maxZ, 0.28 * maxZ, 0.32 * maxZ, 0.74 * maxZ, 0.92 * maxZ, maxZ])
                .range(['rgb(230, 230, 230)', 'rgb(244, 247, 140)', 'rgb(226, 139, 33)', 'rgb(215, 82, 35)', 'rgb(212, 67, 36)', 'rgb(124, 83, 89)', 'rgb(81, 51, 49)', 'rgb(81, 51, 49)']);

        let x = d3.scaleBand().range([0, width]),
            z = d3.scaleLog().domain([1, 676]).clamp(true),
            c = d3.scaleOrdinal(d3.schemeCategory10).domain(d3.range(10));
        let svg = d3.select("#d3").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            //.style("margin-left", -margin.left + "px")
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            d3.json('/static/data/connectivity_1_0_0.json', function(miserables) {
                let matrix = [], nodes = miserables.nodes, n = nodes.length;
                // Compute index per node.
                nodes.forEach(function(node, i) {
                    node.index = i;
                    node.count = 0;
                    matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
                });

                // Convert links to matrix; count character occurrences.
                miserables.links.forEach(function(link) {
                    //matrix[link.source][link.target].z += link.value;
                    matrix[link.target][link.source].z += link.value;
                    //matrix[link.source][link.source].z += link.value;
                    //matrix[link.target][link.target].z += link.value;
                    nodes[link.source].count += link.value;
                    nodes[link.target].count += link.value;
                });

                // Precompute the orders.
                var orders = {
                    name: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].nodeName, nodes[b].nodeName); }),
                    count: d3.range(n).sort(function(a, b) { return nodes[b].count - nodes[a].count; }),
                    group: d3.range(n).sort(function(a, b) { return nodes[b].group - nodes[a].group; })
                };

                // The default sort order.
                x.domain(orders.name);

                svg.append("rect")
                .attr("class", "background")
                .attr("width", width)
                .attr("height", height);

                var row = svg.selectAll(".row")
                .data(matrix)
                .enter().append("g")
                .attr("class", "row")
                .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
                .each(row);

                row.append("line")
                .attr("x2", width);

                row.append("text")
                .attr("x", -6)
                .attr("y", x.bandwidth() / 2)
                .attr("dy", ".3em")
                .attr("text-anchor", "end")
                .text(function(d, i) { return nodes[i].nodeName; });

                var column = svg.selectAll(".column")
                .data(matrix)
                .enter().append("g")
                .attr("class", "column")
                .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

                column.append("line")
                .attr("x1", -width);

                column.append("text")
                .attr("x", 6)
                .attr("y", x.bandwidth() / 2)
                .attr("dy", ".3em")
                .attr("text-anchor", "start")
                .text(function(d, i) { return nodes[i].nodeName; });

                function row(row) {
                    var cell = d3.select(this).selectAll(".cell")
                    .data(row.filter(function(d) { return d.z; }))
                    //.data(row)
                    .enter().append("rect")
                    .attr("class", "cell")
                    .attr("x", function(d) { return x(d.x); })
                    .attr("width", x.bandwidth())
                    .attr("height", x.bandwidth())
                    //.style("fill-opacity", function(d) { return z(d.z); })
                    .style("fill-opacity", function(d) { return 1; })

                    .style("fill", function(d) { return colorFunction(d.z); })
                    .attr('data-z', d => d.z)
                    .on('click', function(n) {
                        console.log('n.x', n.x, 'node', nodes[n.x]);
                        alert('source:'+ nodes[n.x].nodeName);
                    })
                    //.on("mouseover", mouseover)
                    //.on("mouseout", mouseout);
                }
                /*
                function mouseover(p) {
                    d3.selectAll(".row text").classed("active", function(d, i) { return i == p.y; });
                    d3.selectAll(".column text").classed("active", function(d, i) { return i == p.x; });
                }

                function mouseout() {
                    d3.selectAll("text").classed("active", false);
                }

                d3.select("#order").on("change", function() {
                    clearTimeout(timeout);
                    order(this.value);
                });

                function order(value) {
                    x.domain(orders[value]);

                    var t = svg.transition().duration(2500);

                    t.selectAll(".row")
                    .delay(function(d, i) { return x(i) * 4; })
                    .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
                    .selectAll(".cell")
                    .delay(function(d) { return x(d.x) * 4; })
                    .attr("x", function(d) { return x(d.x); });

                    t.selectAll(".column")
                    .delay(function(d, i) { return x(i) * 4; })
                    .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
                }

                var timeout = setTimeout(function() {
                    order("group");
                    d3.select("#order").property("selectedIndex", 2).node().focus();
                }, 5000);
                */
            });

    }
    componentWillUnmount() {
        AppStore.removeChangeListener(this.handleChange);
    }
    handleChange() {
        this.setState({stage: AppStore.getActiveStage()});
    }
    /**
     * @return {object}
     */
    render() {
        return (
            <section className="main-section">
                <section id="d3" className="d3">
                </section>
                Test
                <ColorBar />
            </section>
        );
    }

};
