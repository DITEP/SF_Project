import React from "react";
import APIClient from '../../Actions/apiClient';

import { withTranslation } from 'react-i18next';
import i18n from "i18next";

import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';

import './Patients.css'

class Patients extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
      userID: -1,
      isFetchingData: true,
      entriesExist: false,
      patients: [],
      //open keeps track of which text is displayed
      open: -1,
      //lackingInformation keeps track of which entry the user could add information to
      lackingInformation: [],
      checkboxes: {},
      
      //attentions for display purpose
      showAttention:false,
      attentionItems: [],
      attentionComputing: false,
      
      popupIsOpen: false,
      popUpDeleteError: false,
      currentItem: '',
      currentItemName: '',
      popupDeleteSuccess: false
    };
	}
 
 
 
  async componentDidMount() {
    this.apiClient = new APIClient();
    this.apiClient.getAuth().then((data) => {
      this.setState({
        userID: data.logged_in_as['id']
      }); 
    })
    .then((data) =>
      this.apiClient.getPatients().then((data) => {
        this.setState({
          patients: data,
          isFetchingData: false,
        });
        //loop through data to check for missing information and initialize checkboxes item
        var new_checkboxes = {}
        for (var i = 0; i<data.length; i++){
          if (data[i].screenfail === null){
            new_checkboxes[data[i].id]=null;
            if (this.daysBetweenDates(new Date(data[i].datecr), new Date()) > 60 && data[i].user.id === this.state.userID) {
              this.setState({lackingInformation: this.state.lackingInformation.concat(data[i].nip)})
            }
          }
        }
        this.setState({checkboxes: new_checkboxes});
        if (data.length){
          this.setState({
            entriesExist: true
          });
        }
      }).catch((err) => {})
    )
    .catch((err) => {
        if (err.response.status) {
          if (err.response.status === 401 || err.response.status === 422) {        
            const location = {
              pathname: '/login',
              state: { 
                from: 'Patients', 
       					message: i18n.t('messages.notauthorized') 
              }
            }      
            this.props.history.push(location)
          }
        }
      })
  }
  
  //updatePatient send info to the backend to update the trueResult of a patient.
  updatePatient = (patient) => {
    this.apiClient.updatePatient(patient).then( (resp) => {
      this.setState({updateError:false, updateSucces:true, lackingInformation: this.state.lackingInformation.filter(element => element !== patient.nip)});
      //this.state.patients.map(this.createItem);
    }).catch( (err) => {
      this.setState({updateError:true});
    })
  }
  
  
  //get the number of date between two dates
  daysBetweenDates = function( date1, date2 ) {
    //Get 1 day in milliseconds
    var one_day=1000*60*60*24;
  
    // Convert both dates to milliseconds
    var date1_ms = date1.getTime();
    var date2_ms = date2.getTime();
  
    // Calculate the difference in milliseconds
    var difference_ms = date2_ms - date1_ms;
      
    // Convert back to days and return
    return Math.round(difference_ms/one_day); 
  }
  
  createItem = (item) => {
  
    var isOwner = false;
    if (this.state.userID === item.user.id) {
      isOwner = true;
    }
  //Date is formated here so that it display as yyy/mm/dd (was full js date format before, with time, day...)
  var d = new Date(item.report.datecr)
  var formatedDate = [d.getFullYear(),
  ('0' + (d.getMonth() + 1)).slice(-2),
  ('0' + d.getDate()).slice(-2)].join('-')
  //For the screenfail table, React wouldn't accept an input field inside a the return, hence the headache with <span> tags to do the same job
  const { t } = this.props;
  return (
      <React.Fragment key={item.id}>
        <tr>
          <td className="tablenip">{item.report.nip}</td>
          <td className="tabledate">{formatedDate}</td>
          <td className="tableresult">{(item.result *100).toString().slice(0,5) +"%"}</td>
          <td className="tabletrue">{item.groundTruth !== null ? (item.groundTruth ? "Screen Fail" : "Successfull Screening and DLT Period") :
            (!isOwner ? "Unknown" : 
              <React.Fragment>
                Screen Fail :  
                <span className = "check" onClick={() => {var new_checkboxes = this.state.checkboxes; new_checkboxes[item.id]=true; this.setState({checkboxes:new_checkboxes})}}>
                 	{(this.state.checkboxes[item.id] === null) ? "\u2610" : (this.state.checkboxes[item.id] ? "\u2611" : "\u2610") }
                </span>
                Successfull Screening and DLT Period : 
                <span className = "check" onClick={() => {var new_checkboxes = this.state.checkboxes; new_checkboxes[item.id]=false; this.setState({checkboxes:new_checkboxes})}}>
                  {(this.state.checkboxes[item.id] === null) ? "\u2610" : (this.state.checkboxes[item.id] ? "\u2610" : "\u2611") }
                </span>
                <Button className={"submit-sf-info " + (this.state.checkboxes[item.id] === null ? 'hidden' : '')} onClick={() => {item["groundTruth"] = this.state.checkboxes[item.id] ; this.updatePatient(item)}}> {t('prediction.submitbutton')} </Button>
                <Button className={"submit-sf-info " + (this.state.checkboxes[item.id] === null ? 'hidden' : '')} onClick={() => {var new_checkboxes = this.state.checkboxes; new_checkboxes[item.id]=null; this.setState({checkboxes:new_checkboxes})}}> {t('prediction.clearbutton')} </Button>
              </React.Fragment>)
            }
          </td>
          <td className="tableowner">{item.user.username}</td>
          <td className="tablecollapsebutton"> <Button onClick={() => this.setState({open: item.id, showAttention:false})} disabled={this.state.attentionComputing}> &#8595; </Button></td>
        </tr>
        <tr>
          <td colSpan="5" className={'tabletext ' + (this.state.open===item.id ? '' : 'hidden')} id={item.id + "text"}>
            {(this.state.showAttention ? 
              <Table className='vizualization-table'><tbody>{this.state.attentionItems}</tbody></Table> : item.report.text)}
          </td>
          <td className={'tablecollapsebutton ' + (this.state.open===item.id ? '' : 'hidden')}> 
            <Button className = "closebutton" onClick={() => this.setState({open: -1, showAttention:false})} disabled={this.state.attentionComputing}> &#8593; </Button> 
            <Button className = "attentionbutton" onClick={() => this.showAttention(item.report.text)} disabled={this.state.attentionComputing}> Show Attention </Button> 
            <div className={"pres-text " + (this.state.attentionComputing ? "" : "hidden")}>
              <div className="loader-container">
                Computing Attention...
                <div id = 'loader' className= 'loader'></div>
              </div>
            </div>
          </td>
        </tr>
      </React.Fragment>
    )
  }
  
  showAttention = (text) => {
    let data = {text: text};
    this.setState({attentionComputing: true});
    this.apiClient.getAttention(data).then( (resp) =>
      {
        this.setState({
          attentionItems: this.createAttentionItems(resp.sentences,resp.sentence_attentions,resp.word_attentions),
          showAttention: true,
          attentionComputing: false
        });
      }).catch( (err) => console.log(err));
  }
  
  //Function to create the vizualization. It is stored in a table, hence it returns a list of <td></td> elements.
  createAttentionItems = (sentences,sentenceAttentions,wordAttentions) => {
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
    var listItems=[];
    
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
          {Math.round(sentenceAttentions[sentence]*10000)/100 + "%"}
        </td> 
      </tr>
      )
    }
    return listItems
  }
  


  

	render () {
    const { t } = this.props;
    
    if (!this.state.isFetchingData) {
      var listItems = this.state.patients.map(this.createItem);
    }
    return (
      <div className="table-container">
        <div className="container-fluid">
          <p className={"login-error " + (this.state.lackingInformation.length === 0 ? 'hidden' : '')}>
            {t('patients.lackinginformation') + this.state.lackingInformation.join(', ') }
          </p>
          <p className={(this.state.entriesExist || this.state.isFetchingData ? 'hidden' : '')}>{t('patients.tableempty')}</p>
          <p className={(this.state.isFetchingData ? '' : 'hidden')}>{t('patients.fetchingdata')}</p>
          <div className="table-container">
           <Table striped bordered hover className={"patients-table " + (this.state.entriesExist ? '' : 'hidden')}>
             <thead>
               <tr>
                 <th>{t('patients.tablenip')}</th>
                 <th>{t('patients.tabledate')}</th>
                 <th>{t('patients.tableresult')}</th>
                 <th>{t('patients.tabletrueresult')}</th>
                 <th>{t('patients.tableusername')}</th>
               </tr>
             </thead>
             <tbody>
               {listItems}
             </tbody>
           </Table>
          </div>
        </div>
      </div>
      );
    }
}

export default withTranslation()(Patients);