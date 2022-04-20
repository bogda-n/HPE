import axios from 'axios'

//** Get name return id category **//

export async function getCategoryIdByName(sessionId, categoryName) {

  const url = `https://bo.icecat.biz/restful/v2/category?access_key=${sessionId}&query=${categoryName}&type=suggestion`
  const resp = await axios.get(url)
  const data = resp.data.Data.filter(category => category.Name.trim().toLowerCase() === categoryName.trim().toLowerCase())
  return data[0].CategoryId
}

export async function getfamiliesByCategoryId(sessionId, categoryId) {
  const familyUrl = `https://bo.icecat.biz/restful/v2/productfamily?brand_id=1&category_id=${categoryId}&access_key=${sessionId}&type=general`
  const response = await axios.get(familyUrl)
  return response.data.Data
}

export async function getSeriesByFamilyId(sessionId, familyId) {
  const seriesIdUrl = `https://bo.icecat.biz/restful/v2/productseries?brand_id=1&family_id=${familyId}&access_key=${sessionId}&type=general`
  const response = await axios.get(seriesIdUrl)
  return response.data.Data
}

export async function getMmoByProductId(sessionId, idProduct) {
  const url = `https://bo.icecat.biz/restful/v3/multimedia/${idProduct}?AccessKey=${sessionId}`

  const response = await axios.get(url)
  return response.data
}

export async function getProductStoryByProductId(sessionId, idProduct) {
  const url = `https://bo.icecat.biz/restful/v3/multimedia/${idProduct}?AccessKey=${sessionId}`

  const response = await axios.get(url)
  const mmo = response.data
  const productStory = mmo.filter(prodStory => prodStory.Type === 'ProductStory')

  return productStory
}

export async function updateProductStory(sessionId, idProduct, Uuid) {
  const url = `https://bo.icecat.biz/restful/v3/multimedia/${idProduct}?AccessKey=${sessionId}`
  const data = {
    "Uuid": Uuid,
    "IsPrivate": true
  }
  try {
    const response = await axios.patch(url, data)

    return response
  } catch (e) {

    console.log('Error', e.response.status)
    //throw new Error(e)
  }
}

