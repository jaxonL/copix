import { createContext } from "react";
import { ISuccessResult } from "@worldcoin/idkit";

export type AuthContextType = {
  currentUser: null | ISuccessResult;
  login: (successAuth: any) => void;
  showConfetti: boolean | undefined;
  setShowConfetti: (showConfetti: boolean | undefined) => void;
};
export const AuthContext = createContext<AuthContextType>({
  currentUser: null, // set a default value
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  login: () => {},
  showConfetti: undefined, // set a default value
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setShowConfetti: () => {},
});
// export const useGlobalContext = () => useContext(MyGlobalContext);
