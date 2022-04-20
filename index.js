const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs-extra')
const path = require('path')
const { default: PQueue } = require('p-queue')
const excelToJson = require('simple-excel-to-json')
const xlsx = require('xlsx')

async function auth() {

  const superbogdan = {
    'Login': 'superbogdan_p',
    'Password': '7?G8C)LfL"5#b[r$',
    'SessionType': 'Perl'
  }
  const supermikhail = {
    'Login': 'supermikhail',
    'Password': 'Shved1978!',
    'SessionType': 'Perl'
  }
  const response = await axios.post('https://bo.icecat.biz/restful/v3/Session', supermikhail)
  return response.data['Data']['SessionId']
}


const icecatTextUrl = 'https://bo.icecat.biz/restful/v3'
const icecatLocalNameUrl = 'https://bo.icecat.biz/restful/v2/productmodelname'

const hpeUrl = 'https://buy.hpe.com/es/es/search/?text='

const icecatEsLangId = 6

const fileName = '1.xlsx'
const file = excelToJson.parseXls2Json(path.resolve(__dirname, '_input', fileName))

const products = []

const createReport = async () => {
  console.log('start create file report')
  const workBook = xlsx.utils.book_new()
  const workSheet = xlsx.utils.json_to_sheet(products)

  const outputDir = path.resolve(__dirname, '_outputs')
  await fs.ensureDir(outputDir)

  xlsx.utils.book_append_sheet(workBook, workSheet, 'result')
  xlsx.writeFile(workBook, `${outputDir}/result_${fileName}`)
  console.log('report is created')
}

const main = async (sku, productId) => {
  const icecatKey = await auth()
  return new Promise(async (resolve, reject) => {

    const product = {}

    const outputObject = {}
    const productTextObject = {}
    const bottomTextArr = []

    const url = `${hpeUrl}${sku}`
    try {
      const response = await axios.get(url)
      console.log('processing', url)
      const $ = cheerio.load(response.data)
      const title = $('h1').text().trim().replace(/\d+,\d+/, (regExp) => {
        return regExp.replace(',', '.')
      })
      if ($('.hpe-product-description__text').text().trim().length) {
        const textString = $('.hpe-product-description__text').text().trim()
        outputObject[title] = textString
      } else if (!$('.hpe-product-description__text').text().trim().length) {
        $('.hpe-more-information__columns.row').each(async (idx, element) => {

          $(element).find('.flex-adapt-width').each(async (idx, column) => {

            // Get Header
            const head = `<b>${$(column).find('h3').text()}</b>`
            const bodyArr = []
            $(column).find('p').each(async (idx, bodyP) => {
              //Get Body
              const paragraph = $(bodyP).text()
              bodyArr.push(paragraph)
            })
            productTextObject[head] = bodyArr.join('\n')
          })
          //Get Bottom text
          const bottomText = $(element).children('.col-md-12').text().trim()
          if (bottomText.length > 1) {
            bottomTextArr.push(bottomText)
          }
        })
        const productTextArr = []
        for (const key in productTextObject) {
          productTextArr.push(key)
          productTextArr.push(productTextObject[key])
        }

        const textString = (productTextArr.join('\n\n') + '\n\n' + bottomTextArr.join('')).trim()
        outputObject[title] = textString
      } else {
        outputObject[title] = ''
      }

      product['SKU'] = sku
      console.log()
      if (title === 'SEARCH' || title === '') {
        product['ProductTitle'] = 'Not found'
        console.log(sku, 'Not found')
      } else {
        product['ProductTitle'] = title
        product['ProductLPN'] = title
        product['Text'] = outputObject[title]
        product['Url'] = 'https://buy.hpe.com/'

        const productTextData = {
          "ProductId": +productId,
          "PolicyName": "CreateOrReplace",
          "Batch": [
            {
              "LanguageId": icecatEsLangId,
              "ShortDescription": product.ProductLPN,
              "LongDescription": product.Text,
              "OfficialUrl": product.Url
            }]
        }
        try {
          const requestText = await axios.put(`${icecatTextUrl}/ProductDescriptions?AccessKey=${icecatKey}`, productTextData)
          console.log('Text -', sku ,requestText.status, requestText.statusText)

          const icecatLocalNameFullUrl = `${icecatLocalNameUrl}/${productId}?access_key=${icecatKey}&lang_id=${icecatEsLangId}`
          const getProductTitle = await axios.get(`${icecatLocalNameUrl}/${productId}?access_key=${icecatKey}`)
          if (getProductTitle.data['product_model_name_local'].length) {
            for (const esLocalName of getProductTitle.data['product_model_name_local']) {
              if (esLocalName['langid'] === '6') {
                const requestLocalName = await axios.patch(icecatLocalNameFullUrl, { name: product.ProductTitle })
                console.log('Local name -', sku, requestLocalName.status, requestLocalName.statusText)
              }
            }
          } else {
              const requestLocalName = await axios.post(icecatLocalNameFullUrl, { name: product.ProductTitle })
              console.log('Local name -', sku, requestLocalName.status, requestLocalName.statusText)
            }

        } catch (e) {
          console.log('\nError', sku, e.response.statusText, e.response.status, '\n')
          if (e.response.status !== 304) {
            throw new Error(e)
          }
        }
      }
      products.push(product)


    } catch (e) {
      if (e.response?.status !== 504) {
        throw new Error(e)
      }
      console.error(e.message, '-', sku)

    }

    console.log('end processing', sku)
    resolve()
  })
}


const start = async () => {
  try {
    const queue = new PQueue({ concurrency: 20 })
    queue.on('add', () => {
      console.log(`Task is added.  Size: ${queue.size}  Pending: ${queue.pending}`)
    })
    queue.on('next', () => {
      console.log(`Task is completed.  Size: ${queue.size}  Pending: ${queue.pending}`)
      createReport()
    })
    queue.on('idle', () => {
      console.log('queue is clean', new Date())

    })
    let num = 0
    for (let sku of file[0]) {
      if (sku.mpn.length > 1) {
        queue.add(() => main(sku.mpn, sku.productId))
      }
    }

  } catch (error) {
    console.error(error)
  }
}

start()