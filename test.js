const string = 'Cable HPE externo Mini SAS de alta densidad a Mini SAS, 0,5 m'
const newStr = string.replace(/\d+,\d+/, (regExp) => {
  return regExp.replace(',', '.')
})
console.log(newStr)