export const getUser = () => {
  const u = localStorage.getItem('piplog_user');
  return u ? JSON.parse(u) : null;
};

export const getToken = () => localStorage.getItem('piplog_token');

export const login = (token, user) => {
  localStorage.setItem('piplog_token', token);
  localStorage.setItem('piplog_user', JSON.stringify(user));
};

export const logout = () => {
  localStorage.removeItem('piplog_token');
  localStorage.removeItem('piplog_user');
};
