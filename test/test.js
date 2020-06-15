/* global describe it */
const chai = require('chai')
const expect = chai.expect
const dirtyChai = require('dirty-chai')

chai.use(dirtyChai)

const asciidoctorChart = require('../src/asciidoctor-chart')
const asciidoctor = require('asciidoctor.js')()

describe('Registration', () => {
  it('should register the extension', () => {
    const registry = asciidoctor.Extensions.create()
    expect(registry['$block_macros?']()).to.be.false()
    expect(registry['$blocks?']()).to.be.false()
    asciidoctorChart.register(registry)
    expect(registry['$block_macros?']()).to.be.true()
    expect(registry['$blocks?']()).to.be.true()
    expect(registry['$registered_for_block_macro?']('chart')).to.be.an('object')
    expect(registry['$registered_for_block?']('chart', 'literal')).to.be.an('object')
  })
})

describe('Conversion', () => {
  describe('Block macro', () => {
    const chartBlockMacroInput = (target, attrs) => `chart::${target}[${(attrs || []).join(',')}]`
    const existingChartBlockMacroInput = attrs => chartBlockMacroInput('test/fixtures/sales.csv', attrs)
    const nonExistingChartBlockMacroInput = attrs => chartBlockMacroInput('test/fixtures/404.csv', attrs)
    const expectedResult = opts => `<div class="ct-chart" data-chart-height="${opts.height || 400}" data-chart-width="${opts.width || 600}" data-chart-type="${opts.type || 'Line'}" data-chart-colors="#72B3CC,#8EB33B" data-chart-labels="January,February,March" data-chart-series-0="28,48,40" data-chart-series-1="65,59,80"></div>`
    describe('When extension is not registered', () => {
      it('should not convert an existing csv file to a chart', () => {
        const input = existingChartBlockMacroInput()
        const html = asciidoctor.convert(input)
        expect(html).to.contain(input)
      })
      it('should not convert an non existing csv file to a chart', () => {
        const input = nonExistingChartBlockMacroInput()
        const html = asciidoctor.convert(input)
        expect(html).to.contain(input)
      })
    })
    describe('When extension is registered', () => {
      it('should convert a chart', () => {
        const input = existingChartBlockMacroInput()
        const registry = asciidoctor.Extensions.create()
        asciidoctorChart.register(registry)
        const html = asciidoctor.convert(input, { extension_registry: registry })
        expect(html).to.contain(expectedResult({}))
      })
      it('should return an error message if the file does not exist', () => {
        const input = nonExistingChartBlockMacroInput()
        const registry = asciidoctor.Extensions.create()
        asciidoctorChart.register(registry)
        const html = asciidoctor.convert(input, { extension_registry: registry })
        expect(html).to.contain('[file does not exist or cannot be read: test/fixtures/404.csv]')
      })
    })
    it('should convert a chart into a bar chart', () => {
      const input = existingChartBlockMacroInput(['bar'])
      const registry = asciidoctor.Extensions.create()
      asciidoctorChart.register(registry)
      const html = asciidoctor.convert(input, { extension_registry: registry })
      expect(html).to.contain(expectedResult({ type: 'Bar' }))
    })
    it('should convert a chart into a line chart with a width of 500px', () => {
      const input = existingChartBlockMacroInput(['width=500'])
      const registry = asciidoctor.Extensions.create()
      asciidoctorChart.register(registry)
      const html = asciidoctor.convert(input, { extension_registry: registry })
      expect(html).to.contain(expectedResult({ width: 500 }))
    })
    it('should convert a chart into a line chart with an height of 700px', () => {
      const input = existingChartBlockMacroInput(['height=700'])
      const registry = asciidoctor.Extensions.create()
      asciidoctorChart.register(registry)
      const html = asciidoctor.convert(input, { extension_registry: registry })
      expect(html).to.contain(expectedResult({ height: 700 }))
    })
    it('should convert a chart into a bar chart with a width of 500px and a height of 700px', () => {
      const input = existingChartBlockMacroInput(['bar', '500', '700'])
      const registry = asciidoctor.Extensions.create()
      asciidoctorChart.register(registry)
      const html = asciidoctor.convert(input, { extension_registry: registry })
      expect(html).to.contain(expectedResult({ type: 'Bar', width: 500, height: 700 }))
    })
  })

  const delimeters = ['....', '----']
  delimeters.forEach(delimeter => {
    describe(`Block with delimeter ${delimeter}`, () => {
      const chartBlockInput = attrs => `[${['chart'].concat(attrs || []).join(',')}]
${delimeter}
Java,JavaScript,Python
1.265,1.042,1.024
1.118,1.004,1.279
${delimeter}`
      const expectedResult = opts => `<div class="ct-chart" data-chart-height="${opts.height || 400}" data-chart-width="${opts.width || 600}" data-chart-type="${opts.type || 'Line'}" data-chart-colors="#72B3CC,#8EB33B" data-chart-labels="Java,JavaScript,Python" data-chart-series-0="1.265,1.042,1.024" data-chart-series-1="1.118,1.004,1.279"></div>`
      describe('When extension is not registered', () => {
        it('should not convert a block chart', () => {
          const input = chartBlockInput()
          const html = asciidoctor.convert(input)
          expect(html).to.contain(`<pre>Java,JavaScript,Python
1.265,1.042,1.024
1.118,1.004,1.279</pre>`)
        })
      })
      describe('When extension is registered', () => {
        it('should convert a chart', () => {
          const input = chartBlockInput()
          const registry = asciidoctor.Extensions.create()
          asciidoctorChart.register(registry)
          const html = asciidoctor.convert(input, { extension_registry: registry })
          expect(html).to.contain(expectedResult({}))
        })
        it('should not convert a chart if the series are empty', () => {
          const input = `[chart]
${delimeter}
${delimeter}`
          const registry = asciidoctor.Extensions.create()
          asciidoctorChart.register(registry)
          const html = asciidoctor.convert(input, { extension_registry: registry })
          expect(html).to.contain('[chart is empty]')
        })
      })
      it('should convert a chart into a bar chart', () => {
        const input = chartBlockInput(['bar'])
        const registry = asciidoctor.Extensions.create()
        asciidoctorChart.register(registry)
        const html = asciidoctor.convert(input, { extension_registry: registry })
        expect(html).to.contain(expectedResult({ type: 'Bar' }))
      })
      it('should convert a chart into a line chart with a width of 500px', () => {
        const input = chartBlockInput(['width=500'])
        const registry = asciidoctor.Extensions.create()
        asciidoctorChart.register(registry)
        const html = asciidoctor.convert(input, { extension_registry: registry })
        expect(html).to.contain(expectedResult({ width: '500' }))
      })
      it('should convert a chart into a line chart with an height of 700px', () => {
        const input = chartBlockInput(['height=700'])
        const registry = asciidoctor.Extensions.create()
        asciidoctorChart.register(registry)
        const html = asciidoctor.convert(input, { extension_registry: registry })
        expect(html).to.contain(expectedResult({ height: '700' }))
      })
      it('should convert a chart into a bar chart with a width of 500px and a height of 700px', () => {
        const input = chartBlockInput(['bar', '500', '700'])
        const registry = asciidoctor.Extensions.create()
        asciidoctorChart.register(registry)
        const html = asciidoctor.convert(input, { extension_registry: registry })
        expect(html).to.contain(expectedResult({ type: 'Bar', width: 500, height: 700 }))
      })
    })
  })
})
