import React, {useRef} from "react";
import APIClient from '../../Actions/apiClient';

import i18n from "i18next";
import { withTranslation } from 'react-i18next';


class AddModelForm extends React.Component {
	constructor(props) {
		super(props);
        this.state = { 
            name:"",
            modelClass:"HAN",
            file:null,
            output:"SF",
            fileUploadError:false
        }
	}

    async componentDidMount() {
        this.apiClient = new APIClient();
    }

    FileUploader = ({onFileSelect}) => {
        const handleFileInput = (e) => {
            // handle validations
            onFileSelect(e.target.files[0])
        }
        const {t} = this.props;
        return (
            <div className="file-uploader">
                <label for="file_upload">{t('models.fileUpload')}:</label>
                <br/>
                <input id="file_upload" type="file" onChange={handleFileInput}/>
            </div>
        )
    }

    handleChange = (event) => {
    const target = event.target;
    const name = target.name;
    this.setState({
      [name]: target.value    });
    }

    setSelectedFile = (file) => {
        this.setState({
            file:file
        })
    }


    submitForm = (event) => {
        event.preventDefault();
        // USE APICLIENT TO SEND DATA
        const formData = new FormData();
        // dict of all elements
        formData.append("file", this.state.file);
        formData.append("name", this.state.name);
        formData.append("modelClass", this.state.modelClass);
        formData.append("output", this.state.output);
        console.log(formData);
        this.apiClient.sendModelForm(formData).then((data)=> {
            console.log(data)
            this.props.formSubmitted()
        }).catch((err)=> {
            this.props.raiseFileUploadError();
        })
    };
  
	render () {
    const { t } = this.props;
    return(
        <div>
            
            <form onSubmit={this.submitForm}>
                <label for="name">{t('models.formname')}:</label>
                <br/>
                <input
                id="name"
                type="text"
                name="name"
                value={this.state.name}
                onChange={this.handleChange}
                />
                <br/>

                <label for="class_select">{t('models.formClassSelect')}:</label>
                <br/>
                <select id="class_select" name="modelClass" value={this.state.modelClass} onChange={this.handleChange}>            
                    <option value="HAN">HAN</option>
                    <option value="RF">Random Forest</option>
                </select>
                <br/>

                <label for="output_select">{t('models.formOutputSelect')}:</label>
                <br/>
                <select id="output_select" name="output" value={this.state.output} onChange={this.handleChange}>            
                    <option value="SF">Screen Fail</option>
                    <option value="OS">Patient OS</option>
                </select>
                <br/>

                <this.FileUploader
                onFileSelect={(file) => this.setSelectedFile(file)}
                />
                <br/>
                <input type="submit" value="Envoyer" className="btn btn-primary" />
            </form>
        </div>
    )
    }
}

export default withTranslation()(AddModelForm);