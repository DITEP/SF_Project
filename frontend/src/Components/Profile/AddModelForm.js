import React, {useRef} from "react";
import APIClient from '../../Actions/apiClient';

import i18n from "i18next";
import { withTranslation } from 'react-i18next';


class AddModelForm extends React.Component {
	constructor(props) {
		super(props);
        this.state = { 
            name:"",
            modelClass:"",
            file:null,
            output:""
        }
	}

    async componentDidMount() {
        this.apiClient = new APIClient();
    }

    FileUploader = ({onFileSelect}) => {
        const fileInput = useRef(null)
    
        const handleFileInput = (e) => {
            // handle validations
            onFileSelect(e.target.files[0])
        }
    
        return (
            <div className="file-uploader">
                <input type="file" onChange={handleFileInput}/>
                <button onClick={e => fileInput.current && fileInput.current.click()} className="btn btn-primary"/>
            </div>
        )
    }

    setSelectedFile = (file) => {
        this.setState({
            file:file
        })
    }

    submitForm = () => {
        const formData = new FormData();
        // USE APICLIENT TO SEND DATA

    };
  
	render () {
    const { t } = this.props;
    return(
        <div>
            <form>
                <input
                type="text"
                value={this.state.name}
                onChange={(e) => setName(e.target.value)}
                />

                <FileUploader
                onFileSelect={(file) => setSelectedFile(file)}
                />

                <button onClick={submitForm}>Submit</button>
            </form>
        </div>
    )
    }
}

export default withTranslation()(AddModelForm);