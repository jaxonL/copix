import { createContext } from "react";
import { ISuccessResult } from "@worldcoin/idkit";

export type AuthContextType = {
  currentUser: null | ISuccessResult;
  login: (successAuth: any) => void;
};
export const AuthContext = createContext<AuthContextType>({
  currentUser: null, // set a default value
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  login: () => {},
});
// export const useGlobalContext = () => useContext(MyGlobalContext);
