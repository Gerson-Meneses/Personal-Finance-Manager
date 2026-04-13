import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { register } from "./services";
import { useAuthContext } from "./authContext";
import type { DataError } from "../../shared/dataApiInterface";
import type { DataAuth, RegisterDTO } from "./types";

export function useRegister() {
  const { setToken } = useAuthContext();
  const navigate = useNavigate();

  return useMutation<DataAuth, DataError<RegisterDTO>, RegisterDTO>({
    mutationFn: register,
    onSuccess: (data) => {
      setToken(data.token);
      navigate("/");
    },
  });
}