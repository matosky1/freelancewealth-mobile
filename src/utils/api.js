const login = async (email, password) => {
  try {
    const res = await api.post('/api/auth/login', { email, password });
    await SecureStore.setItemAsync('fw_token', res.data.token);
    setUser(res.data.user);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.response?.data?.error || 'Login failed' };
  }
};

const register = async (name, email, password) => {
  try {
    const res = await api.post('/api/auth/register', { name, email, password });
    await SecureStore.setItemAsync('fw_token', res.data.token);
    setUser(res.data.user);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.response?.data?.error || 'Registration failed' };
  }
};


