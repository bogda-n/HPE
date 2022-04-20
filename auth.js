const axios = require('axios')

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