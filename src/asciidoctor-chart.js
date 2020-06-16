const generateChart = function (data, labels, attrs) {
  return createDiv(data, labels, attrs)
}

const createDiv = function (data, labels, attrs) {
  const series = data.map((value, index) => `data-chart-series-${index}="${value.join(',')}"`)
  const title = attrs.title ? `<div class="title">${attrs.title}</div>\n` : ''
  const chartHeight = `data-chart-height="${getHeight(attrs)}" `
  const chartWidth = `data-chart-width="${getWidth(attrs)}" `
  const chartType = `data-chart-type="${getType(attrs)}" `
  const chartColors = 'data-chart-colors="#72B3CC,#8EB33B" '
  const chartLabels = `data-chart-labels="${labels.join(',')}" `
  return `<div class="openblock">${title}<div class="ct-chart" ${chartHeight}${chartWidth}${chartType}${chartColors}${chartLabels}${series.join(' ')}></div>
</div>`
}

const getHeight = function (attrs) {
  const height = attrs.height
  return typeof height === 'string' ? height : '400'
}

const getWidth = function (attrs) {
  const width = attrs.width
  return typeof width === 'string' ? width : '600'
}

const getType = function (attrs) {
  const type = attrs.type
  if (type === 'bar') {
    return 'Bar'
  } else if (type === 'line') {
    return 'Line'
  } else {
    // By default chart line
    return 'Line'
  }
}

const chartBlockMacro = function () {
  const self = this

  self.named('chart')
  self.positionalAttributes(['type', 'width', 'height'])

  self.process(function (parent, target, attrs) {
    const filePath = parent.normalizeAssetPath(target, 'target')
    const fileContent = parent.readAsset(filePath, { warn_on_failure: true, normalize: true })
    if (typeof fileContent === 'string') {
      const lines = fileContent.split('\n')
      const labels = lines[0].split(',')
      lines.shift()
      const data = lines.map(line => line.split(','))
      const html = generateChart(data, labels, attrs)
      return self.createBlock(parent, 'pass', html, attrs, {})
    }
    return self.createBlock(parent, 'pass', `<div class="openblock">[file does not exist or cannot be read: ${target}]</div>`, attrs, {})
  })
}

const chartBlock = function () {
  const self = this

  self.named('chart')
  self.positionalAttributes(['type', 'width', 'height'])
  self.$content_model('raw')
  self.onContext(['listing', 'literal'])

  self.process(function (parent, reader, attrs) {
    const lines = reader.getLines()
    if (lines && lines.length === 0) {
      return self.createBlock(parent, 'pass', '<div class="openblock">[chart is empty]</div>', attrs, {})
    }
    const labels = lines[0].split(',')
    lines.shift()
    const data = lines.map(line => line.split(','))
    const html = generateChart(data, labels, attrs)
    return self.createBlock(parent, 'pass', html, attrs, {})
  })
}

module.exports.register = function register (registry) {
  if (typeof registry.register === 'function') {
    registry.register(function () {
      this.block(chartBlock)
      this.blockMacro(chartBlockMacro)
    })
  } else if (typeof registry.block === 'function') {
    registry.block(chartBlock)
    registry.blockMacro(chartBlockMacro)
  }
  return registry
}
