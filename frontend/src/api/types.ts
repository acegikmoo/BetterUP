export interface Website {
  id: string;
  url: string;
  name: string | null;
  time_added: string;
  user_id: string;
}

export interface Region {
  id: string;
  name: string;
}

export interface AuthResponse {
  token: string;
}

