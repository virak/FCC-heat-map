/* globals d3, alert */

const dataUrl = 'https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/global-temperature.json'

// -- Color palette
const colorbrewer = {
  RdYlBu: {
    3: ['#fc8d59', '#ffffbf', '#91bfdb'],
    4: ['#d7191c', '#fdae61', '#abd9e9', '#2c7bb6'],
    5: ['#d7191c', '#fdae61', '#ffffbf', '#abd9e9', '#2c7bb6'],
    6: ['#d73027', '#fc8d59', '#fee090', '#e0f3f8', '#91bfdb', '#4575b4'],
    7: ['#d73027', '#fc8d59', '#fee090', '#ffffbf', '#e0f3f8', '#91bfdb', '#4575b4'],
    8: ['#d73027', '#f46d43', '#fdae61', '#fee090', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4'],
    9: ['#d73027', '#f46d43', '#fdae61', '#fee090', '#ffffbf', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4'],
    10: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee090', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'],
    11: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee090', '#ffffbf', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695']
  },
  RdBu: {
    3: ['#ef8a62', '#f7f7f7', '#67a9cf'],
    4: ['#ca0020', '#f4a582', '#92c5de', '#0571b0'],
    5: ['#ca0020', '#f4a582', '#f7f7f7', '#92c5de', '#0571b0'],
    6: ['#b2182b', '#ef8a62', '#fddbc7', '#d1e5f0', '#67a9cf', '#2166ac'],
    7: ['#b2182b', '#ef8a62', '#fddbc7', '#f7f7f7', '#d1e5f0', '#67a9cf', '#2166ac'],
    8: ['#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac'],
    9: ['#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac'],
    10: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'],
    11: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061']
  }
}

d3.json(dataUrl, processData)

// -------------------------------------------------------------------------------------
// Main function
// -------------------------------------------------------------------------------------
function processData (error, jsonData) {
  if (error) {
    alert('Error during data loading')
  } else {
    jsonData.monthlyVariance.forEach((currentMonthData) => { currentMonthData.month -= 1 }) // reset month index to 0 to 11

    // -- Config variables
    const fontSize = 16
    const width = 5 * Math.ceil(jsonData.monthlyVariance.length / 12) // 1500;
    const height = 33 * 12 // 400;
    const padding = { left: 9 * fontSize, right: 9 * fontSize, top: 1 * fontSize, bottom: 8 * fontSize }
    const displayYearEvery = 20

    // -- Set up tool tip
    const tooltip = d3.tip()
      .attr('class', 'd3-tip')
      .attr('id', 'tooltip')
      .html(function (d) {
        return d
      })
      .direction('n')
      .offset([-10, 0])

    // -- SVG heat map graph container
    const svgContainer = d3.select('#graphContainer').append('svg')
      .attr({
        width: width + padding.left + padding.right,
        height: height + padding.top + padding.bottom
      })
      .call(tooltip)

    // -- Set up y axis
    const yScale = d3.scale.ordinal()
      .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) // months
      .rangeRoundBands([0, height], 0, 0)
    const yAxis = d3.svg.axis()
      .scale(yScale)
      .tickValues(yScale.domain())
      .tickFormat((month) => {
        const date = new Date(0)
        date.setUTCMonth(month)
        return d3.time.format.utc('%B')(date)
      })
      .orient('left')
      .tickSize(10, 1)

    svgContainer.append('g')
      .classed('y-axis', true)
      .attr('id', 'y-axis')
      .attr('transform', 'translate(' + padding.left + ',' + padding.top + ')')
      .call(yAxis)

    // -- Handle x axis
    const xScale = d3.scale.ordinal()
      .domain(jsonData.monthlyVariance.map(function (val) { return val.year }))
      .rangeRoundBands([0, width], 0, 0)
    const xAxis = d3.svg.axis()
      .scale(xScale)
      .tickValues(xScale.domain().filter(function (year) {
        return year % displayYearEvery === 0
      }))
      .tickFormat(function (year) {
        const date = new Date(0)
        date.setUTCFullYear(year)
        return d3.time.format.utc('%Y')(date)
      })
      .orient('bottom')
      .tickSize(10, 1)

    svgContainer.append('g')
      .classed('x-axis', true)
      .attr('id', 'x-axis')
      .attr('transform', 'translate(' + padding.left + ',' + (height + padding.top) + ')')
      .call(xAxis)

    // -- Handling legend display
    const legendColors = colorbrewer.RdYlBu[11].reverse()
    const legendWidth = 400
    const legendHeight = 300 / legendColors.length

    const variance = jsonData.monthlyVariance.map(function (val) {
      return val.variance
    })
    const minTemp = jsonData.baseTemperature + Math.min.apply(null, variance)
    const maxTemp = jsonData.baseTemperature + Math.max.apply(null, variance)

    const legendThreshold = d3.scale.threshold()
      .domain((function (min, max, count) {
        const array = []
        const step = (max - min) / count
        const base = min
        for (let i = 1; i < count; i++) {
          array.push(base + i * step)
        }
        return array
      })(minTemp, maxTemp, legendColors.length))
      .range(legendColors)

    const legendX = d3.scale.linear()
      .domain([minTemp, maxTemp])
      .range([0, legendWidth])

    const legendXAxis = d3.svg.axis()
      .scale(legendX)
      .orient('bottom')
      .tickSize(10, 0)
      .tickValues(legendThreshold.domain())
      .tickFormat(d3.format('.1f'))

    const legend = svgContainer.append('g')
      .classed('legend', true)
      .attr('id', 'legend')
      .attr('transform', 'translate(' + (padding.left) + ',' + (padding.top + height + padding.bottom - 2 * legendHeight) + ')')

    legend.append('g')
      .selectAll('rect')
      .data(legendThreshold.range().map(function (color) {
        const d = legendThreshold.invertExtent(color)
        if (d[0] == null) d[0] = legendX.domain()[0]
        if (d[1] == null) d[1] = legendX.domain()[1]
        return d
      }))
      .enter().append('rect')
      .style('fill', function (d, i) { return legendThreshold(d[0]) })
      .attr({
        x: function (d, i) { return legendX(d[0]) },
        y: 0,
        width: function (d, i) { return legendX(d[1]) - legendX(d[0]) },
        height: legendHeight
      })

    legend.append('g')
      .attr('transform', 'translate(' + 0 + ',' + legendHeight + ')')
      .call(legendXAxis)

    // -- Handle heat map display
    svgContainer.append('g')
      .classed('map', true)
      .attr('transform', 'translate(' + padding.left + ',' + padding.top + ')')
      .selectAll('rect')
      .data(jsonData.monthlyVariance)
      .enter().append('rect')
      .attr('class', 'cell')
      .attr('data-month', function (d) {
        return d.month
      })
      .attr('data-year', function (d) {
        return d.year
      })
      .attr('data-temp', function (d) {
        return jsonData.baseTemperature + d.variance
      })
      .attr({
        x: function (d, i) {
          return xScale(d.year)
        },
        y: function (d, i) {
          return yScale(d.month)
        },
        width: function (d, i) {
          return xScale.rangeBand(d.year)
        },
        height: function (d, i) {
          return yScale.rangeBand(d.month)
        }
      })
      .attr('fill', function (d, i) {
        return legendThreshold(jsonData.baseTemperature + d.variance)
      })
      .on('mouseover', function (d) {
        const date = new Date(d.year, d.month)
        const str = getToolTipHtmlContent(date, jsonData, d)
        tooltip.attr('data-year', d.year)
        tooltip.show(str)
      })
      .on('mouseout', tooltip.hide)
  }
}

// -------------------------------------------------------------------------------------
// Utils functions
// -------------------------------------------------------------------------------------
function getToolTipHtmlContent (date, jsonData, d) {
  return `<span class='date'>${d3.time.format('%Y - %B')(date)}</span><br />
  <span class='temperature'>${d3.format('.1f')(jsonData.baseTemperature + d.variance) + '&#8451;'}</span><br />
  <span class='variance'>${d3.format('+.1f')(d.variance) + '&#8451;'}</span>`
}
