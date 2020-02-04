import React from "react";
import './NetworkError.css'
import { withTranslation } from 'react-i18next';


class NetworkError extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    }

    render(){
        const { t } = this.props;
        return(
            <div>
                <h1> {t('networkerror.title')} </h1>
                <p> {t('networkerror.description')} </p>
            </div>
        )
    }
};
export default withTranslation()(NetworkError);