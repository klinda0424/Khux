import { createBrowserRouter } from "react-router";
import { Home } from "./pages/home";
import { ArticleDetail } from "./pages/article-detail";
import { Recruit } from "./pages/recruit";
import { AdminLogin } from "./pages/admin-login";
import { AdminDashboard } from "./pages/admin-dashboard";
import { AdminApplications } from "./pages/admin-applications";
import { Layout } from "./components/layout";
import { NotFound } from "./pages/not-found";
import { ReviewLogin } from "./pages/review-login";
import { DiscordCallback } from "./pages/discord-callback";
import { ReviewDashboard } from "./pages/review-dashboard";
import { ReviewForm } from "./pages/review-form";
import { AdminReview } from "./pages/admin-review";
import { Notice } from "./pages/notice";
import { Members } from "./pages/members";
import { MembersNotice } from "./pages/members-notice";
import { WhenToMeet } from "./pages/when-to-meet";
import { WhenToMeetMembers } from "./pages/when-to-meet-members";
import { WhenToMeetSchedule } from "./pages/when-to-meet-schedule";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "recruit", Component: Recruit },
      { path: "notice", Component: Notice },
      { path: "articles/:id", Component: ArticleDetail },
      { path: "*", Component: NotFound },
    ],
  },
  {
    path: "/admin/login",
    Component: AdminLogin,
  },
  {
    path: "/admin/dashboard",
    Component: AdminDashboard,
  },
  {
    path: "/admin/review",
    Component: AdminReview,
  },
  {
    path: "/admin/applications",
    Component: AdminApplications,
  },
  {
    path: "/review/login",
    Component: ReviewLogin,
  },
  {
    path: "/members/login",
    Component: ReviewLogin,
  },
  {
    path: "/members",
    Component: Members,
  },
  {
    path: "/members/notice",
    Component: MembersNotice,
  },
  {
    path: "/auth/discord/callback",
    Component: DiscordCallback,
  },
  {
    path: "/review",
    Component: ReviewDashboard,
  },
  {
    path: "/review/:sessionId/:targetId",
    Component: ReviewForm,
  },
  {
    path: "/when-to-meet",
    Component: WhenToMeet,
  },
  {
    path: "/when-to-meet/members",
    Component: WhenToMeetMembers,
  },
  {
    path: "/when-to-meet/schedule/:discordId",
    Component: WhenToMeetSchedule,
  },
]);
