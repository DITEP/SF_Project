import React from "react";
import APIClient from '../../Actions/apiClient';

import i18n from "i18next";
import { withTranslation } from 'react-i18next';


class ModelsTable extends React.Component {
	constructor(props) {
		super(props);
        this.state = {
            isFetchingData = true,
            models = [],
            entriesExist = false
        }
	}

    async componentDidMount() {
        this.apiClient = new APIClient();
        this.apiClient.getModels().then((data) => {
            this.setState({
              models: data,
              isFetchingData: false,
            });
            if (data.length){
                this.setState({
                  entriesExist: true
                });
            }
        })
    }

    createItem = (item) => {
        <React.Fragment key={item.id}>
            <tr>
                <td className="table_modelClass">{item.modelClass}</td>
                <td className="table_name">{item.name}</td>
                <td className="table_filename">{item.filename}</td>
                <td className="table_toUse">{item.toUse ? t('models.itemtoUse')  :
                    <React.Fragment>
                        {t('models.toUseCheck')} :  
                        <span className = "check" onClick={() => {var new_checkboxes = this.state.checkboxes; new_checkboxes[item.id]=true; this.setState({checkboxes:new_checkboxes})}}>
                            {(this.state.checkboxes[item.id] === null) ? "\u2610" : (this.state.checkboxes[item.id] ? "\u2611" : "\u2610") }
                        </span>
                        <Button className={"submit-sf-info " + (this.state.checkboxes[item.id] === null ? 'hidden' : '')} onClick={() => {item["groundTruth"] = this.state.checkboxes[item.id] ; this.updatePatient(item)}}> {t('prediction.submitbutton')} </Button>
                        <Button className={"submit-sf-info " + (this.state.checkboxes[item.id] === null ? 'hidden' : '')} onClick={() => {var new_checkboxes = this.state.checkboxes; new_checkboxes[item.id]=null; this.setState({checkboxes:new_checkboxes})}}> {t('prediction.clearbutton')} </Button>
                    </React.Fragment>
                    }
                </td>
            </tr>
        </React.Fragment>
    }
  
	render () {
        const { t } = this.props;
        if (!this.state.isFetchingData) {
            var listItems = this.state.models.map(this.createItem);
        }
        return(
            <div className="container-fluid">
                <p className={(this.state.entriesExist || this.state.isFetchingData ? 'hidden' : '')}>{t('models.tableempty')}</p>
                <p className={(this.state.isFetchingData ? '' : 'hidden')}>{t('models.fetchingdata')}</p>
                <div className="table-container">
                <Table striped bordered hover className={"patients-table " + (this.state.entriesExist ? '' : 'hidden')}>
                    <thead>
                    <tr>
                        <th>{t('models.tablemodelClass')}</th>
                        <th>{t('models.tablemodelname')}</th>
                        <th>{t('models.tablefilename')}</th>
                        <th>{t('models.tabletoUse')}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {listItems}
                    </tbody>
                </Table>
                </div>
            </div>
        )
    }
}

export default withTranslation()(ModelsTable);