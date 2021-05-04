import React from "react";
import APIClient from '../../Actions/apiClient';
import './RFPrediction.css';

import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';


import { withTranslation } from 'react-i18next';
import i18n from "i18next";

class RFPrediction extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
      userID: -1,
      text: '',
      nip:'',
      dateCr:'',
      
      result:0,
      //A queue system exist if multiple users are trying to predict at the same
      //PositionInQueue keeps the user updated as to where he is located in this queue.
      positionInQueue: -1,
      //setInterval is used to keep updates on the position of the user in queue. intervalId is used to shutdown this interval.
      intervalId: -1,
      //Used to show a spinning wheel while the server is computing prediction
      isComputing: false,
      
      //A Popup is used when pressing submit to ask for additional information
      popupIsOpen: false,
      
      //Errors that can occur when submitting prediction and predicting
      userAlreadyInQueue: false,
      reportInDb: false,
      predictionError: false,
      nipFormatError: false,
    };
    
    
	}
 
  // Check the users auth token,
  // If there is none / it is blacklisted,
  // Push user to login, set message banner to appropriate message,
  // Store current location to redirect user back here after successful login
  async componentDidMount() {
    this.apiClient = new APIClient();
    this.apiClient.getAuth().then((data) =>
      this.setState({
        userID: data.logged_in_as.id
      })
    ).catch((err) => {
        if (err.response.status) {
          if (err.response.status === 401 || err.response.status === 422) {        
            const location = {
              pathname: '/login',
              state: { 
                from: 'RFPrediction', 
       					message: i18n.t('messages.notauthorized') 
              }
            }      
            this.props.history.push(location)
          }
        }
      })
  }
  
  handleInputChange = (event) => {
    const { value, name } = event.target;
    this.setState({
      [name]: value
    });  
  }
  
  resetErrorsState = () => {
      this.setState({
        predictionError: false,
        reportInDb: false,
        nipError: false,
        userAlreadyInQueue: false,
      });
  }
  
  onSubmit = (event) => {
    event.preventDefault();
    //Reset all errors
    this.resetErrorsState();
    //First check if the user does not already have a job in the queue.
    this.apiClient.checkUserInQueue({"userID":this.state.userID,"model":"RF"}).then ( (resp) => {
      if (resp.position == -1) this.openPopup(event);
      else this.setState({userAlreadyInQueue:true})
    }).catch ( (err) => console.log(err) )
  }
  
  openPopup(event) {
    this.setState({
      popUpIsOpen: true,
    });
  }
  
  confirmPopup = (event) => {
    this.setState({nipFormatError:false})
    event.preventDefault();
    if (this.nipOk(this.state.nip))  this.launchPrediction();
    else this.setState({nipFormatError:true})
    return;
  }
  
  cancelPopup = () => {
    this.setState({
      popUpIsOpen: false,
    });
    return;  
  }
  
  nipOk = (nip) => {
    var regex = RegExp("^\\d{4}-?\\d{5}-?[A-Z]{2}$")
    return regex.test(nip)
  }
  
  launchPrediction = () => {
      let predData = {
        text: this.state.text,
        userID: this.state.userID,
        nip: this.state.nip,
        dateCr: this.state.dateCr,
        model: "RF"
      };
      this.setState({popUpIsOpen:false});
      /*
      First submit the prediction to the server. It will register the text, nip and dateCr, check if the report already 
      exist and place user in queue accordingly. The user then check its position in the queue. If he is first, 
      the prediction begins. Otherwise, the user  starts asking the server every few seconds whether 
      he is first in queue or not. This is done through the setInterval function. If it's the case, 
      the interval is stop and the prediction begins.
      */
      this.apiClient.submitPrediction(predData).then( (resp) => 
        {
          this.predict();
        }).catch( (err) => {
          if (err.response.status == 409) this.setState({reportInDb:true})
          else console.log(err)
        })
  }
  
  predict = () => {
    this.apiClient.checkUserInQueue({'userID':this.state.userID,"model":"RF"}).then( (resp) => {
      this.setState({positionInQueue:resp['position']});
      if (this.state.positionInQueue === 0) {
        clearInterval(this.state.intervalId)
        this.setState({isComputing:true});
        this.apiClient.predict({"userID":this.state.userID,"model":"RF"}).then( (resp) => {
          this.setState({
            result: Math.round(parseFloat(resp.result)*10000)/100,
            
            positionInQueue:-1,
            isComputing: false,
          });
          }).catch((err) => {
            console.log(err);
            this.setState({
              positionInQueue:-1,
              reportID:-1,
              predictionError:true,
              isComputing: false,
            });
        });
        return
      }
      else {
        if (this.state.intervalId==-1){
          console.log("starting interval");
          var intervalId = setInterval(this.predict,2000);
          this.setState({intervalId:intervalId})
        }
        return
      }
    }).catch( (err) => {
      console.log(err)
      this.setState({positionInQueue:-1,reportID:-1})
    })
  }
  

  render () {
    const { t } = this.props;
    return (
    
      <React.Fragment>
        {/* POP UP */}
        <div className={'additional-info ' + (this.state.popUpIsOpen ? 'show-popup' : '')}>
          <div className='popup-header'>
            <h4>{t('prediction.popupheader')} {this.state.currentItemName}</h4>
            <span className='close-popup' onClick={this.cancelPopup}></span>
          </div>
          <hr />
          <div className='popup-body'>
            <span className={'prediction-error ' + (this.state.nipFormatError ? '' : 'hidden')}>
             {t('prediction.nipformaterror')}
           </span>
            <Form className={this.state.popUpIsOpen ? '' : 'hidden'} onSubmit={this.confirmPopup}>
              <Form.Group controlId="popupNipInfo">
                <Form.Label>{t('prediction.popupniplabel')}</Form.Label>
                <Form.Control 
                  type="username" 
                  placeholder={t('prediction.popupnipplaceholder')}
                  name='nip' 
                  value={this.state.nip}
                  onChange={this.handleInputChange}
                  required
                />
              </Form.Group>
              <Form.Group controlId="popupNipInfo">
                <Form.Label>{t('prediction.popupdatecr')}</Form.Label>
                <Form.Control 
                  type="date" 
                  name='dateCr' 
                  value={this.state.dateCr}
                  onChange={this.handleInputChange}
                  required
                />
               </Form.Group>
               <Button className = "submit-popup-button" type="submit" >{t('prediction.submitbutton')}</Button>
            </Form>
          </div>
          <br />
          <hr />
          <div className='popup-footer'>
            <Button className={"cancel-popup-button " + (this.state.popUpIsOpen ? '' : 'hidden')} onClick={this.cancelPopup}>
              {t('prediction.cancelbutton')}
            </Button>
          </div>
         </div> 

         <div className={'black-overlay ' + (this.state.popUpIsOpen ? '' : 'hidden')}></div>


         {/* ERRORS */}
         <div className='container-fluid'>
           <span className={'prediction-error ' + (this.state.predictionError ? '' : 'hidden')}>
             {t('prediction.predictionerror')}
           </span>
           <span className={'prediction-error ' + (this.state.userAlreadyInQueue ? '' : 'hidden')}>
             {t('prediction.useralreadyinqueue')}
           </span>
           <span className={'prediction-error ' + (this.state.reportInDb ? '' : 'hidden')}>
             {t('prediction.reportindb')}
           </span>
         </div>
         
         
         
        {/* PAGE */}
        <div className = 'row'>
          <div className = 'col-6'>
            <h1> {t('rfprediction.pagetitle')} </h1>
            <div className='pres-text'>
              <p>{t('prediction.description')}</p>
            </div>
          </div>
          <div className={"col-6 pres-text " + ((this.state.positionInQueue >= 0) ? "" : "hidden")}>
            <div className="loader-container">
              <p>{this.state.isComputing ? t('prediction.appComputing') : t('prediction.userInQueue') + this.state.positionInQueue}</p>
              <div id = 'loader' className= 'loader'></div>
            </div>
          </div>
        </div>
        <div className = 'row'>
          <Form className='col-6' onSubmit={this.onSubmit}>
            <Form.Group controlId="formTextInput">
              <Form.Label>{t('prediction.formtitle')}</Form.Label>
              <Form.Control as="textarea" rows="10"
                type="text" 
                placeholder={t('prediction.textplaceholder')}
                name='text' 
                value={this.state.text}
                onChange={this.handleInputChange}
                required
              />
            </Form.Group>
          
            <div className="button-bar row">
              <div id="clear-div" className="col-6">
                <Button type="reset" onClick={() => this.setState({text : ''})}>{t('prediction.clearbutton')}</Button>
              </div>
              <div id="submit-div" className="col-6">
                <Button type="submit">{t('prediction.submitbutton')}</Button>
              </div>
            </div>
          </Form>
          <div className = "col-6" id="results-container">
            <div className="result-wrapper">
              <h2>{t('rfprediction.resultHeader')}</h2>
              <div>
                <h3>{this.state.result + '%'}</h3>
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    
      );
    }
}

export default withTranslation()(RFPrediction);