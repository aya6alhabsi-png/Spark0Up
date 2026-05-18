import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const API_BASE = "http://localhost:5000";

//REGISTER USER (innovator/funder) 
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (payload, thunkAPI) => {
    try {
      const res = await fetch(`${API_BASE}/userRegister`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        return thunkAPI.rejectWithValue(data?.msg || "Registration failed");
      }

      return data.user;
    } catch (e) {
      return thunkAPI.rejectWithValue("Server error");
    }
  }
);

//LOGIN 
export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password, role }, thunkAPI) => {
    try {
      const res = await fetch(`${API_BASE}/userLogin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();

      if (!data?.loginStatus) {
        return thunkAPI.rejectWithValue(data?.serverMsg || "Login failed");
      }

      localStorage.setItem("token", data.token);
      return data.user;
    } catch (e) {
      return thunkAPI.rejectWithValue("Server error");
    }
  }
);

//UPDATE USER PROFILE (all roles) 
export const updateUser = createAsyncThunk(
  "auth/updateUser",
  async (profileData, thunkAPI) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return thunkAPI.rejectWithValue("No token");

      const res = await fetch(`${API_BASE}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        return thunkAPI.rejectWithValue(data?.msg || "Update failed");
      }

      return data.user;
    } catch (e) {
      return thunkAPI.rejectWithValue("Server error");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    status: "idle",
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.status = "idle";
      state.error = null;
      localStorage.removeItem("token");
    },

    //used by ProfileEditModal if needed 
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    // REGISTER
    builder.addCase(registerUser.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state) => {
      state.status = "succeeded";
      state.error = null;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload || "Register error";
    });

    // LOGIN
    builder.addCase(login.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.status = "succeeded";
      state.user = action.payload;
      state.error = null;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload || "Login error";
    });

    // UPDATE PROFILE
    builder.addCase(updateUser.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(updateUser.fulfilled, (state, action) => {
      state.status = "succeeded";
      state.user = action.payload; // ✅ update redux user instantly
      state.error = null;
    });
    builder.addCase(updateUser.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload || "Update error";
    });
  },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;