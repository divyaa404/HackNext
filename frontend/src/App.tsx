import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OrganizerLayout } from './components/OrganizerLayout';
import { AdminLayout } from './components/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { StaffLogin } from './pages/auth/StaffLogin';
import { ChangePassword } from './pages/auth/ChangePassword';
import { JudgeAcceptInvite } from './pages/auth/JudgeAcceptInvite';
import { OrganizerDashboard } from './pages/organizer/OrganizerDashboard';
import { CreateEvent } from './pages/organizer/CreateEvent';
import { EventDetails } from './pages/organizer/EventDetails';
import { ManageEvents } from './pages/organizer/ManageEvents';
import { ManageStaff } from './pages/organizer/ManageStaff';
import { ManageParticipants } from './pages/organizer/ManageParticipants';
import { ManageResets } from './pages/organizer/ManageResets';
import { ExportData } from './pages/organizer/ExportData';
import { ManageSubmissions } from './pages/organizer/ManageSubmissions';
import { ParticipantLayout } from './components/ParticipantLayout';

import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { CreateTeam } from './pages/participant/CreateTeam';
import { JoinTeam } from './pages/participant/JoinTeam';
import { TeamDetails } from './pages/participant/TeamDetails';
import { Profile } from './pages/participant/Profile';
import { Submission } from './pages/participant/Submission';

import { JudgeDashboard } from './pages/judge/JudgeDashboard';
import { HackathonDetails } from './pages/public/HackathonDetails';
import { SetupWizard } from './pages/auth/SetupWizard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/setup" element={<SetupWizard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin/login" element={<StaffLogin />} />
          <Route path="/admin/change-password" element={<ChangePassword />} />
          <Route path="/invite/:token" element={<JudgeAcceptInvite />} />

          {/* Isolated Judge Route */}
          <Route element={<ProtectedRoute allowedRoles={['judge']} />}>
            <Route path="/judge" element={<JudgeDashboard />} />
          </Route>

          {/* Isolated Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<div><h1 className="text-3xl font-bold text-gray-900">Admin Dashboard Home</h1></div>} />
              <Route path="/admin/judges" element={<ManageStaff role="judge" />} />
              <Route path="/admin/resets" element={<ManageResets />} />
              <Route path="/admin/submissions" element={<ManageSubmissions />} />
            </Route>
          </Route>

          {/* Public and Participant Routes */}
          <Route element={<ParticipantLayout />}>
            <Route path="/" element={<HackathonDetails />} />
            <Route path="/participant" element={<Navigate to="/admin/login" replace />} />

            <Route element={<ProtectedRoute allowedRoles={['participant']} />}>
              <Route path="/participant/profile" element={<Profile />} />
              <Route path="/participant/team" element={<TeamDetails />} />
              <Route path="/participant/team/create" element={<CreateTeam />} />
              <Route path="/participant/team/join" element={<JoinTeam />} />
              <Route path="/participant/submission" element={<Submission />} />
              <Route path="/participant/notifications" element={<div className="p-8 bg-bauhaus-card border-4 border-bauhaus-border">Notifications coming soon...</div>} />
              <Route path="/participant/projects" element={<div className="p-8 bg-bauhaus-card border-4 border-bauhaus-border">Projects gallery coming soon...</div>} />
              <Route path="/participant/results" element={<div className="p-8 bg-bauhaus-card border-4 border-bauhaus-border">Results coming soon...</div>} />
            </Route>
          </Route>

          {/* Isolated Organizer Routes */}
          <Route element={<ProtectedRoute allowedRoles={['organizer']} />}>
            <Route element={<OrganizerLayout />}>
              <Route path="/organizer" element={<OrganizerDashboard />} />
              <Route path="/organizer/events" element={<ManageEvents />} />
              <Route path="/organizer/events/new" element={<CreateEvent />} />
              <Route path="/organizer/events/:id" element={<EventDetails />} />

              <Route path="/organizer/admins" element={<ManageStaff role="admin" />} />
              <Route path="/organizer/judges" element={<ManageStaff role="judge" />} />
              <Route path="/organizer/participants" element={<ManageParticipants />} />
              <Route path="/organizer/submissions" element={<ManageSubmissions />} />

              <Route path="/organizer/timeline" element={<div className="p-8"><h2 className="text-2xl font-bold mb-4">Event Timeline</h2><div className="bg-white p-6 rounded shadow border border-gray-200">Timeline features coming soon...</div></div>} />
              <Route path="/organizer/tasks" element={<div className="p-8"><h2 className="text-2xl font-bold mb-4">Task Management</h2><div className="bg-white p-6 rounded shadow border border-gray-200">Task tracking coming soon...</div></div>} />
              <Route path="/organizer/rubrics" element={<div className="p-8"><h2 className="text-2xl font-bold mb-4">Scoring Rubrics</h2><div className="bg-white p-6 rounded shadow border border-gray-200">Rubric editor coming soon...</div></div>} />
              <Route path="/organizer/export" element={<ExportData />} />
              <Route path="/organizer/settings" element={<div className="p-8"><h2 className="text-2xl font-bold mb-4">System Settings</h2><div className="bg-white p-6 rounded shadow border border-gray-200">Settings panel coming soon...</div></div>} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;