import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import './App.css'

import AttendeeList from './pages/AttendeeList';
import CheckIn from './pages/CheckIn';
import Home from './pages/Home'
import ImportAttendees from './pages/ImportAttendees';
import Raffle from './pages/Raffle';
import TypingTest from './pages/TypingTest';
import Homepage from './pages/Homepage'

import {store} from './store/store';
import { Provider } from "react-redux";


function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/home" element={<Home/>} />
          <Route path="/checkin" element={<CheckIn/>} />
          <Route path="/raffle" element={<Raffle/>} />
          <Route path="/typing_test" element={<TypingTest/>} />
          <Route path="/attendees" element={<AttendeeList/>} />
          <Route path="/import" element={<ImportAttendees/>} />
          <Route path="/" element={<Homepage/>} />
        </Routes>
      </Router>
    </Provider>
  );
}
export default App
