import { Routes, Route } from "react-router-dom";
import { LoginPage } from "./pages/public/loginPage/loginPage";
import { RegisterPage } from './pages/public/registerPage/registerPage'
import "./App.css"
import { PublicLayout } from "./pages/public/publicLayout";
import { PrivateLayout } from "./pages/private/privateLayout";
import { TransactionsPage } from "./pages/private/transactions/transactionsPage";
import CategoriesPage from "./pages/private/categories/categories";
import LoansPage from "./pages/private/loans/loans";
import DashboardPage from "./pages/private/dashboard/dashboard";
import { AccountPage } from "./pages/private/accounts/accountPage";
import AccountDetail from "./pages/private/accounts/accountDetail";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PrivateLayout> < DashboardPage /> </PrivateLayout>} ></Route>
      <Route path="/accounts" element={<PrivateLayout> < AccountPage /> </PrivateLayout>}></Route>
      <Route path="/accounts/:id" element={<PrivateLayout> < AccountDetail /> </PrivateLayout>}></Route>
      <Route path="/login" element={<PublicLayout> <LoginPage /> </PublicLayout>} />
      <Route path="/register" element={<PublicLayout> <RegisterPage /></PublicLayout>} ></Route>
      <Route path="/transactions" element={<PrivateLayout> < TransactionsPage /> </PrivateLayout>} ></Route>
      <Route path="/categories" element={<PrivateLayout> < CategoriesPage /> </PrivateLayout>} ></Route>
      <Route path="/loans" element={<PrivateLayout> < LoansPage /> </PrivateLayout>} ></Route>
    </Routes>
  );
}
