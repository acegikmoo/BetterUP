import { authApi } from "./auth";
import { websitesApi } from "./websites";
import { regionsApi } from "./regions";

export const api = {
  auth: authApi,
  websites: websitesApi,
  regions: regionsApi,
};
