import axios from 'axios';
//See .env in upper folder for info on environment variable. It should be located in the folder containing the frontend folder.
const BASE_URI = `http://${process.env.REACT_APP_BACKEND_ADRESS}:${process.env.REACT_APP_BACKEND_PORT}`;
console.log(BASE_URI)
// Client that is used in every server request
const client = axios.create({
 baseURL: BASE_URI,
 json: true
});

// Call perform function with method, route and (if needed, e.g. POST) data 
class APIClient {  
  /*** ///  Maps to auth controller  /// ***/ 
  getAuth() {
    return this.perform('get', '/hasAuth');
  }

  login(user) {
    return this.perform('post', '/login', user);
  }
 
  logout() {
    this.perform('delete', '/logoutAccessToken').then(() => {
      console.log('done');
    })
  }
  
  /*** ///  Maps to user controller  /// ***/
  createUser(newUser) {
    return this.perform('post', '/user', newUser);
  }
 
  getUser(user) {
   return this.perform('get', '/user',user);
  }

  /*** ///  Maps to prediction controller  /// ***/
  submitPrediction(data) {
    return this.perform('post', '/submitPrediction', data);
  }
  
  predict(userData){
    return this.perform('post', '/predict', userData);
  }
  
  /*** ///  Maps to Queue controller  /// ***/  
  checkUserInQueue(userData){
    return this.perform('post', '/checkUserInQueue', userData);
  }
  
  removeJobFromQueue(userData){
    return this.perform('delete', '/removeJobFromQueue', userData);
  }
  
  /*** ///  Maps to patients controller  /// ***/
  getPatients() {
    return this.perform('get', '/patients');
  }
  
  getAttention(text){
    return this.perform('post', '/attention', text)
  }
  
  updatePatient(patient){
    return this.perform('post', '/updatePatient', patient)
  }

  /*** /// Mail /// ***/
  sendMail() {
    return this.perform('get', '/mail');
  }

  /*** /// Model /// ***/
  sendModelForm(formData){
   return this.perform('post','/uploadmodel',formData, 'multipart/form-data')
  }

  getModels(){
    return this.perform('get','/getmodels')
   }
  

  // Perform takes in the mehthod, route, data and creates a new client
  // Also gets the token from localStorage and adds it to the header of the request
  async perform (method, resource, data,contentType) {
    return client({
      method,
      url: resource,
      data,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': contentType || 'application/json',
        'Access-Control-Allow-Origin':'*'
      } 
    }).then(resp => {
      return resp.data ? resp.data : [];
    })
   }
}

export default APIClient;