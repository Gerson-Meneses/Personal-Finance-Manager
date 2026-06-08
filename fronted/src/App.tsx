import { Routes, Route } from "react-router-dom";
import { PublicLayout } from "./pages/public/publicLayout";
import { LoginPage } from "./pages/public/loginPage/loginPage";
import { RegisterPage } from './pages/public/registerPage/registerPage'
import { PrivateLayout } from "./pages/private/privateLayout";
import { AccountPage } from "./pages/private/accounts/accountPage";
import { AccountDetail } from "./pages/private/accounts/AccountDetails/accountDetail";
import { TransactionsPage } from "./pages/private/transactions/transactionsPage";
import DashboardPage from "./pages/private/dashboard/dashboard";
import { LoansPage } from "./pages/private/loans/loans";
import CategoriesPage from "./pages/private/categories/categories";
import NotFoundView from "./shared/components/NotFoundView/NotFoundView";
import UnderConstructionView from "./shared/components/UnderConstruction/UnderConstruction";
import { VerifyEmailPage } from "./pages/public/verifyEmail/VerifyEmail";
import { ResetPasswordPage } from "./pages/public/ResetPassword/ResetPassword";
import "./App.css"
import { LoansByLender } from "./pages/private/loans/LoansByLender/LoansByLender";


export default function App() {
  return (
    <Routes>

      <Route element={<PublicLayout />}>

        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/register" element={<RegisterPage />} ></Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

      </Route>

      <Route element={<PrivateLayout />} >

        <Route path="/" element={< DashboardPage />} ></Route>
        <Route path="/accounts" element={< AccountPage />}></Route>
        <Route path="/accounts/:id" element={< AccountDetail />}></Route>
        <Route path="/categories" element={< CategoriesPage />} ></Route>
        <Route path="/loans" element={< LoansPage />} ></Route>
        <Route path="/loans/:lender" element={< LoansByLender />} ></Route>
        <Route path="/transactions" element={< TransactionsPage />} ></Route>

      </Route>

      <Route path="/construction" element={<UnderConstructionView />}></Route>
      <Route path="/*" element={<NotFoundView></NotFoundView>} > </Route>
    </Routes >
  );
}
