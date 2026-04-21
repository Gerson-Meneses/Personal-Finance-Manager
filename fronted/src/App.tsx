import { Routes, Route } from "react-router-dom";
import { PublicLayout } from "./pages/public/publicLayout";
import { LoginPage } from "./pages/public/loginPage/loginPage";
import { RegisterPage } from './pages/public/registerPage/registerPage'
import { PrivateLayout } from "./pages/private/privateLayout";
import { AccountPage } from "./pages/private/accounts/accountPage";
import { AccountDetail } from "./pages/private/accounts/AccountDetails/accountDetail";
import { TransactionsPage } from "./pages/private/transactions/transactionsPage";
import DashboardPage from "./pages/private/dashboard/dashboard";
import LoansPage from "./pages/private/loans/loans";
import CategoriesPage from "./pages/private/categories/categories";
import NotFoundView from "./shared/components/NotFoundView/NotFoundView";
import UnderConstructionView from "./shared/components/UnderConstruction/UnderConstruction";
import { VerifyEmailPage } from "./pages/public/verifyEmail/VerifyEmail";
import { ResetPasswordPage } from "./pages/public/ResetPassword/ResetPassword";
import "./App.css"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PrivateLayout> < DashboardPage /> </PrivateLayout>} ></Route>
      <Route path="/accounts" element={<PrivateLayout> < AccountPage /> </PrivateLayout>}></Route>
      <Route path="/accounts/:id" element={<PrivateLayout> < AccountDetail /> </PrivateLayout>}></Route>
      <Route path="/login" element={<PublicLayout> <LoginPage /> </PublicLayout>} />
      <Route path="/register" element={<PublicLayout> <RegisterPage /></PublicLayout>} ></Route>
      <Route path="/verify-email" element={<PublicLayout> <VerifyEmailPage /></PublicLayout>} />
      <Route path="/reset-password" element={<PublicLayout> <ResetPasswordPage /></PublicLayout>} />
      <Route path="/transactions" element={<PrivateLayout> < TransactionsPage /> </PrivateLayout>} ></Route>
      <Route path="/categories" element={<PrivateLayout> < CategoriesPage /> </PrivateLayout>} ></Route>
      <Route path="/loans" element={<PrivateLayout> < LoansPage /> </PrivateLayout>} ></Route>
      <Route path="/construction" element={<UnderConstructionView />}></Route>
      <Route path="/*" element={<NotFoundView></NotFoundView>} > </Route>
    </Routes>
  );
}
