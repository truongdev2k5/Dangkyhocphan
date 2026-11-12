// Shared authentication functions
// Đây là file auth.js dùng chung cho phần đăng nhập, đăng xuất và gọi API có token.
const API_BASE = "http://localhost:3001/api/v1";

async function fetchWithTimeout(url, options = {}, ms = 5000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    console.log("Fetching URL:", url); // Debug log
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return res;
  } catch (err) {
    clearTimeout(timeout);
    console.error("Fetch error for URL:", url, err); // Debug log
    if (err.name === "AbortError")
      throw new Error("Timeout - vui lòng thử lại");
    throw err;
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const errorDiv = document.getElementById("loginError");

  try {
    const response = await fetchWithTimeout(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ten_dang_nhap: username, mat_khau: password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      errorDiv.textContent = error.message || `Lỗi ${response.status}`;
      return;
    }

    const data = await response.json();

    if (!data.success) {
      errorDiv.textContent = data.message;
      return;
    }

    // Save auth data
    localStorage.setItem("token", data.data.token);
    localStorage.setItem("user", JSON.stringify(data.data.nguoi_dung));

    // Redirect based on role
    const role = data.data.nguoi_dung.vai_tro;
    if (role === "admin") {
      window.location.href = "admin/dashboard.html";
    } else {
      window.location.href = "student/dashboard.html";
    }
  } catch (error) {
    errorDiv.textContent = "❌ Lỗi kết nối: " + error.message;
  }
}

function logout() {
  if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "../login.html";
  }
}

// API Helper with authentication
async function apiCall(method, endpoint, body = null) {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../login.html";
    throw new Error("Phiên đăng nhập không tồn tại");
  }
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
  if (body) options.body = JSON.stringify(body);
  const response = await fetchWithTimeout(`${API_BASE}${endpoint}`, options);
  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "../login.html";
    throw new Error(data.message || "Phiên đăng nhập đã hết hạn");
  }

  if (!response.ok || data?.success === false) {
    const details = [];

    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      details.push(data.errors.join("; "));
    }

    if (Array.isArray(data?.chi_tiet) && data.chi_tiet.length > 0) {
      const detailText = data.chi_tiet
        .map((item) =>
          typeof item === "string"
            ? item
            : Object.values(item || {})
                .filter(Boolean)
                .join(" - "),
        )
        .join("; ");
      if (detailText) details.push(detailText);
    }

    const message = [data?.message || `Lỗi ${response.status}`, ...details]
      .filter(Boolean)
      .join(" | ");

    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

