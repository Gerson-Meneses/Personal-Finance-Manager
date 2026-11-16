import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { PublicLayout } from "./pages/public/publicLayout";
import { PrivateLayout } from "./pages/private/privateLayout";
import LoadingScreen from "./shared/components/LoadingScreen/LoadingScreen";
import NotFoundView from "./shared/components/NotFoundView/NotFoundView";
import UnderConstructionView from "./shared/components/UnderConstruction/UnderConstruction";
import "./App.css";

const LoginPage = lazy(() =>
  import("./pages/public/loginPage/loginPage").then((module) => ({ default: module.LoginPage }))
);
const RegisterPage = lazy(() =>
  import("./pages/public/registerPage/registerPage").then((module) => ({ default: module.RegisterPage }))
);
const VerifyEmailPage = lazy(() =>
  import("./pages/public/verifyEmail/VerifyEmail").then((module) => ({ default: module.VerifyEmailPage }))
);
const ResetPasswordPage = lazy(() =>
  import("./pages/public/ResetPassword/ResetPassword").then((module) => ({ default: module.ResetPasswordPage }))
);

const DashboardPage = lazy(() => import("./pages/private/dashboard/dashboard"));
const ReportsPage = lazy(() => import("./pages/private/reports/ReportsPage"));
const AccountPage = lazy(() =>
  import("./pages/private/accounts/accountPage").then((module) => ({ default: module.AccountPage }))
);
const AccountDetail = lazy(() =>
  import("./pages/private/accounts/AccountDetails/accountDetail").then((module) => ({ default: module.AccountDetail }))
);
const TransactionsPage = lazy(() =>
  import("./pages/private/transactions/transactionsPage").then((module) => ({ default: module.TransactionsPage }))
);
const CategoriesPage = lazy(() => import("./pages/private/categories/categories"));
const LoansPage = lazy(() =>
  import("./pages/private/loans/loans").then((module) => ({ default: module.LoansPage }))
);
const LoansByLender = lazy(() =>
  import("./pages/private/loans/LoansByLender/LoansByLender").then((module) => ({ default: module.LoansByLender }))
);
const RecurringPaymentsPage = lazy(() => import("./pages/private/recurring/RecurringPaymentsPage"));
const BudgetsPage = lazy(() => import("./pages/private/budgets/BudgetsPage"));
const ContactsPage = lazy(() => import("./pages/private/contacts/ContactsPage"));
const ProfilePage = lazy(() => import("./pages/private/profile/profilePage"));
const AdminPanelPage = lazy(() => import("./pages/private/admin/adminPanelPage"));

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen message="Cargando vista..." />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Route>

        <Route element={<PrivateLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/accounts" element={<AccountPage />} />
          <Route path="/accounts/:id" element={<AccountDetail />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/loans" element={<LoansPage />} />
          <Route path="/loans/:lender" element={<LoansByLender />} />
          <Route path="/recurring" element={<RecurringPaymentsPage />} />
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPanelPage />} />
        </Route>

        <Route path="/construction" element={<UnderConstructionView />} />
        <Route path="/*" element={<NotFoundView />} />
      </Routes>
    </Suspense>
  );
}
