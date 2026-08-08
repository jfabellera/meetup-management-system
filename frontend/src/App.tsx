import { lazy, Suspense, type ReactNode } from 'react';
import {
  Navigate,
  Outlet,
  Route,
  BrowserRouter as Router,
  Routes,
} from 'react-router-dom';
import './App.css';

import CheckInPage from './pages/CheckInPage';
import Homepage from './pages/Homepage';
import LoginPage from './pages/LoginPage';
import ManageMeetupAttendeesPage from './pages/ManageMeetupAttendeesPage';
import ManageMeetupHomePage from './pages/ManageMeetupHomePage';
import ManageMeetupPage from './pages/ManageMeetupPage';
import ManageMeetupSettingsPage from './pages/ManageMeetupSettingsPage';
import NewMeetupPage from './pages/NewMeetupPage';
import OrganizerDashboard from './pages/OrganizerDashboard';
import ProfilePage from './pages/ProfilePage';
import RafflePage from './pages/RafflePage';
import RegisterPage from './pages/RegisterPage';

import { Provider } from 'react-redux';
import {
  RequireAdmin,
  RequireAuth,
  RequireGuest,
  RequireMeetup,
  RequireMeetupOrganizer,
  RequireOrganizer,
} from './components/Guards/Guards';
import MainLayout from './components/Page/MainLayout';
import { TooltipProvider } from './components/ui/tooltip';
import AccountPage from './pages/AccountPage';
import AdminGroupsPage from './pages/AdminGroupsPage';
import AdminPage from './pages/AdminPage';
import AdminRequestsPage from './pages/AdminRequestsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AuthorizeEventbritePage from './pages/AuthorizeEventbritePage';
import DiscordCallbackPage from './pages/DiscordCallbackPage';
import DiscordLinkPage from './pages/DiscordLinkPage';
import GuestRsvpCancelPage from './pages/GuestRsvpCancelPage';
import GuestRsvpConfirmPage from './pages/GuestRsvpConfirmPage';
import { ManageMeetupDisplayPage } from './pages/ManageMeetupDisplayPage';
import MeetupDisplayPage from './pages/MeetupDisplayPage';
import NewArchiveMeetupPage from './pages/NewArchiveMeetupPage';
import NewMeetupFromEventbritePage from './pages/NewMeetupFromEventbritePage';
import OrganizerPaymentTermsPage from './pages/OrganizerPaymentTermsPage';
import RsvpReturnPage from './pages/RsvpReturnPage';
import StripeRefreshPage from './pages/StripeRefreshPage';
import StripeReturnPage from './pages/StripeReturnPage';
import KioskCheckInPage from './pages/KioskCheckInPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import { store } from './store/store';
import { useKioskConfig } from './util/kioskMode';

const MapPage = lazy(async () => import('./pages/MapPage'));

const App = (): ReactNode => {
  const kioskConfig = useKioskConfig();

  if (kioskConfig != null) {
    return (
      <TooltipProvider>
        <Provider store={store}>
          <Router>
            <Routes>
              <Route
                path="/meetup/:meetupId/manage/checkin"
                element={<KioskCheckInPage />}
              />
              <Route
                path="*"
                element={
                  <Navigate
                    to={`/meetup/${kioskConfig.meetup}/manage/checkin`}
                    replace
                  />
                }
              />
            </Routes>
          </Router>
        </Provider>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Provider store={store}>
        <Router>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Homepage />} />
              <Route
                path="/map"
                element={
                  <Suspense fallback={null}>
                    <MapPage />
                  </Suspense>
                }
              />
              <Route path="/meetup/:meetupId" element={<Homepage />} />
              <Route path="/meetup/:meetupId/rsvp" element={<Homepage />} />
            </Route>
            <Route
              path="/login"
              element={
                <RequireGuest>
                  <LoginPage />
                </RequireGuest>
              }
            />
            <Route
              path="/register"
              element={
                <RequireGuest>
                  <RegisterPage />
                </RequireGuest>
              }
            />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route
              path="/auth/discord/callback"
              element={<DiscordCallbackPage />}
            />
            <Route path="/auth/discord/link" element={<DiscordLinkPage />} />
            <Route path="/rsvp/return" element={<RsvpReturnPage />} />
            <Route path="/rsvp/confirm" element={<GuestRsvpConfirmPage />} />
            <Route path="/rsvp/cancel" element={<GuestRsvpCancelPage />} />
            <Route
              path="/organizer"
              element={
                <RequireOrganizer>
                  <OrganizerDashboard />
                </RequireOrganizer>
              }
            />
            <Route path="/user/:username" element={<ProfilePage />} />
            <Route path="/user/:username/:tab" element={<ProfilePage />} />
            <Route
              path="/new-meetup"
              element={
                <RequireOrganizer>
                  <NewMeetupPage />
                </RequireOrganizer>
              }
            />
            <Route
              path="/new-meetup/archive"
              element={
                <RequireOrganizer>
                  <NewArchiveMeetupPage />
                </RequireOrganizer>
              }
            />
            <Route
              path="/new-meetup/eventbrite"
              element={
                <RequireOrganizer>
                  <NewMeetupFromEventbritePage />
                </RequireOrganizer>
              }
            />
            <Route
              path="/meetup/:meetupId/manage/"
              element={
                <RequireMeetupOrganizer>
                  <ManageMeetupPage>
                    <Outlet />
                  </ManageMeetupPage>
                </RequireMeetupOrganizer>
              }
            >
              <Route path="" element={<ManageMeetupHomePage />} />
              <Route path="checkin" element={<CheckInPage />} />
              <Route path="raffle" element={<RafflePage />} />
              <Route path="display" element={<ManageMeetupDisplayPage />} />
              <Route path="attendees" element={<ManageMeetupAttendeesPage />} />
              <Route path="settings" element={<ManageMeetupSettingsPage />} />
            </Route>
            <Route
              path="/meetup/:meetupId/display"
              element={
                <RequireMeetup>
                  <MeetupDisplayPage />
                </RequireMeetup>
              }
            />
            <Route
              path="/account/authorize-eventbrite"
              element={
                <RequireAuth>
                  <AuthorizeEventbritePage />
                </RequireAuth>
              }
            />
            <Route
              path="/account/stripe/return"
              element={
                <RequireOrganizer>
                  <StripeReturnPage />
                </RequireOrganizer>
              }
            />
            <Route
              path="/account/stripe/refresh"
              element={
                <RequireOrganizer>
                  <StripeRefreshPage />
                </RequireOrganizer>
              }
            />
            <Route
              path="/legal/organizer-payment-terms"
              element={<OrganizerPaymentTermsPage />}
            />
            <Route
              path="/account"
              element={
                <RequireAuth>
                  <AccountPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminPage>
                    <Outlet />
                  </AdminPage>
                </RequireAdmin>
              }
            >
              <Route path="" element={<AdminRequestsPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="groups" element={<AdminGroupsPage />} />
            </Route>
          </Routes>
        </Router>
      </Provider>
    </TooltipProvider>
  );
};

export default App;
