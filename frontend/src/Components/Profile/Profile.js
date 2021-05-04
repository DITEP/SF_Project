import React from "react";
import APIClient from '../../Actions/apiClient';

import i18n from "i18next";
import { withTranslation } from 'react-i18next';

import './Profile.css';

class Profile extends React.Component {
	constructor(props) {
		super(props);
		this.state = {

    };
	}

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
    return (
        <div className="container">
          Profile Page is under construction...
        </div>
      );
    }
}

export default withTranslation()(Profile);