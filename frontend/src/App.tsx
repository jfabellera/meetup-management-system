import {
  BrowserRouter as Router,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom';
import './App.css';

import Homepage from './pages/Homepage';
import LoginPage from './pages/LoginPage';
import ManageMeetupAttendeesPage from './pages/ManageMeetupAttendeesPage';
import ManageMeetupHomePage from './pages/ManageMeetupHomePage';
import ManageMeetupSettingsPage from './pages/ManageMeetupSettingsPage';
import NewMeetupPage from './pages/NewMeetupPage';
import OrganizerDashboard from './pages/OrganizerDashboard';
import RegisterPage from './pages/RegisterPage';

import { Provider } from 'react-redux';
import ManageMeetupPage from './pages/ManageMeetupPage';
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
          <Route
            path="/meetup/:meetupId/manage/"
            element={
              <ManageMeetupPage>
                <Outlet />
              </ManageMeetupPage>
            }
          >
            <Route path="" element={<ManageMeetupHomePage />} />
            <Route path="attendees" element={<ManageMeetupAttendeesPage />} />
            <Route path="settings" element={<ManageMeetupSettingsPage />} />
          </Route>
        </Routes>
      </Router>
    </Provider>
  );
};

export default App;
