import React from "react";
import APIClient from '../Actions/apiClient';

import { withTranslation } from 'react-i18next';

import HAN_schema from '../Static/Images/HAN_des.png';

class Info extends React.Component {
  constructor(props) {
    super(props);
  }
 
  async componentDidMount() {
    this.apiClient = new APIClient();  
  }

  render () {
    const { t } = this.props;
    return (
      <div>
        <div id="des-text" className = 'row'>
          <div className="col-7">
            <h1>{t('home.title')}</h1>
            <div className='pres-text'>
              <p>{t('home.tooldescription')}</p>
              <h2>{t('home.HANdescriptiontitle')}</h2>
              <p>{t('home.HANintroduction')}</p>
              <h2>{t('home.HANarchitecturetitle')}</h2>
              <p>{t('home.HANarchitecture')}</p>
              <h3>{t('home.HANencodertitle')}</h3>
              <p>{t('home.HANencoderdescription1')}</p>
              <p>{t('home.HANencoderdescription2')}</p>
            </div>
          </div>
          <div className="col-5">
            <figure>
              <img
                  src={HAN_schema}
                  width="100%"
                  className="d-inline-block"
                />
              <figcaption>Figure 1 - HAN description</figcaption>
              </figure>
          </div>
        </div>
      </div>
      );
    }
}

export default withTranslation()(Info);