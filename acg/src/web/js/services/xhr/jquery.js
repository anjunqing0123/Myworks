const xhr = ({ url, body = null, method = 'get', cb = null }) => {
  const defer = $.Deferred()

  $.ajax({
    type: method,
    url: url,
    data: body,
    cache : true,
    jsonp : cb,
    timeout : 30 * 1000
    // xhrFields: { // 跨域允许带上 cookie
    //   withCredentials: [域名]
    // }
  })
  .done(defer.resolve)
  .fail(defer.reject)

  return defer.promise()
}

export default xhr
