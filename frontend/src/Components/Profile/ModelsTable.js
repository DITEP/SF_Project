import React from "react";
import APIClient from '../../Actions/apiClient';

import i18n from "i18next";
import { withTranslation } from 'react-i18next';

import './ModelsTable.css'

import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
class ModelsTable extends React.Component {
    state = {
        isFetchingData:true,
        models:[],
        entriesExist:false,

        popUpIsOpen: false,
        itemToChange: null
    }




    resetTable = () => {
        this.setState({isFetchingData:true,entriesExist:false});
        this.apiClient.getModels().then((data) => {
            this.setState({
              models: data,
              itemToChange: null,
              isFetchingData: false,
            });
            if (data.length){
                this.setState({
                  entriesExist: true
                });
            }
        })
    }

    async componentDidMount() {
        this.apiClient = new APIClient();
        this.resetTable();
    }


    createItem = (item) => {
        const {t} = this.props;
        return(
        <React.Fragment key={item.id}>
            <tr>
                <td className="table_modelClass">{item.modelClass}</td>
                <td className="table_name">{item.name}</td>
                <td className="table_filename">{item.filename}</td>
                <td className="table_toUse">{item.toUse ? t('models.itemtoUse')  :
                    <React.Fragment>
                        {t('models.toUseCheck')} :  
                        <span className = "check" onClick={() => {this.checkBox(item)}}>
                            {(this.state.itemToChange === null) ? "\u2610" : ((this.state.itemToChange.id == item.id) ? "\u2611" : "\u2610" )}
                        </span>
                        <Button className={"submit-sf-info rm-1em " + (this.state.itemToChange !== null && this.state.itemToChange.id == item.id ? '' : 'hidden')} onClick={() => {this.openPopup()}}> {t('prediction.submitbutton')} </Button>
                        <Button className={"submit-sf-info " + (this.state.itemToChange !== null && this.state.itemToChange.id == item.id ? '' : 'hidden')} onClick={() => {this.setState({itemToChange:null})}}> {t('prediction.clearbutton')} </Button>
                    </React.Fragment>
                    }
                </td>
            </tr>
        </React.Fragment>
        )
    }

    updateModel = (item) => {
        this.apiClient.selectModel(item).then((data) => {
            console.log(data);
            this.resetTable();

        }).catch((err) => {
            console.log(err)
        })
    }

    checkBox = (item) => {
        this.setState({itemToChange:item});
    }

    openPopup() {
        this.setState({
          popUpIsOpen: true,
        });
      }
    
    confirmPopup = (event) => {
        event.preventDefault();
        this.updateModel(this.state.itemToChange);
        this.setState({
            popUpIsOpen: false,
        });
      }
      
    cancelPopup = () => {
        this.setState({
          popUpIsOpen: false,
        });
      }
  
	render () {
        const { t } = this.props;
        if (!this.state.isFetchingData) {
            var listItems = this.state.models.map(this.createItem,t);
        }
        return(
            <div className="container-fluid">
                {/* POP UP */}
                <div className={'additional-info ' + (this.state.popUpIsOpen ? 'show-popup' : 'hidden')}>
                    <div className='popup-header'>
                        <h4>{t('models.popupheader')} {this.state.currentItemName}</h4>
                        <span className='close-popup' onClick={this.cancelPopup}></span>
                    </div>
                    <hr />
                    <div className='popup-body'>
                        <span className='popup-body-text'>
                            {t('models.popupbodytext')}
                        </span>
                    </div>
                    <hr />
                    <div className='popup-footer'>
                        <Button className={"confirm-popup-button rm-1em"} onClick={this.confirmPopup}>
                        {t('models.submitbutton')}
                        </Button>
                        <Button className={"cancel-popup-button "} onClick={this.cancelPopup}>
                        {t('models.cancelbutton')}
                        </Button>  
                    </div>
                </div> 
                
                <p className={(this.state.entriesExist || this.state.isFetchingData ? 'hidden' : '')}>{t('models.tableempty')}</p>
                <p className={(this.state.isFetchingData ? '' : 'hidden')}>{t('models.fetchingdata')}</p>
                <div className="table-container">
                <Table striped bordered hover className={"table " + (this.state.entriesExist ? '' : 'hidden')}>
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

export default withTranslation(null,{withRef: true})(ModelsTable);