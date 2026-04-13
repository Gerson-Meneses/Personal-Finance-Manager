import { useNavigate } from "react-router-dom";
import { useAuthContext } from "./authContext";
import { useQueryClient } from "@tanstack/react-query";

export function useLogout() {
  const { setToken, setUser } = useAuthContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return () => {
    setToken(null);
    setUser(null);
    queryClient.clear();
    navigate("/login");
  };
}