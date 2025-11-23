import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import SectionHeadLayout from './layouts/SectionHeadLayout';
import StafferLayout from './layouts/StafferLayout';
import ClientLayout from './layouts/ClientLayout';
import RoleLayout from './layouts/RoleLayout';
import ExecutiveLayout from './layouts/ExecutiveLayout';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminCalendar from './pages/admin/Calendar';
import AdminClientAvailabilityCalendar from './pages/admin/ClientAvailabilityCalendar';
import AdminAssignment from './pages/admin/Assignment';
import AdminCompletedAssignments from './pages/admin/CompletedAssignments';
import AdminStaffer from './pages/admin/Staffer';
import AdminSettings from './pages/admin/Settings';
import AdminRequests from './pages/admin/Requests';

// Section Head pages
import SectionHeadCalendar from './pages/section-head/Calendar';
import SectionHeadAssignment from './pages/section-head/Assignment';
import SectionHeadAssignmentNotification from './pages/section-head/AssignmentNotification';

// Staffer pages
import StafferCalendar from './pages/staffer/Calendar';
import StafferAssignment from './pages/staffer/Assignment';
import StafferAssignmentNotification from './pages/staffer/AssignmentNotification';

// Client pages
import ClientCalendar from './pages/client/Calendar';
import ClientRequest from './pages/client/Request';

// Role-specific pages
import EditorInChiefDashboard from './pages/editor-in-chief/Dashboard';
import EditorInChiefMyTeam from './pages/editor-in-chief/MyTeam';
import EditorInChiefAssignment from './pages/editor-in-chief/Assignment';
import EditorInChiefCoverage from './pages/editor-in-chief/Coverage';
import EditorInChiefProfile from './pages/editor-in-chief/Profile';
import EditorInChiefAssignmentNotification from './pages/editor-in-chief/AssignmentNotification';
import EditorInChiefCompletedAssignments from './pages/editor-in-chief/CompletedAssignments';
import AssociateEditorDashboard from './pages/associate-editor/Dashboard';
import AssociateEditorAssignmentNotification from './pages/associate-editor/AssignmentNotification';
import AssociateEditorCompletedAssignments from './pages/associate-editor/CompletedAssignments';
import ManagingEditorDashboard from './pages/managing-editor/Dashboard';
import ManagingEditorAssignmentNotification from './pages/managing-editor/AssignmentNotification';
import ManagingEditorCompletedAssignments from './pages/managing-editor/CompletedAssignments';
import ExecutiveSecretaryDashboard from './pages/executive-secretary/Dashboard';
import ExecutiveSecretaryAssignmentNotification from './pages/executive-secretary/AssignmentNotification';
import ExecutiveSecretaryCompletedAssignments from './pages/executive-secretary/CompletedAssignments';
import ScribeCalendar from './pages/scribe/Calendar';
import ScribeDashboard from './pages/scribe/Dashboard';
import ScribeAssignment from './pages/scribe/Assignment';
import ScribeAssignmentNotification from './pages/scribe/AssignmentNotification';
import ScribeCompletedAssignments from './pages/scribe/CompletedAssignments';
import CreativeCalendar from './pages/creative/Calendar';
import CreativeDashboard from './pages/creative/Dashboard';
import CreativeAssignment from './pages/creative/Assignment';
import CreativeAssignmentNotification from './pages/creative/AssignmentNotification';
import CreativeCompletedAssignments from './pages/creative/CompletedAssignments';
import ManagerialCalendar from './pages/managerial/Calendar';
import ManagerialDashboard from './pages/managerial/Dashboard';
import ManagerialAssignment from './pages/managerial/Assignment';
import ManagerialAssignmentNotification from './pages/managerial/AssignmentNotification';
import ManagerialCompletedAssignments from './pages/managerial/CompletedAssignments';
import RegularStaffAssignment from './pages/regular-staff/Assignment';
import RegularStaffCoverage from './pages/regular-staff/Coverage';
import RegularStaffAssignmentNotification from './pages/regular-staff/AssignmentNotification';

// Staffer pages
import StafferProfile from './pages/staffer/Profile';

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="calendar" element={<AdminCalendar />} />
          <Route path="client-availability" element={<AdminClientAvailabilityCalendar />} />
          <Route path="assignment" element={<AdminAssignment />} />
          <Route path="completed" element={<AdminCompletedAssignments />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="staffer" element={<AdminStaffer />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/* Section Head Routes */}
        <Route path="/section-head" element={<SectionHeadLayout />}>
          <Route path="calendar" element={<SectionHeadCalendar />} />
          <Route path="assignment" element={<SectionHeadAssignment />} />
          <Route path="assignment-notification" element={<SectionHeadAssignmentNotification />} />
          <Route index element={<Navigate to="/section-head/assignment" replace />} />
        </Route>

        {/* Staffer Routes */}
        <Route path="/staffer" element={<StafferLayout />}>
          <Route path="calendar" element={<StafferCalendar />} />
          <Route path="assignment" element={<StafferAssignment />} />
          <Route path="assignment-notification" element={<StafferAssignmentNotification />} />
          <Route path="profile" element={<StafferProfile />} />
          <Route index element={<Navigate to="/staffer/assignment" replace />} />
        </Route>

        {/* Client Routes */}
        <Route path="/client" element={<ClientLayout />}>
          <Route path="calendar" element={<ClientCalendar />} />
          <Route path="request" element={<ClientRequest />} />
          <Route index element={<Navigate to="/client/request" replace />} />
        </Route>

        {/* Executive Routes - Use ExecutiveLayout */}
        <Route path="/editor-in-chief" element={<ExecutiveLayout rolePath="editor-in-chief" roleName="Editor-in-Chief" />}>
          <Route path="dashboard" element={<EditorInChiefDashboard />} />
          <Route path="my-team" element={<EditorInChiefMyTeam />} />
          <Route path="assignment" element={<EditorInChiefAssignment />} />
          <Route path="assignment-notification" element={<EditorInChiefAssignmentNotification />} />
          <Route path="completed" element={<EditorInChiefCompletedAssignments />} />
          <Route path="coverage" element={<EditorInChiefCoverage />} />
          <Route path="profile" element={<EditorInChiefProfile />} />
          <Route index element={<Navigate to="/editor-in-chief/my-team" replace />} />
        </Route>

        <Route path="/associate-editor" element={<ExecutiveLayout rolePath="associate-editor" roleName="Associate Editor" />}>
          <Route path="dashboard" element={<AssociateEditorDashboard />} />
          <Route path="my-team" element={<EditorInChiefMyTeam />} />
          <Route path="assignment" element={<EditorInChiefAssignment />} />
          <Route path="assignment-notification" element={<AssociateEditorAssignmentNotification />} />
          <Route path="completed" element={<AssociateEditorCompletedAssignments />} />
          <Route path="coverage" element={<EditorInChiefCoverage />} />
          <Route index element={<Navigate to="/associate-editor/my-team" replace />} />
        </Route>

        <Route path="/managing-editor" element={<ExecutiveLayout rolePath="managing-editor" roleName="Managing Editor" />}>
          <Route path="dashboard" element={<ManagingEditorDashboard />} />
          <Route path="my-team" element={<EditorInChiefMyTeam />} />
          <Route path="assignment" element={<EditorInChiefAssignment />} />
          <Route path="assignment-notification" element={<ManagingEditorAssignmentNotification />} />
          <Route path="completed" element={<ManagingEditorCompletedAssignments />} />
          <Route path="coverage" element={<EditorInChiefCoverage />} />
          <Route index element={<Navigate to="/managing-editor/my-team" replace />} />
        </Route>

        <Route path="/executive-secretary" element={<ExecutiveLayout rolePath="executive-secretary" roleName="Executive Secretary" />}>
          <Route path="dashboard" element={<ExecutiveSecretaryDashboard />} />
          <Route path="my-team" element={<EditorInChiefMyTeam />} />
          <Route path="assignment" element={<EditorInChiefAssignment />} />
          <Route path="assignment-notification" element={<ExecutiveSecretaryAssignmentNotification />} />
          <Route path="completed" element={<ExecutiveSecretaryCompletedAssignments />} />
          <Route path="coverage" element={<EditorInChiefCoverage />} />
          <Route index element={<Navigate to="/executive-secretary/my-team" replace />} />
        </Route>

        <Route path="/scribe" element={<RoleLayout rolePath="scribe" roleName="Scribe" />}>
          <Route path="dashboard" element={<ScribeDashboard />} />
          <Route path="calendar" element={<ScribeCalendar />} />
          <Route path="assignment" element={<ScribeAssignment />} />
          <Route path="assignment-notification" element={<ScribeAssignmentNotification />} />
          <Route path="completed" element={<ScribeCompletedAssignments />} />
          <Route index element={<Navigate to="/scribe/dashboard" replace />} />
        </Route>

        <Route path="/creative" element={<RoleLayout rolePath="creative" roleName="Creative" />}>
          <Route path="dashboard" element={<CreativeDashboard />} />
          <Route path="calendar" element={<CreativeCalendar />} />
          <Route path="assignment" element={<CreativeAssignment />} />
          <Route path="assignment-notification" element={<CreativeAssignmentNotification />} />
          <Route path="completed" element={<CreativeCompletedAssignments />} />
          <Route index element={<Navigate to="/creative/dashboard" replace />} />
        </Route>

        <Route path="/managerial" element={<RoleLayout rolePath="managerial" roleName="Managerial" />}>
          <Route path="dashboard" element={<ManagerialDashboard />} />
          <Route path="calendar" element={<ManagerialCalendar />} />
          <Route path="assignment" element={<ManagerialAssignment />} />
          <Route path="assignment-notification" element={<ManagerialAssignmentNotification />} />
          <Route path="completed" element={<ManagerialCompletedAssignments />} />
          <Route index element={<Navigate to="/managerial/dashboard" replace />} />
        </Route>

        <Route path="/regular-staff" element={<RoleLayout rolePath="regular-staff" roleName="Regular Staff" />}>
          <Route path="dashboard" element={<ManagerialDashboard />} />
          <Route path="calendar" element={<ManagerialCalendar />} />
          <Route path="assignment" element={<RegularStaffAssignment />} />
          <Route path="assignment-notification" element={<RegularStaffAssignmentNotification />} />
          <Route path="coverage" element={<RegularStaffCoverage />} />
          <Route index element={<Navigate to="/regular-staff/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

