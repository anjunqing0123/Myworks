import xhr from './xhr/'

/**
 * 对应后端涉及到用户认证的API
 */
class ModelService {

  fetch (type,_url,body = null, method = 'get') {
    xhr({ url:_url,body,method })
    .then(data => {
      return data;
    },err =>{
      return err;
    });
    return null;
  }
}

// 单例模式
export default new ModelService()
