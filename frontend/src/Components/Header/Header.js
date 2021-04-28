import React from "react";
import {withRouter} from 'react-router';
import {Link} from 'react-router-dom';
import './Header.css';
import APIClient from '../../Actions/apiClient';

import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Nav from 'react-bootstrap/Nav';

import { withTranslation } from 'react-i18next';

import logo from '../../Static/Images/g_roussy_logo.png';
import flag_fr from '../../Static/Images/fr_flag_icon.png';
import flag_gb from '../../Static/Images/uk_flag_icon.png';

class Header extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      userIsLoggedIn: false,
      userID:-1,
      redirect: false,
      showBanner: true,
      networkError: false,
      userInQueue:false,
      finishingJob: false,
    }
  }

  async componentDidMount() { 
    this.apiClient = new APIClient(); 
    
    this.apiClient.getAuth().then((data) =>{
      this.setState({
        userIsLoggedIn: true,
        userID:data.logged_in_as['id']
      })
      //If user is on a page different than prediction, he should not have anything in queue. If he does, it means he left prediction page before
      //his job got processed. So server is asked to remove job from queue and user is told his queued job has been deleted.
      if (this.props.history.location.pathname != "/prediction"){
        this.apiClient.checkUserInQueue({"userID":this.state.userID}).then ( (resp) => {
          //if position =0, user is in queue but his prediction is being processed. He simply gets an alert stating that result of the prediction will
          //be on Patient page. If position > 0, user is in queue and his job will never get processed, it gets deleted and a message is sent.
          if (resp.position != -1){
            if (resp.position == 0) this.setState({finishingJob:true})
            else {
              this.setState({userInQueue:true});
              this.apiClient.removeJobFromQueue({"userID":this.state.userID})
            }
          }
        }).catch ( (err) => console.log(err) )
      }
    }).catch((err) => { 
        if (err.response !== undefined) {
            if (err.response.status === 401 || err.response.status === 422) {
                console.log('user is not logged in')
            }
            else{
                console.log(err);
            }
        }
        //If err.resp===undefined, there is a network error
        else{
            this.setState({
              networkError: true
            })
            this.props.history.push('/networkerror')
        }
    })
  }
  
  logout = (event) => {
    localStorage.removeItem('token');
    this.setState({
      userIsLoggedIn: false,
    });
    this.props.history.push('/login');
  }
  
  
  
  closeBanner = (event) => {
    this.setState({
      showBanner: false
    })
  }
  
  closeError = (event) => {
    event.preventDefault();
    this.setState({
      networkError: false,
      userInQueue:false,
      finishingJob: false,
    })
  }
  
  
  render (){  
    const { t , i18n } = this.props;
    var {message} = this.props.location.state || {message: ''}
    
    const changeLanguage = language => {
      if (language === 'en') {
        i18n.changeLanguage('en');
      }
      if (language === 'fr') {
        i18n.changeLanguage('fr');
      }
    }
    return (
      <div className={this.state.networkError ? 'hidden' : ''}>
        <div id="top-header">
          <span className="blue"></span>
          <span className="yellow"></span>
          <span className="orange"></span>
          <span className="violet"></span>
          <span className="blue"></span>
          <span className="yellow"></span>
          <span className="orange"></span>
          <span className="violet"></span>
        </div>
        <Navbar variant="light" expand="lg">
          <Navbar.Brand href="/">
          <img
            src={logo}
            className="d-inline-block align-top"
            alt="Gustave Roussy"
          />
          </Navbar.Brand>
          
           <Nav className="mr-auto" id="brand-link">
            <Nav.Link href="/" className="navbar-link">{t('header.brandlink')} </Nav.Link>
          </Nav>
          
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="m-auto">
              
              <Nav.Link href="/hanprediction">{t('header.hanprediction')}</Nav.Link>
              <span className="nav-link-separator">|</span>
              <Nav.Link href="/rfprediction">{t('header.rfprediction')}</Nav.Link>
              <span className="nav-link-separator">|</span>
              <Nav.Link href="/patients">{t('header.patients')}</Nav.Link>
              <span className="nav-link-separator">|</span>
              <Nav.Link href="/infos">{t('header.info')}</Nav.Link>
             
            </Nav>
          </Navbar.Collapse>
          
          <NavDropdown title={t('languages.header')} id="language-selector" className='m-auto'>
            <NavDropdown.Item id="language-en" onClick={() => changeLanguage('en')}>
              <img
                src={flag_gb}
                width="30"
                height="30"
                alt="English"
                className="d-inline-block align-top language-flag"
              /> 
              <p className="language-name">{t('languages.english')}</p>
            </NavDropdown.Item>
            <NavDropdown.Item id="language-fr" onClick={() => changeLanguage('fr')}>
              <img
                src={flag_fr}
                alt="French"
                width="30"
                height="30"
                className="d-inline-block align-top language-flag"
              />
              <p className="language-name">{t('languages.french')}</p>
            </NavDropdown.Item>
          </NavDropdown>
          
          <Navbar.Collapse id="profile-navbar-nav" className='justify-content-end'>
            <Nav>
              <Nav.Link href="/login" className={'mr-auto ' + (this.state.userIsLoggedIn ? 'hidden' : '')}>Login</Nav.Link>
              <NavDropdown title="Profile" id="basic-nav-dropdown" className={'mr-auto ' + (this.state.userIsLoggedIn ? '' : 'hidden')}>
                <NavDropdown.Item href="/profile">{t('header.showprofile')}</NavDropdown.Item>
                <NavDropdown.Item href="/deleted">{t('header.showdeleted')}</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={this.logout}>{t('header.showlogout')}</NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <div className={'banner ' + ((this.state.showBanner && message) ? '' : 'hidden')}>
          <p className="banner-message-text">{message}</p>
          <span className="banner-close" onClick={this.closeBanner}></span>
        </div>
        <div className={'banner ' + ((this.state.networkError) ? '' : 'hidden')}>
          <span className="banner-message-text">{t('header.networkerror')}</span>
          <span className="banner-close" onClick={this.closeError}></span>
        </div>
        <div className={'banner ' + ((this.state.userInQueue) ? '' : 'hidden')}>
          <span className="banner-message-text">{t('header.userinqueue')}<Link to="/prediction">{t('header.userinqueueanchor')}</Link> </span>
          <span className="banner-close" onClick={this.closeError}></span>
        </div>
        <div className={'banner ' + ((this.state.finishingJob) ? '' : 'hidden')}>
          <span className="banner-message-text">{t('header.finishingjob')}<Link to="/patients">{t('header.finishingjobanchor')}</Link></span>
          <span className="banner-close" onClick={this.closeError}></span>
        </div>
      </div>

    )
  }
};
export default withRouter(withTranslation()(Header));