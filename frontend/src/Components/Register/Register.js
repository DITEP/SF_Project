import React from "react";
import './Register.css';
import APIClient from '../../Actions/apiClient';

import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

import { withTranslation } from 'react-i18next';

class Register extends React.Component {
	constructor(props) {
		super();
		this.state = {
      email: '',
      username: '',
      password: '',
      passwordRepeat: '',
      passwordMismatch: false,
      passwordSecurityError: false,
      usernameAlreadyUsed: false,
      emailAlreadyUsed: false,
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
      passwordMismatch: false,
      passwordSecurityError: false,
      usernameAlreadyUsed: false,
      emailAlreadyUsed: false,
      otherError: false      
    });
  }
 
  onSubmit = (event) => {
    event.preventDefault();
    
    this.resetIndicators();
    
    if (this.state.password !== this.state.passwordRepeat) {
      this.setState({
        passwordMismatch: true
      })
      return;
    }
    
    if (this.state.password.length < 4) { // Maybe also uppercase and special chars?
      this.setState({
        passwordSecurityError: true
      })
      return;
    }
    
    let newUser = {
      username: this.state.username,
      password: this.state.password,
      email: this.state.email
    }
    
    this.apiClient.createUser(newUser).then((data) =>{
      //Redirect to /login page  
      this.props.history.push('/login');
    }).catch((err) => {
        if (err.response.status === 409) {
          if (err.response.data.origin === 'email') {
            this.setState({
            emailAlreadyUsed: true
            })
          }
          else {
            this.setState({
            usernameAlreadyUsed: true
            })
          }
          return;
        }
        this.setState({
          otherError: true
        }) 
      }
    )
    
  }

	render () {
    const { t } = this.props;
    return (
        <div className="container">
          <div className="container-fluid">
            
            <Form className='sign-up-form col-8 col-centered' onSubmit={this.onSubmit}>
              
              
              
              <Form.Group>
                <Form.Label>{t('register.username')}</Form.Label>
                <Form.Control 
                  type="username" 
                  placeholder={t('register.usernameplaceholder')}
                  name='username' 
                  value={this.state.username}
                  onChange={this.handleInputChange}
                  required
                />
                <Form.Text className="text-muted">
                  {t('register.usernamehelper')}
                </Form.Text>
              </Form.Group>
            
              <Form.Group>
                <Form.Label>{t('register.emailaddress')}</Form.Label>
                <Form.Control 
                  type="email" 
                  placeholder={t('register.emailplaceholder')}
                  name='email' 
                  value={this.state.email}
                  onChange={this.handleInputChange}
                  required
                />
                <Form.Text className="text-muted">
                  {t('register.emailhelper')}
                </Form.Text>
              </Form.Group>
                
              <Form.Group>
                <Form.Label>{t('register.password')}</Form.Label>
                <Form.Control 
                  type="password" 
                  placeholder={t('register.passwordplaceholder')}
                  name='password'
                  value={this.state.password}
                  onChange={this.handleInputChange}
                  required
                />
                
                <Form.Label>{t('register.repeatpassword')}</Form.Label>
                <Form.Control 
                  type="password" 
                  placeholder={t('register.repeatpasswordplaceholder')}
                  name='passwordRepeat'
                  value={this.state.passwordRepeat}
                  onChange={this.handleInputChange}
                  required
                />
                
                
                <p className={'password-error ' + (this.state.passwordMismatch ? 'show' : 'hidden')}>
                  {t('register.passwordmismatcherror')}
                </p>
                <p className={'password-error ' + (this.state.passwordSecurityError ? 'show' : 'hidden')}>
                  {t('register.passwordinsecureerror')}
                </p>
                <p className={'password-error ' + (this.state.usernameAlreadyUsed ? 'show' : 'hidden')}>
                  {t('register.usernametakenerror')}
                </p>
                <p className={'password-error ' + (this.state.emailAlreadyUsed ? 'show' : 'hidden')}>
                  {t('register.emailtakenerror')}
                </p>
                <p className={'password-error ' + (this.state.passwordSecurityError ? 'show' : 'hidden')}>
                  {t('register.othererror')} 
                </p>                
              </Form.Group>
              
              <Button variant="primary" type="submit">
                {t('register.submitbutton')}
              </Button>
              
            </Form>
            
            <a href='/login'>{t('register.loginlinkbottom')}</a>
          
          </div>
        </div>
      );
    }
}
export default withTranslation()(Register);