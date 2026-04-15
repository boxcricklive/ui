/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import Dashboard from './pages/Dashboard';
import MatchSetup from './pages/MatchSetup';
import MatchCreated from './pages/MatchCreated';
import SquadSetup from './pages/SquadSetup';
import Scoring from './pages/Scoring';
import MatchesList from './pages/MatchesList';
import JoinMatch from './pages/JoinMatch';
import PlayerProfile from './pages/PlayerProfile';
import Stats from './pages/Stats';

export default function App() {
  return (
    <Router>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/match-setup" element={<MatchSetup />} />
        <Route path="/join-match" element={<JoinMatch />} />
        <Route path="/match-created/:matchId" element={<MatchCreated />} />
        <Route path="/squad-setup/:matchId" element={<SquadSetup />} />
        <Route path="/scoring/:matchId" element={<Scoring />} />
        <Route path="/matches" element={<MatchesList />} />
        <Route path="/profile" element={<PlayerProfile />} />
        <Route path="/stats" element={<Stats />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
