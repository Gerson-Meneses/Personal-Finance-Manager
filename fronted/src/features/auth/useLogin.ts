import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { login } from "./services";
import { useAuthContext } from "./authContext";
import type { DataAuth, LoginDTO } from "./types";
import type { DataError } from "../../shared/dataApiInterface";

export function useLogin() {
  const { setToken } = useAuthContext();
  const navigate = useNavigate();

  return useMutation<DataAuth, DataError<LoginDTO>, LoginDTO>({
    mutationFn: login,
    onSuccess: (data) => {
      setToken(data.token);
      navigate("/");
    },
  });
}