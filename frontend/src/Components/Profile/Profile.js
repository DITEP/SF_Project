import React from "react";
import APIClient from '../../Actions/apiClient';

import i18n from "i18next";
import { withTranslation } from 'react-i18next';

import './Profile.css';

import ModelsTable from './ModelsTable';
import AddModelForm from "./AddModelForm";

class Profile extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
      userID: -1,
      isAdmin: false
    };
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

	render () {
    const { t } = this.props;
    const isAdmin = this.state.isAdmin;
    return (
        <div className="container">
          {isAdmin && 
            (<div> 
              <ModelsTable/>
              <AddModelForm/>
            </div>)
          }
        </div>
      );
    }
}

export default withTranslation()(Profile);