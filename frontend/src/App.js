import React, {Suspense} from 'react';
import { Route, Switch, BrowserRouter as Router } from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Header from './Components/Header/Header';
import Info from './Components/Info';
import Login from './Components/Login/Login';
import Register from './Components/Register/Register';
import HANPrediction from './Components/HANPrediction/HANPrediction';
import RFPrediction from './Components/RFPrediction/RFPrediction';
import Patients from './Components/Patients/Patients';
import Profile from './Components/Profile/Profile';
import Deleted from './Components/Deleted/Deleted';
import NetworkError from './Components/NetworkError/NetworkError';
function App() {
    return (
      <Router>
        <div className="App">
	        <Suspense fallback={(<div>Loading</div>)}>
            <div id='wrapper'>
              <header className="App-header">
    		        <div className='header-contents'>
                  <Header />
   		          </div>
              </header>
            
             <Switch>
               <Route path="/" exact component={RFPrediction} />
               <Route path="/register" component={Register} />
               <Route path="/login" component={Login} />
               <Route path="/hanprediction" component={HANPrediction} />
               <Route path="/rfprediction" component={RFPrediction} />
               <Route path="/patients" component={Patients} />
               <Route path="/profile" component={Profile} />
               <Route path="/deleted" component={Deleted} />
               <Route path="/networkerror" component={NetworkError} />
             </Switch>
            
            </div>
        	</Suspense>
        </div>
      </Router>
    );
  }

export default App;
