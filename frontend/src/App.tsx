import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import './App.css'

import Homepage from './pages/Homepage'

import {store} from './store/store';
import { Provider } from "react-redux";


function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<Homepage/>} />
        </Routes>
      </Router>
    </Provider>
  );
}
export default App
