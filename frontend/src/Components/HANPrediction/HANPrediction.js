import React from "react";
import APIClient from '../../Actions/apiClient';
import './HANPrediction.css';

import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';


import { withTranslation } from 'react-i18next';
import i18n from "i18next";

class HANPrediction extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
      userID: -1,
      text: '',
      nip:'',
      dateCr:'',
      
      result:0,
      wordAttentions:[],
      sentenceAttentions:[],
      sentences:[],
      //A queue system exist if multiple users are trying to predict at the same
      //PositionInQueue keeps the user updated as to where he is located in this queue.
      positionInQueue: -1,
      //setInterval is used to keep updates on the position of the user in queue. intervalId is used to shutdown this interval.
      intervalId: -1,
      //Used to show a spinning wheel while the server is computing prediction
      isComputing: false,
      showVizualization: false,
      
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
                from: 'Prediction', 
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
    this.apiClient.checkUserInQueue({"userID":this.state.userID,"model":"HAN"}).then ( (resp) => {
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
        model: "HAN"
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
    this.apiClient.checkUserInQueue({'userID':this.state.userID,"model":"HAN"}).then( (resp) => {
      this.setState({positionInQueue:resp['position']});
      if (this.state.positionInQueue === 0) {
        clearInterval(this.state.intervalId)
        this.setState({isComputing:true, showVizualization: false});
        this.apiClient.predict({"userID":this.state.userID,"model":"HAN"}).then( (resp) => {
          this.setState({
            result: Math.round(parseFloat(resp.result)*10000)/100,
            wordAttentions: resp.word_attentions,
            sentenceAttentions: resp.sentence_attentions,
            sentences: resp.sentences,
            
            positionInQueue:-1,
            
            isComputing: false,
            showVizualization: true,
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
  

  
  //Function to create the vizualization. It is stored in a table, hence it returns a list of <td></td> elements.
  createItems = (sentences,sentenceAttentions,wordAttentions) => {
    console.log(sentences);
    //heatColor functions return a color based on the value of either attention
    function heatColor(value){
      var l = Math.max((0.95 - 4*value),0.54) * 100;
      return "hsl(20, 88.9%," + l + "%)"
    }
    function wordHeatColor(value){
      var l = Math.max((0.95 - 4*value),0.54) * 100;
      return "hsl(195, 88.9%," + l + "%)"
    }
    
    //topN takes an array and a value n, and returns the n first value. Additionnaly, it returns the quartile that we use
    //to decide which sentences will have its words colored.
    function topN(array,n) {
        if (n>array.length) {
          return "Error : n is bigger than array size"
        }
        var sorted = Array.from(array);
        sorted.sort(function(a, b){return b - a});
        const quart = Math.floor(sorted.length / 4);
        return {limit: sorted[quart], nFirst: sorted.slice(0,n)}
    }
    
    var topAttentions = topN(sentenceAttentions,3);
    var attentionLimit = topAttentions.limit;
    var firstAttentions = topAttentions.nFirst;
    
    //addWords creates word coloration display
    function addWords(sentence,sentenceAttention,wordAttentions){
      var listWords = [];
      var words = sentence.split(" ");
      for (var word = 0; word<words.length; word++){
        listWords.push(
          <span key={word} style={{backgroundColor: (sentenceAttention>attentionLimit) ? wordHeatColor(wordAttentions[word]) : null}}>
            {words[word] + ' '}
          </span>
        )
      }
      return listWords
    }
    
    //uses above functions to create the actual rows of the table. 
    var listItems=[]
    for (var sentence=0; sentence<sentences.length; sentence++){
      listItems.push(
      <tr key={sentence}>
        <td scope="row" className={"tablesentencenumber"}>
          {sentence}
        </td>
        <td className={"tablesentence"}> 
          <p style={{color: (firstAttentions.includes(sentenceAttentions[sentence])) ? '#f26722' : 'black'}}> 
            {addWords(sentences[sentence],sentenceAttentions[sentence],wordAttentions[sentence])}
          </p>
        </td>
        
        <td className={"tableattention"} 
          style={{backgroundImage: "linear-gradient(to left, white, " + heatColor(sentenceAttentions[sentence]) + ")"}}> 
          { Math.round(sentenceAttentions[sentence]*10000)/100 + "%"}
        </td> 
      </tr>
      )
    }
    return listItems
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
            <h1> {t('prediction.pagetitle')} </h1>
            <div className='pres-text'>
              <p>{t('prediction.description')}</p>
            </div>
          </div>
          <div className={"col-6 pres-text " + ((this.state.positionInQueue >= 0) ? "" : "hidden")}>
            <div className="loader-container">
              <p>{this.state.isComputing ?  t('prediction.appComputing') : t('prediction.userInQueue') + this.state.positionInQueue}</p>
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
              <h2>{t('hanprediction.resultHeader')}</h2>
              <div>
                <h3>{this.state.result + '%'}</h3>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div id="more-info" className="col-12">
            <h1>{t('hanprediction.vizualization.title')}</h1>
            <div>
              <div className="pres-text">
                <p>{t('hanprediction.vizualization.description1')}</p>
                <p>{t('hanprediction.vizualization.description2')}</p>
              </div>
            </div>
            <Table hover className={"table-sm vizualization-table " + (this.state.showVizualization ? '' : 'hidden')}>
             <thead>
               <tr>
                 <th scope="col">#</th>
                 <th scope="col">{t('hanprediction.vizualization.tablesentence')}</th>
                 <th scope="col">{t('hanprediction.vizualization.tablesentenceattention')}</th>
               </tr>
             </thead>
             <tbody>
               {this.state.showVizualization ? this.createItems(this.state.sentences,this.state.sentenceAttentions,this.state.wordAttentions) : null}
             </tbody>
            </Table>
          </div>
        </div>
      </React.Fragment>
    
      );
    }
}

export default withTranslation()(HANPrediction);