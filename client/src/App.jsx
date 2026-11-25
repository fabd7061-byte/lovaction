import { Route, Routes } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import { AdminRoute, GuestRoute, MemberRoute } from "./components/RouteGuards.jsx";

import Home from "./pages/public/Home.jsx";
import About from "./pages/public/About.jsx";
import PublicNews from "./pages/public/News.jsx";
import NewsDetail from "./pages/public/NewsDetail.jsx";
import PublicGallery from "./pages/public/Gallery.jsx";
import PublicMembers from "./pages/public/Members.jsx";
import TopMembers from "./pages/public/TopMembers.jsx";
import Join from "./pages/public/Join.jsx";
import Contact from "./pages/public/Contact.jsx";
import Login from "./pages/public/Login.jsx";
import NotFound from "./pages/public/NotFound.jsx";

import MemberOverview from "./pages/member/Overview.jsx";
import MemberReferrals from "./pages/member/Referrals.jsx";
import MemberPoints from "./pages/member/Points.jsx";
import MemberTree from "./pages/member/Tree.jsx";
import MemberRanking from "./pages/member/Ranking.jsx";
import MemberProfile from "./pages/member/Profile.jsx";
import MemberSettings from "./pages/member/Settings.jsx";

import AdminOverview from "./pages/admin/Overview.jsx";
import AdminApplications from "./pages/admin/Applications.jsx";
import AdminApplicationDetail from "./pages/admin/ApplicationDetail.jsx";
import AdminMembers from "./pages/admin/Members.jsx";
import AdminMemberDetail from "./pages/admin/MemberDetail.jsx";
import AdminReferrals from "./pages/admin/Referrals.jsx";
import AdminPoints from "./pages/admin/Points.jsx";
import AdminNews from "./pages/admin/News.jsx";
import AdminGallery from "./pages/admin/Gallery.jsx";
import AdminMessages from "./pages/admin/Messages.jsx";
import AdminReports from "./pages/admin/Reports.jsx";
import AdminAudit from "./pages/admin/Audit.jsx";
import AdminSettings from "./pages/admin/Settings.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="news" element={<PublicNews />} />
        <Route path="news/:slug" element={<NewsDetail />} />
        <Route path="gallery" element={<PublicGallery />} />
        <Route path="members" element={<PublicMembers />} />
        <Route path="top-members" element={<TopMembers />} />
        <Route path="join" element={<Join />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <MemberRoute>
            <DashboardLayout variant="member" />
          </MemberRoute>
        }
      >
        <Route index element={<MemberOverview />} />
        <Route path="referrals" element={<MemberReferrals />} />
        <Route path="points" element={<MemberPoints />} />
        <Route path="tree" element={<MemberTree />} />
        <Route path="ranking" element={<MemberRanking />} />
        <Route path="profile" element={<MemberProfile />} />
        <Route path="settings" element={<MemberSettings />} />
      </Route>

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <DashboardLayout variant="admin" />
          </AdminRoute>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="applications" element={<AdminApplications />} />
        <Route path="applications/:id" element={<AdminApplicationDetail />} />
        <Route path="members" element={<AdminMembers />} />
        <Route path="members/:id" element={<AdminMemberDetail />} />
        <Route path="referrals" element={<AdminReferrals />} />
        <Route path="points" element={<AdminPoints />} />
        <Route path="news" element={<AdminNews />} />
        <Route path="gallery" element={<AdminGallery />} />
        <Route path="messages" element={<AdminMessages />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="audit" element={<AdminAudit />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  );
}
