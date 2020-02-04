import React from "react";
import './Login.css';
import APIClient from '../../Actions/apiClient';

import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

import { withTranslation } from 'react-i18next';

class Login extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
      username: '',
      password: '',  
      wrongCredentials: false,
      otherError: false
    };
    
    this.handleInputChange = this.handleInputChange.bind(this);
	}

  async componentDidMount() {
    this.apiClient = new APIClient();  
  }
 
  handleInputChange = (event) => {
    const { value, name } = event.target;
    this.setState({
      [name]: value
    });  
  }
  
  resetIndicators = () => {
    return this.setState({  
      wrongCredentials: false,
      otherError: false
    });
  }
  
  onSubmit = (event) => {
    event.preventDefault();
    this.resetIndicators();
    
    let user = {
      username: this.state.username,
      password: this.state.password
    }
    
    this.apiClient.login(user)
    .then(res => {
      localStorage.setItem('token', res.data.token);
      var {from} = this.props.location.state || {from: {pathname: '/'}}
      this.props.history.push(from); 
      window.location.reload()
    }).catch((err) => {console.log(err)
      if (err.response.status === 401) {
        this.setState({
          wrongCredentials: true
        })
        return;
      }
      this.setState({
        otherError: true
      })
    })
  }  

	render () {
    const { t } = this.props;
    return (
        <div className="container">
          <div className="container-fluid" id = 'form-container'>
          
            <Form className='log-in-form col-8 col-centered' onSubmit={this.onSubmit}>
          
              <Form.Group controlId="formBasicUsername">
                <Form.Label>{t('login.username')}</Form.Label>
                <Form.Control 
                  type="username" 
                  placeholder={t('login.usernameplaceholder')}
                  name='username' 
                  value={this.state.username}
                  onChange={this.handleInputChange}
                  required
                />
              </Form.Group>
            
              <Form.Group>
                <Form.Label>{t('login.password')}</Form.Label>
                <Form.Control 
                  type="password" 
                  placeholder={t('login.passwordplaceholder')} 
                  name='password'
                  value={this.state.password}
                  onChange={this.handleInputChange}
                  required
                />
                
                <p className={'login-error ' + (this.state.wrongCredentials ? 'show' : 'hidden')}>
                  {t('login.passwordcredentialerror')}  
                </p>
                <p className={'login-error ' + (this.state.otherError ? 'show' : 'hidden')}>
                  {t('login.othererror')}
                </p>
                
              </Form.Group>
              
              <Button type="submit">
                {t('login.loginbutton')}
              </Button>
            </Form>
            <a href='/register'>{t('login.registerlink')}</a>
            <br /><hr />
            <a href='/login'>{t('login.forgotpasswordlink')}</a>
                        
          </div>
        </div>
      );
    }
}

export default withTranslation()(Login);