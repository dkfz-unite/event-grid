'use strict';
var d3 = require('d3');
var cloneDeep = require('lodash.clonedeep');
var MainGrid = require('./MainGrid');
var values = require('lodash.values');
var EventEmitter = require('eventemitter3');
var util = require('util');

var UniteOncoGrid = function(params) {
  var _self = this;
  params.emit = _self.emit.bind(this);
  _self.params = params;
  _self.inputWidth = params.width || 500;
  _self.width = _self.inputWidth;
  _self.minCellHeight = params.minCellHeight || 10;
  _self.inputHeight = params.height || 500;

  _self.height = _self.inputHeight;
  if (_self.height / params.genes.length < _self.minCellHeight) {
    _self.height = params.genes.length * _self.minCellHeight;
  }

  _self.prefix = params.prefix || 'og-';

  params.wrapper = '.' + _self.prefix + 'container';

  _self.container = d3.select(params.element || 'body')
      .append('div')
      .attr('class', _self.prefix + 'container')
      .style('position', 'relative');

  _self.initCharts();
  EventEmitter.call(this);
};

util.inherits(UniteOncoGrid, EventEmitter);

UniteOncoGrid.prototype.initCharts = function(reloading) {
  var _self = this;

  _self.clonedParams = cloneDeep(_self.params);

  _self.donors = _self.clonedParams.donors || [];
  _self.genes = _self.clonedParams.genes || [];

  _self.ssmObservations = _self.clonedParams.ssmObservations || [];
  _self.cnvObservations = _self.clonedParams.cnvObservations || [];
  _self.observations = _self.ssmObservations.concat(_self.cnvObservations) || [];
  _self.types = [];

  if (_self.cnvObservations.length) { _self.types.push('cnv'); }
  if (_self.ssmObservations.length) { _self.types.push('mutation'); }

  _self.createLookupTable();
  _self.computeDonorCounts();
  _self.computeGeneScoresAndCount();
  _self.genesSortbyScores();
  _self.computeScores();
  _self.sortByScores();
  _self.calculatePositions();

  if(reloading) {
    _self.clonedParams.width = _self.width;
    _self.clonedParams.height = _self.height;
  }

  _self.mainGrid = new MainGrid(_self.clonedParams, _self.lookupTable, _self.update(_self), function() {
    _self.resize(_self.width, _self.height, _self.fullscreen);
  }, _self.x, _self.y);

  _self.heatMapMode = _self.mainGrid.heatMap;
  _self.drawGridLines = _self.mainGrid.drawGridLines;
  _self.crosshairMode = _self.mainGrid.crosshair;

  _self.charts = [];
  _self.charts.push(_self.mainGrid);
};

UniteOncoGrid.prototype.calculatePositions = function () {
  var _self = this;

  var getX = d3.scale.ordinal()
      .domain(d3.range(_self.donors.length))
      .rangeBands([0, _self.width]);

  for (var t = 0, type; t < _self.types.length; t++) {
    type = _self.types[t];
    for(var i = 0, donor, donorId, x; i < _self.donors.length; i += 1) {
      donor = _self.donors[i];
      donorId = donor.id;

      x = getX(i);
      donor.x = x;

      _self.lookupTable[type][donorId] = _self.lookupTable[type][donorId] || {};
      _self.lookupTable[type][donorId].x = x;
    }
  }

  var getY = d3.scale.ordinal()
      .domain(d3.range(_self.genes.length))
      .rangeBands([0, _self.height]);

  for(var i = 0; i < _self.genes.length; i += 1) {
    _self.genes[i].y = getY(i);
  }

  _self.y = getY;
  _self.x = getX;
};

UniteOncoGrid.prototype.createLookupTable = function () {
  var _self = this;
  var lookupTable = {};

  for (var i = 0; i < _self.observations.length; i++) {
    var obs = _self.observations[i];
    var donorId = obs.donorId;
    var geneId = obs.geneId;
    var type = obs.type;

    if (lookupTable.hasOwnProperty(type)) {
      if (lookupTable[type].hasOwnProperty(donorId)) {
        if (lookupTable[type][donorId].hasOwnProperty(geneId)) {
          lookupTable[type][donorId][geneId].push(obs.ids);
        } else {
          lookupTable[type][donorId][geneId] = [obs.ids];
        }
      } else {
        lookupTable[type][donorId] = {};
        lookupTable[type][donorId][geneId] = [obs.ids];
      }
    } else {
      lookupTable[type] = {};
      lookupTable[type][donorId] = {};
      lookupTable[type][donorId][geneId] = [obs.ids];
    }
  }

  _self.lookupTable = lookupTable;
};

UniteOncoGrid.prototype.render = function() {
  var _self = this;

  _self.emit('render:all:start');
  setTimeout(function () {
    _self.charts.forEach(function(chart) {
      chart.render();
    });
    _self.emit('render:all:end');
  });
};

UniteOncoGrid.prototype.update = function(scope) {
  var _self = scope;

  return function(donorSort) {
    donorSort = (typeof donorSort === 'undefined' || donorSort === null) ? false: donorSort;

    if (donorSort) {
      _self.computeScores();
      _self.sortByScores();
    }

    _self.calculatePositions();

    _self.charts.forEach(function (chart) {
      chart.update(_self.x, _self.y);
    });
  };
};

UniteOncoGrid.prototype.resize = function(width, height, fullscreen) {
  var _self = this;

  _self.fullscreen = fullscreen;
  _self.mainGrid.fullscreen = fullscreen;
  _self.width = Number(width);
  _self.height = Number(height);

  if (_self.height / _self.genes.length < _self.minCellHeight) {
    _self.height = _self.genes.length * _self.minCellHeight;
  }

  _self.calculatePositions();

  _self.charts.forEach(function (chart) {
    chart.fullscreen = fullscreen;
    chart.resize(_self.width, _self.height, _self.x, _self.y);
  });
};

UniteOncoGrid.prototype.sortByScores = function() {
  var _self = this;
  _self.donors.sort(_self.sortScore);
};

UniteOncoGrid.prototype.genesSortbyScores = function() {
  var _self = this;
  _self.genes.sort(_self.sortScore);
};

UniteOncoGrid.prototype.cluster = function() {
  var _self = this;

  _self.genesSortbyScores();
  _self.computeScores();
  _self.sortByScores();
  _self.update(_self)();
};

UniteOncoGrid.prototype.removeDonors = function(func) {
  var _self = this;

  var removedList = [];

  for (var i = 0; i < _self.donors.length; i++) {
    var donor = _self.donors[i];
    if (func(donor)) {
      removedList.push(donor.id);
      d3.selectAll('.' + _self.prefix + donor.id + '-cell').remove();
      d3.selectAll('.' + _self.prefix + donor.id + '-bar').remove();
      _self.donors.splice(i, 1);
      i--;
    }
  }

  for (var j = 0; j < _self.observations.length; j++) {
    var obs = _self.observations[j];
    if (_self.donors.indexOf(obs.id) >= 0) {
      _self.observations.splice(j, 1);
      j--;
    }
  }

  _self.computeGeneScoresAndCount();
  _self.update(_self)();
  _self.resize(_self.width, _self.height, false);
};

UniteOncoGrid.prototype.removeGenes = function(func) {
  var _self = this;

  var removedList = [];

  for (var i = 0; i < _self.genes.length; i++) {
    var gene = _self.genes[i];
    if (func(gene)) {
      removedList.push(gene.id);
      d3.selectAll('.' + _self.prefix + gene.id + '-cell').remove();
      d3.selectAll('.' + _self.prefix + gene.id + '-bar').remove();
      _self.genes.splice(i, 1);
      i--;
    }
  }

  _self.update(_self)();
  _self.resize(_self.width, _self.height, false);
};

UniteOncoGrid.prototype.sortDonors = function(func) {
  var _self = this;
  _self.donors.sort(func);
  _self.update(_self)();
};

UniteOncoGrid.prototype.sortGenes = function(func) {
  var _self = this;
  _self.computeScores();
  _self.sortByScores();
  _self.genes.sort(func);
  _self.update(_self)();
};

UniteOncoGrid.prototype.setHeatmap = function(active) {
  var _self = this;
  _self.heatMapMode = active;
  _self.mainGrid.setHeatmap(active);
};

UniteOncoGrid.prototype.toggleHeatmap = function() {
  var _self = this;
  _self.setHeatmap(!_self.heatMapMode);
};

UniteOncoGrid.prototype.setGridLines = function(active) {
  var _self = this;
  _self.drawGridLines = active;
  _self.mainGrid.setGridLines(active);
};

UniteOncoGrid.prototype.toggleGridLines = function() {
  var _self = this;
  _self.setGridLines(!_self.drawGridLines);
};

UniteOncoGrid.prototype.setCrosshair = function(active) {
  var _self = this;
  _self.crosshairMode = active;
  _self.mainGrid.setCrosshair(active);
};

UniteOncoGrid.prototype.toggleCrosshair = function() {
  var _self = this;
  _self.setCrosshair(!_self.crosshairMode);
};

UniteOncoGrid.prototype.mutationScore = function(donor, gene) {
  var _self = this;
  var mutationTable = _self.lookupTable['mutation'] || {};
  if (mutationTable.hasOwnProperty(donor) && mutationTable[donor].hasOwnProperty(gene)) {
    return 1;
  } else {
    return 0;
  }
};

UniteOncoGrid.prototype.mutationGeneScore = function(donor, gene) {
  var _self = this;
  var mutationTable = _self.lookupTable['mutation'] || {};
  if (mutationTable.hasOwnProperty(donor) && mutationTable[donor].hasOwnProperty(gene)) {
    var totalGenes = [].concat.apply([], mutationTable[donor][gene]);
    return totalGenes.length;
  } else {
    return 0;
  }
};

UniteOncoGrid.prototype.computeScores = function() {
  var _self = this;

  for (var i = 0; i < _self.donors.length; i++) {
    var donor = _self.donors[i];
    donor.score = 0;
    for (var j = 0; j < _self.genes.length; j++) {
      var gene = _self.genes[j];
      donor.score += (_self.mutationScore(donor.id, gene.id) * Math.pow(2, _self.genes.length + 1 - j));
    }
  }
};

UniteOncoGrid.prototype.computeGeneScoresAndCount = function() {
  var _self = this;

  for (var i = 0; i < _self.genes.length; i++) {
    var gene = _self.genes[i];
    gene.score = _self.genes.length - i;
    for (var j = 0; j < _self.donors.length; j++) {
      var donor = _self.donors[j];
      //gene.score += _self.mutationGeneScore(donor.id, gene.id);
    }
    gene.count = gene.score;
  }
};

UniteOncoGrid.prototype.computeDonorCounts = function() {
  var _self = this;
  var mutationTable = _self.lookupTable['mutation'] || {};
  for (var i = 0; i < _self.donors.length; i++) {
    var donor = _self.donors[i];
    var genes = [].concat.apply([], values(mutationTable[donor.id] || {}));
    donor.count = 0;
    for(var j = 0; j < genes.length; j++) {
      donor.count += genes[j].length;
    }
  }
};

UniteOncoGrid.prototype.computeGeneCounts = function() {
  var _self = this;

  for (var i = 0; i < _self.genes.length; i++) {
    var gene = _self.genes[i];
    gene.count = 0;
    for (var j = 0; j < _self.observations.length; j++) {
      var obs = _self.observations[j];
      if (gene.id === obs.geneId) {
        gene.count += 1;
      }
    }
  }
};

UniteOncoGrid.prototype.sortScore = function(a, b) {
  if (a.score < b.score) {
    return 1;
  } else if (a.score > b.score) {
    return -1;
  } else {
    return a.id >= b.id ? 1: -1;
  }
};

UniteOncoGrid.prototype.destroy = function() {
  var _self = this;

  _self.charts.forEach(function (chart) {
    chart.destroy();
  });
  _self.container.remove();
};

UniteOncoGrid.prototype.reload = function() {
  var _self = this;

  _self.charts.forEach(function (chart) {
    chart.destroy();
  });
  _self.initCharts(true);
  _self.render();
};

module.exports = UniteOncoGrid;