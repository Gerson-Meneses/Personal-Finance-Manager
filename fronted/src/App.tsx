import { Routes, Route } from "react-router-dom";
import { LoginPage } from "./pages/public/loginPage/loginPage";
import { RegisterPage } from './pages/public/registerPage/registerPage'
import "./App.css"
import { PublicLayout } from "./pages/public/publicLayout";
import { PrivateLayout } from "./pages/private/privateLayout";
import { TransactionsPage } from "./pages/private/transactions/transactionsPage";
import CategoriesPage from "./pages/private/categories/categories";
import LoansPage from "./pages/private/loans/loans";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicLayout> <LoginPage /> </PublicLayout>} />
      <Route path="/register" element={<PublicLayout> <RegisterPage /></PublicLayout>} ></Route>
      <Route path="/transactions" element={<PrivateLayout> < TransactionsPage /> </PrivateLayout>} ></Route>
      <Route path="/categories" element={<PrivateLayout> < CategoriesPage /> </PrivateLayout>} ></Route>
      <Route path="/loans" element={<PrivateLayout> < LoansPage /> </PrivateLayout>} ></Route>
    </Routes>
  );
}
