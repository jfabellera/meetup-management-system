import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';

import Homepage from './pages/Homepage';
import LoginPage from './pages/LoginPage';
import NewMeetupPage from './pages/NewMeetupPage';
import OrganizerDashboard from './pages/OrganizerDashboard';
import OrganizerMeetupPage from './pages/OrganizerMeetupPage';
import RegisterPage from './pages/RegisterPage';

import { Provider } from 'react-redux';
import { store } from './store/store';

const App = (): JSX.Element => {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/organizer" element={<OrganizerDashboard />} />
          <Route path="/newmeetup" element={<NewMeetupPage />} />
          <Route path="/meetup/:meetupId" element={<OrganizerMeetupPage />} />
        </Routes>
      </Router>
    </Provider>
  );
};

export default App;
