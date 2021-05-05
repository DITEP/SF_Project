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
            output:"SF"
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


    submitForm = () => {
        // USE APICLIENT TO SEND DATA
        const formData = new FormData();
        // dict of all elements
        formData.append("file", this.state.file);
        formData.append("name", this.state.name);
        formData.append("modelClass", this.state.modelClass);
        formData.append("output", this.state.output);

    };
  
	render () {
    const { t } = this.props;
    return(
        <div>
            <form>
                <input
                type="text"
                name="name"
                value={this.state.name}
                onChange={this.handleChange}
                />

                <select name="modelClass" value={this.state.modelClass} onChange={this.handleChange}>            
                    <option value="HAN">HAN</option>
                    <option value="RF">Random Forest</option>
                </select>

                <select name="output" value={this.state.output} onChange={this.handleChange}>            
                    <option value="SF">Screen Fail</option>
                    <option value="OS">Patient OS</option>
                </select>

                <this.FileUploader
                onFileSelect={(file) => this.setSelectedFile(file)}
                />

                <button onClick={this.submitForm}>Submit</button>
            </form>
        </div>
    )
    }
}

export default withTranslation()(AddModelForm);