import React from "react";
import APIClient from '../../Actions/apiClient';

import i18n from "i18next";
import { withTranslation } from 'react-i18next';

import './Profile.css';

import ModelsTable from './ModelsTable';
import AddModelForm from "./AddModelForm";

class Profile extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      userID: -1,
      isAdmin: false,

      fileUploadError:false
    };
    this.modelsTable = React.createRef();
  }
		


  async componentDidMount() {
    this.apiClient = new APIClient();
    this.apiClient.getAuth().then((data) =>{
      this.setState({
        userID: data.logged_in_as.id,
        isAdmin: data.logged_in_as.isAdmin
      })
      console.log(this.state.isAdmin);
    }).catch((err) => {
        if (err.response.status) {
          if (err.response.status === 401 || err.response.status === 422) {        
            const location = {
              pathname: '/login',
              state: { 
                from: 'Profile', 
       					message: i18n.t('messages.notauthorized') 
              }
            }      
            this.props.history.push(location)
          }
        }
      })
  }

  refreshTable = () =>{
    this.setState({fileUploadError:false})
    this.modelsTable.current.resetTable();
  }

  raiseFileUploadError = () => {
    this.setState({fileUploadError:true})
  }

	render () {
    const { t } = this.props;
    const isAdmin = this.state.isAdmin;
    return (
        <div className="container">
          {isAdmin && 
            (<div> 
              <h2>{t("models.currentModels")}</h2>
              <ModelsTable ref={this.modelsTable}/>
              {/* ERRORS */}
              <div className={'container error-container ' + (this.state.fileUploadError ? '' : 'hidden')}>
              <span className='error-text'>
                  {t('messages.fileuploaderror')}
              </span>
              </div>
              <h2>{t("models.addModelForm")}</h2>
              <AddModelForm raiseFileUploadError={this.raiseFileUploadError} formSubmitted={this.refreshTable}/>
            </div>)
          }
        </div>
      );
    }
}

export default withTranslation()(Profile);