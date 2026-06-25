'use strict';

var d3 = require('d3');

function getRowsObservationStats(type, accountableConsequences, rows, observations, lookupTable) {
    let stats = [];
    let columns = lookupTable[type];

    if (!columns) return stats;

    for (let row of rows) {
        let stat = {};

        for (let consequence of accountableConsequences) {
            stat[consequence] = 0;
        }

        for (let columnId in columns) {
            let column = columns[columnId];
            let observationIds = column[row.id];

            if (!observationIds) continue;

            for (let observationIds2 of observationIds) {
                for (let observationId of observationIds2) {
                    let observation = observations[observationId];
                    if (!observation) continue;
                    let consequence = observation.consequence;
                    if (accountableConsequences.includes(consequence)) {
                        stat[consequence]++;
                    }
                }
            }
        }

        stat.row = row;
        stats.push(stat);
    }

    return stats;
}

function drawBars(_self, stats) {
    var consequenceColors = _self.consequenceColors || {};

    for (var i = 0; i < stats.length; i++) {
        var stat = stats[i];
        var row = stat.row;
        var yPos = row.y;

        // calculate total count for this row across all consequences
        var totalCount = 0;
        for (var c = 0; c < _self.accountableConsequences.length; c++) {
            totalCount += stat[_self.accountableConsequences[c]];
        }

        if (totalCount === 0) continue;

        // scale total width to histogramWidth based on topCount
        var totalBarWidth = (_self.histogramWidth * totalCount) / _self.topCount;

        var xOffset = _self.lineHeightOffset;

        for (var c = 0; c < _self.accountableConsequences.length; c++) {
            var consequence = _self.accountableConsequences[c];
            var count = stat[consequence];

            if (count === 0) continue;

            // each segment is a proportion of the total bar width
            var barWidth = (totalBarWidth * count) / totalCount;

            _self.chart.append('rect')
                .attr('class', _self.prefix + 'summary-bar ' + _self.prefix + row.id + '-summary-bar')
                .attr('x', xOffset)
                .attr('y', yPos)
                .attr('width', barWidth)
                .attr('height', _self.barHeight - (_self.barHeight < 3 ? 0 : 1))
                .attr('fill', consequenceColors[consequence] || '#ccc')
                .attr('data-row-id', row.id)
                .attr('data-consequence', consequence)
                .attr('data-count', count);

            xOffset += barWidth;
        }
    }
}

var RowsSummaryChart = function (params, svgElement, type, observations, lookupTable) {
    var _self = this;

    _self.accountableConsequences = params.accountableConsequences;
    _self.observations = {};
    if (Array.isArray(observations)) {
        for (var i = 0; i < observations.length; i++) {
            var obs = observations[i];
            _self.observations[obs.id] = obs;
        }
    } else {
        _self.observations = observations;  // already a map
    }
    _self.lookupTable = lookupTable;
    _self.prefix = params.prefix || 'og-';
    _self.emit = params.emit;
    _self.svg = svgElement;
    _self.type = type || 'mutation';
    _self.domain = params.genes || [];

    var histogramBorderPadding = params.histogramBorderPadding || {};
    _self.lineWidthOffset = histogramBorderPadding.left || 10;
    _self.lineHeightOffset = histogramBorderPadding.bottom || 5;
    _self.padding = 20;
    _self.margin = params.margin || {top: 30, right: 15, bottom: 15, left: 80};
    _self.centerText = -6;

    _self.width = params.width || 500;
    _self.height = params.height || 500;

    _self.histogramWidth = 40;  // width of the bar chart area in pixels
    _self.barHeight = _self.height / _self.domain.length;

    _self.totalWidth = _self.histogramWidth + _self.lineWidthOffset + _self.padding;

    _self.consequenceColors = params.colorMap && params.colorMap[type] ? params.colorMap[type] : {};
};

RowsSummaryChart.prototype.render = function () {
    var _self = this;

    var stats = getRowsObservationStats(
        _self.type,
        _self.accountableConsequences,
        _self.domain,
        _self.observations,
        _self.lookupTable
    );

    // find largest single consequence count for scaling
    var topCount = 1;
    for (var i = 0; i < stats.length; i++) {
        var stat = stats[i];
        let statTotal = 0;
        for (var c = 0; c < _self.accountableConsequences.length; c++) {
            let consequence = _self.accountableConsequences[c];
            statTotal += stat[consequence];
        }

        topCount = Math.max(topCount, statTotal);
    }
    _self.topCount = topCount;

    // container sits to the right of the grid at x = _self.width
    _self.container = _self.svg.append('g')
        .attr('class', _self.prefix + 'rows-summary-chart');

    console.log("_self.width: ", _self.width);
    console.log("_self.lineWidthOffset: ", _self.lineWidthOffset);

    _self.chart = _self.container.append('g')
        .attr('transform', 'translate(' + (_self.width + _self.lineWidthOffset) + ',0)');

    drawBars(_self, stats);
    _self.renderAxis(topCount);

    // events
    _self.chart
        .on('mouseover', function () {
            var target = d3.event.target;
            if (!target.dataset.rowId) return;
            _self.emit('rowsSummaryMouseOver', {
                rowId: target.dataset.rowId,
                consequence: target.dataset.consequence,
                count: target.dataset.count
            });
        })
        .on('mouseout', function () {
            _self.emit('rowsSummaryMouseOut');
        })
        .on('click', function () {
            var target = d3.event.target;
            if (!target.dataset.rowId) return;
            _self.emit('rowsSummaryClick', {
                rowId: target.dataset.rowId,
                consequence: target.dataset.consequence
            });
        });
};

RowsSummaryChart.prototype.renderAxis = function (topCount) {
    var _self = this;

    // vertical axis line on left edge of chart
    _self.leftAxis = _self.chart.append('line')
        .attr('class', _self.prefix + 'histogram-axis');

    // horizontal axis line at bottom of chart
    _self.bottomAxis = _self.chart.append('line')
        .attr('class', _self.prefix + 'histogram-axis');

    // top count label at right end
    _self.topText = _self.chart.append('text')
        .attr('class', _self.prefix + 'label-text-font')
        .attr('dy', '.32em')
        .attr('text-anchor', 'start');

    // half count label in middle
    _self.middleText = _self.chart.append('text')
        .attr('class', _self.prefix + 'label-text-font')
        .attr('dy', '.32em')
        .attr('text-anchor', 'middle');

    // axis label
    _self.topLabel = _self.chart.append('text')
        .text('Alterations')
        .attr('class', _self.prefix + 'label-text-font')
        .attr('text-anchor', 'middle');

    _self.updateAxis(topCount);
};

RowsSummaryChart.prototype.updateAxis = function (topCount) {
    var _self = this;

    // vertical left axis
    _self.leftAxis
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', 0)
        .attr('y2', _self.height + _self.lineHeightOffset);

    // horizontal bottom axis
    _self.bottomAxis
        .attr('x1', 0)
        .attr('x2', _self.histogramWidth + _self.lineWidthOffset)
        .attr('y1', _self.height + _self.lineHeightOffset)
        .attr('y2', _self.height + _self.lineHeightOffset);

    // top count label at right end of axis
    _self.topText
        .attr('x', _self.histogramWidth + 2)
        .attr('y', _self.height + _self.lineHeightOffset + 10)  // 10px below axis
        .text(topCount);

    // half count label
    var halfInt = Math.floor(topCount / 2);
    var halfWidth = (_self.histogramWidth * halfInt) / topCount;

    _self.middleText
        .attr('x', halfWidth)
        .attr('y', _self.height + _self.lineHeightOffset + 10)
        .text(halfInt);

    // axis title above chart
    _self.topLabel
        .attr('x', _self.histogramWidth / 2)
        .attr('y', _self.centerText);
};

RowsSummaryChart.prototype.update = function (domain) {
    var _self = this;
    _self.domain = domain;
    _self.barHeight = _self.height / _self.domain.length;

    _self.chart.selectAll('.' + _self.prefix + 'summary-bar').remove();

    var stats = getRowsObservationStats(
        _self.type,
        _self.accountableConsequences,
        _self.domain,
        _self.observations,
        _self.lookupTable
    );

    drawBars(_self, stats);
    _self.updateAxis(_self.topCount);
};

RowsSummaryChart.prototype.resize = function (width, height) {
    var _self = this;

    _self.width = width;
    _self.height = height;
    _self.barHeight = _self.height / _self.domain.length;

    _self.chart
        .attr('transform', 'translate(' + (_self.width + _self.lineWidthOffset) + ',0)');

    _self.update(_self.domain);
};

RowsSummaryChart.prototype.destroy = function () {
    var _self = this;
    _self.container.remove();
};

module.exports = RowsSummaryChart;