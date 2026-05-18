import { Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";

import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgetPass from "./components/Forgetpass";
import ResetPass from "./components/ResetPass";
import Adminlogin from "./components/Adminlogin";
import AdminPage from "./components/AdminPage";
import About from "./components/About";
import Contact from "./components/Contact";
import InnovatorPage from "./components/InnovatorPage";
import FunderPage from "./components/FunderPage";
import ShowEvents from "./components/ShowEvents";
import EventsPage from "./components/EventsPage";
import IdeasBoard from "./components/IdeasBoard";
import FeedbackPage from "./components/FeedbackPage";
import ReportsPage from "./components/ReportsPage";
import FundingPage from "./components/FundingPage";
import CertificatesPage from "./components/CertificatesPage";
import NotificationsPage from "./components/NotificationsPage";
import UserManagementPage from "./components/UserManagementPage";
import ReviewerRegister from "./components/ReviewerRegister";
import ReviewerInvitePage from "./components/ReviewerInvitePage";
import ReviewerPage from "./components/ReviewerPage";
import ProfilePage from "./components/ProfilePage";

import EventQrScanPage from "./components/EventQrScanPage";
import ActivityFeed from "./components/ActivityFeed";
import ForumPage from "./components/ForumPage";
import GuidedTour from "./components/GuidedTour";

import "bootstrap/dist/css/bootstrap.min.css";
import "./theme.css";

function App() {
  return (
    <AppProvider>
      
      <GuidedTour />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgetpass" element={<ForgetPass />} />
        <Route path="/resetpass" element={<ResetPass />} />
        <Route path="/adminlogin" element={<Adminlogin />} />
        <Route path="/admin" element={<AdminPage />} />

        <Route path="/reviewer-invite" element={<ReviewerInvitePage />} />
        <Route path="/reviewer-register" element={<ReviewerRegister />} />
        <Route path="/reviewer" element={<ReviewerPage />} />

        <Route path="/innovator" element={<InnovatorPage />} />
        <Route path="/funder" element={<FunderPage />} />

        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/events-ui" element={<ShowEvents />} />

        <Route path="/events" element={<EventsPage />} />
        <Route path="/event-check/:eventId/:type/:token" element={<EventQrScanPage />} />
        <Route path="/ideas" element={<IdeasBoard />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/funding" element={<FundingPage />} />
        <Route path="/certificates" element={<CertificatesPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/activity" element={<ActivityFeed />} />
        <Route path="/forum" element={<ForumPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin/users" element={<UserManagementPage />} />

        <Route path="*" element={<Home />} />
      </Routes>
    </AppProvider>
  );
}

export default App;