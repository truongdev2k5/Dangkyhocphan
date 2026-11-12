// ==================== UTILITY FUNCTIONS ====================

async function fetchWithTimeout(url, options = {}, ms = 5000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return res;
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError")
      throw new Error("Timeout - vui lòng thử lại");
    throw err;
  }
}

function getDayName(thu) {
  const days = {
    2: "Thứ 2",
    3: "Thứ 3",
    4: "Thứ 4",
    5: "Thứ 5",
    6: "Thứ 6",
    7: "Thứ 7",
    8: "Chủ nhật",
  };
  return days[thu] || thu;
}

let activeSemesterId = null;
let activeMaxCredits = null;

function toggleStudentInfoMenu(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById("studentInfoMenu");
  if (!menu) return;
  menu.classList.toggle("show");
}

function closeStudentInfoMenu() {
  const menu = document.getElementById("studentInfoMenu");
  if (menu) menu.classList.remove("show");
}

function switchTab(tab) {
  // Hide all tabs
  document
    .querySelectorAll(".tab-pane")
    .forEach((pane) => pane.classList.remove("active"));
  // Remove active from all nav-tab buttons
  document
    .querySelectorAll(".nav-tab")
    .forEach((btn) => btn.classList.remove("active"));

  // Show selected tab
  document.getElementById(tab).classList.add("active");
  const activeTabBtn = document.querySelector(
    `.nav-tab[onclick="switchTab('${tab}')"]`,
  );
  if (activeTabBtn) activeTabBtn.classList.add("active");

  // Load data when switching tabs
  if (tab === "browse") {
    loadClasses();
  } else if (tab === "registered") {
    loadMyRegistrations();
  } else if (tab === "schedule") {
    loadSchedule();
  }
}

async function checkDbStatus() {
  const statusEl = document.getElementById("dbStatus");
  try {
    const res = await fetchWithTimeout("http://localhost:3001/api/v1/health");
    const json = await res.json();

    if (res.ok && json.db === "connected") {
      statusEl.textContent = "✅ API + DB đã kết nối";
      statusEl.style.color = "#0a7";
    } else {
      statusEl.textContent = "⚠️ API đang chạy nhưng DB chưa kết nối";
      statusEl.style.color = "#c00";
    }
  } catch (err) {
    statusEl.textContent = "❌ Không kết nối được API/DB";
    statusEl.style.color = "#c00";
    console.error(err);
  }
}

// ==================== INITIALIZATION ====================

document.addEventListener("DOMContentLoaded", async function () {
  document.addEventListener("click", (event) => {
    const menu = document.getElementById("studentInfoMenu");
    const toggle = document.getElementById("userMenuToggle");
    if (!menu || !toggle) return;
    if (menu.contains(event.target) || toggle.contains(event.target)) return;
    closeStudentInfoMenu();
  });

  const token = localStorage.getItem("token");
  const rawUser = localStorage.getItem("user");
  let user = null;

  try {
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    user = null;
  }

  if (!token || !user || !user.vai_tro) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "../login.html";
    return;
  }

  if (user.vai_tro !== "sinh_vien") {
    window.location.href = "../login.html";
    return;
  }

  // Display user info
  document.getElementById("userInfo").textContent = user.ten_dang_nhap;

  // Hiển thị loading skeleton
  showLoadingState();

  try {
    // Kiểm tra user info từ API
    const userRes = await apiCall("GET", "/auth/me");
    if (!userRes.success) {
      throw new Error("Không thể lấy thông tin user");
    }

    // Cập nhật user info
    localStorage.setItem("user", JSON.stringify(userRes.data));
    document.getElementById("userInfo").textContent = userRes.data.ten_dang_nhap;

    await loadStudentProfileAndSemester();
    // Load dữ liệu
    await loadClasses();
    await loadMyRegistrations();
    updateStats();

    // Kiểm tra DB status
    await checkDbStatus();
  } catch (error) {
    console.error("Error initializing:", error);
    showErrorState();
  }
});

function showLoadingState() {
  document.getElementById("dbStatus").textContent = "Đang tải...";
  document.getElementById("totalClasses").textContent = "...";
  document.getElementById("totalRegistered").textContent = "...";
  document.getElementById("totalCredits").textContent = "...";
  document.getElementById("pendingReg").textContent = "...";
  document.getElementById("classesGrid").innerHTML =
    '<div class="empty-state">Đang tải danh sách lớp...</div>';
  document.getElementById("myClassesGrid").innerHTML =
    '<div class="empty-state">Đang tải...</div>';
  document.getElementById("registrationsTable").innerHTML =
    '<tr><td colspan="5" style="text-align: center">Đang tải...</td></tr>';
}

function showErrorState() {
  document.getElementById("dbStatus").textContent =
    "Không thể tải dữ liệu - Thử lại";
  document.getElementById("dbStatus").style.color = "#c00";
  document.getElementById("classesGrid").innerHTML =
    '<div class="empty-state">Lỗi tải dữ liệu <button onclick="logout()" class="btn btn-sm btn-primary">Đăng nhập lại</button></div>';
  document.getElementById("myClassesGrid").innerHTML =
    '<div class="empty-state">Lỗi tải dữ liệu <button onclick="logout()" class="btn btn-sm btn-primary">Đăng nhập lại</button></div>';
}

async function loadStudentProfileAndSemester() {
  try {
    const [svResult, hkResult] = await Promise.allSettled([
      apiCall("GET", "/sinh-vien/me"),
      apiCall("GET", "/hoc-ky/dang-hoat-dong"),
    ]);

    if (svResult.status === "fulfilled") {
      const sv = svResult.value?.data || {};
      document.getElementById("svMa").textContent = sv.ma_sinh_vien || "N/A";
      document.getElementById("svHoTen").textContent = sv.ho_ten || "N/A";
      document.getElementById("svChuyenNganh").textContent =
        sv.chuyen_nganh?.ten || "N/A";
      document.getElementById("svEmail").textContent = sv.email || "N/A";
      document.getElementById("svSdt").textContent = sv.so_dien_thoai || "N/A";
    }

    if (hkResult.status === "fulfilled") {
      const hk = hkResult.value?.data;
      if (hk) {
        activeSemesterId = Number(hk.id_hoc_ky || hk.id);
        document.getElementById("hocKyHienTai").textContent =
          `Học kỳ ${hk.ten_hoc_ky} - ${hk.nam_hoc}`;

        try {
          const config = await apiCall(
            "GET",
            `/lop-hoc-phan/hoc-ky/${activeSemesterId}/tin-chi`,
          );
          activeMaxCredits = config?.data?.tin_chi_toi_da ?? null;
        } catch {
          try {
            const hkCredit = await apiCall(
              "GET",
              `/hoc-ky/${activeSemesterId}/tin-chi`,
            );
            activeMaxCredits = hkCredit?.data?.tin_chi_toi_da ?? null;
          } catch {
            activeMaxCredits = null;
          }
        }
      }
    } else {
      const hkLabel = document.getElementById("hocKyHienTai");
      if (hkLabel) hkLabel.textContent = "Chưa xác định học kỳ đang hoạt động";
    }

    document.getElementById("maxCreditsAllowed").textContent =
      activeMaxCredits !== null ? String(activeMaxCredits) : "Chưa cấu hình";
  } catch (error) {
    console.error("Error loading profile/semester:", error);
    const hkLabel = document.getElementById("hocKyHienTai");
    if (hkLabel) hkLabel.textContent = "Chưa xác định học kỳ đang hoạt động";
    document.getElementById("maxCreditsAllowed").textContent = "Chưa cấu hình";
  }
}

function getRegistrationEndpoint() {
  if (activeSemesterId) return `/dang-ky/cua-toi?id_hoc_ky=${activeSemesterId}`;
  return "/dang-ky/cua-toi";
}

// ==================== DATA LOADING FUNCTIONS ====================

async function loadClasses() {
  try {
    const endpoint = activeSemesterId ? `/lop-hoc-phan?id_hoc_ky=${activeSemesterId}&limit=1000` : "/lop-hoc-phan?limit=1000";
    const data = await apiCall("GET", endpoint);

    if (!data?.data || !Array.isArray(data.data)) {
      document.getElementById("classesGrid").innerHTML =
        '<div class="empty-state">Không có lớp học</div>';
      return;
    }

    // Store for search functionality
    window.allClasses = data.data;

    const html = data.data
      .map(
        (c) => `
            <div class="class-card">
                <div class="class-header">
                    <div class="class-code">${c.ma_lop_hoc || "N/A"}</div>
                    <div class="class-subject">${c.mon_hoc?.ten || "N/A"}</div>
                </div>
                <div class="class-body">
                    <div class="class-row">
                        <label>GV:</label>
                        <span>${c.giang_vien?.ten || "N/A"}</span>
                    </div>
                    <div class="class-row">
                        <label>Phòng:</label>
                        <span>${c.phong_hoc || "N/A"}</span>
                    </div>
                    <div class="class-row">
                        <label>Thời gian:</label>
                        <span>${c.lich_hoc?.map((slot) => `${getDayName(slot.thu_trong_tuan)}, ${slot.gio_bat_dau}-${slot.gio_ket_thuc}`).join("; ") || "N/A"}</span>
                    </div>
                    <div class="class-row">
                        <label>Tín chỉ:</label>
                        <span><span class="badge-credit">${c.mon_hoc?.tin_chi || 0} TC</span></span>
                    </div>
                    <div class="class-row">
                        <label>Chỗ trống:</label>
                        <span>
                            ${
                              c.so_luong_con_trong > 0
                                ? `<span class="badge-slot">${c.so_luong_con_trong}/${c.so_luong_toi_da}</span>`
                                : `<span class="badge-slot full">Hết chỗ</span>`
                            }
                        </span>
                    </div>
                </div>
                <div class="class-footer">
                    ${
                      c.so_luong_con_trong > 0
                        ? `<button class="btn btn-primary" onclick="registerClass('${c.ma_lop_hoc}')">Đăng Ký</button>`
                        : `<button class="btn btn-disabled" disabled>Hết chỗ</button>`
                    }
                    <button class="btn btn-secondary" onclick="alert('Chi tiết lớp #${c.ma_lop_hoc}')">Chi tiết</button>
                </div>
            </div>
        `,
      )
      .join("");

    document.getElementById("classesGrid").innerHTML =
      html || '<div class="empty-state">Không có lớp học</div>';
    document.getElementById("totalClasses").textContent = data.data.length;
  } catch (error) {
    console.error("Error loading classes:", error);
    document.getElementById("classesGrid").innerHTML =
      '<div class="empty-state">Lỗi tải dữ liệu</div>';
  }
}

async function loadMyRegistrations() {
  try {
    const data = await apiCall("GET", getRegistrationEndpoint());

    if (!data?.data || !Array.isArray(data.data)) {
      document.getElementById("myClassesGrid").innerHTML =
        '<div class="empty-state">Chưa đăng ký lớp nào</div>';
      document.getElementById("registrationsTable").innerHTML =
        '<tr><td colspan="5">Chưa có dữ liệu</td></tr>';
      return;
    }

    // Approved registrations as cards
    const approved = data.data.filter((d) => d.trang_thai === "da_duyet");
    const cardHtml = approved
      .map(
        (d) => `
            <div class="class-card">
                <div class="class-header">
                    <div class="class-code">${d.lop_hoc_phan?.ma_lop_hoc || "N/A"}</div>
                    <div class="class-subject">${d.lop_hoc_phan?.mon_hoc?.ten || "N/A"}</div>
                </div>
                <div class="class-body">
                    <div class="class-row">
                        <label>GV:</label>
                        <span>${d.lop_hoc_phan?.giang_vien?.ten || "N/A"}</span>
                    </div>
                    <div class="class-row">
                        <label>Phòng:</label>
                        <span>${d.lop_hoc_phan?.phong_hoc || "N/A"}</span>
                    </div>
                    <div class="class-row">
                        <label>Thời gian:</label>
                        <span>${d.lop_hoc_phan?.lich_hoc?.map((slot) => `${getDayName(slot.thu_trong_tuan)}, ${slot.gio_bat_dau}-${slot.gio_ket_thuc}`).join("; ") || "N/A"}</span>
                    </div>
                    <div class="class-row">
                        <label>Trạng thái:</label>
                        <span><span class="status-badge da_duyet">✅ Đã Duyệt</span></span>
                    </div>
                </div>
                <div class="class-footer">
                    <button class="btn btn-disabled" disabled>Da duyet - khong the tu huy</button>
                </div>
            </div>
        `,
      )
      .join("");

    document.getElementById("myClassesGrid").innerHTML =
      cardHtml || '<div class="empty-state">Chưa có lớp nào được duyệt</div>';

    // All registrations in table
    const tableHtml = data.data
      .map((d) => {
        const statusClass = d.trang_thai.replace(/_/g, "_");
        return `
                <tr>
                    <td>${d.lop_hoc_phan?.mon_hoc?.ten || "N/A"}</td>
                    <td>${d.lop_hoc_phan?.mon_hoc?.tin_chi || 0}</td>
                    <td><span class="status-badge ${statusClass}">${getStatusName(d.trang_thai)}</span></td>
                    <td>${new Date(d.ngay_dang_ky).toLocaleDateString("vi-VN")}</td>
                    <td>
                        ${
                          d.trang_thai === "cho_duyet"
                            ? `<button class="btn btn-sm btn-danger" onclick="cancelRegistration(${d.id_dang_ky})">Huy</button>`
                            : d.trang_thai === "tu_choi"
                              ? `<span style="color: #c00;">${d.ghi_chu_tu_choi || "Bi tu choi"}</span>`
                              : '<span style="color: #999;">-</span>'
                        }
                    </td>
                </tr>
            `;
      })
      .join("");

    document.getElementById("registrationsTable").innerHTML = tableHtml;
    document.getElementById("totalRegistered").textContent = approved.length;
  } catch (error) {
    console.error("Error loading registrations:", error);
  }
}

async function loadSchedule() {
  try {
    const data = await apiCall("GET", getRegistrationEndpoint());

    if (!data?.data || !Array.isArray(data.data)) {
      document.getElementById("scheduleGrid").innerHTML =
        '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">Chưa có lịch học</div>';
      return;
    }

    const approved = data.data.filter((d) => d.trang_thai === "da_duyet");

    if (approved.length === 0) {
      document.getElementById("scheduleGrid").innerHTML =
        '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">Chưa có lớp nào được duyệt</div>';
      return;
    }

    const scheduleHtml = approved
      .map(
        (d) => `
            <div class="class-card">
                <div class="class-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <div class="class-code">${d.lop_hoc_phan?.ma_lop_hoc || "N/A"}</div>
                    <div class="class-subject">${d.lop_hoc_phan?.mon_hoc?.ten || "N/A"}</div>
                </div>
                <div class="class-body">
                    <div class="class-row">
                        <label>Lịch học:</label>
                        <span><strong>${d.lop_hoc_phan?.lich_hoc?.map((slot) => `${getDayName(slot.thu_trong_tuan)}, ${slot.gio_bat_dau}-${slot.gio_ket_thuc}`).join("; ") || "N/A"}</strong></span>
                    </div>
                    <div class="class-row">
                        <label>Phòng:</label>
                        <span>${d.lop_hoc_phan?.phong_hoc || "N/A"}</span>
                    </div>
                    <div class="class-row">
                        <label>Giảng viên:</label>
                        <span>${d.lop_hoc_phan?.giang_vien?.ten || "N/A"}</span>
                    </div>
                    <div class="class-row">
                        <label>Tín chỉ:</label>
                        <span><span class="badge-credit">${d.lop_hoc_phan?.mon_hoc?.tin_chi || 0}</span></span>
                    </div>
                </div>
            </div>
        `,
      )
      .join("");

    document.getElementById("scheduleGrid").innerHTML = scheduleHtml;
  } catch (error) {
    console.error("Error loading schedule:", error);
    document.getElementById("scheduleGrid").innerHTML =
      '<div style="grid-column: 1/-1; text-align: center; color: #999;">Lỗi tải lịch học</div>';
  }
}

async function updateStats() {
  try {
    const registrations = await apiCall("GET", getRegistrationEndpoint());

    if (Array.isArray(registrations?.data)) {
      const approved = registrations.data.filter(
        (r) => r.trang_thai === "da_duyet",
      );
      const totalCredits = approved.reduce(
        (sum, r) => sum + (r.lop_hoc_phan?.mon_hoc?.tin_chi || 0),
        0,
      );
      const pending = registrations.data.filter(
        (r) => r.trang_thai === "cho_duyet",
      ).length;

      document.getElementById("totalCredits").textContent = totalCredits;
      document.getElementById("pendingReg").textContent = pending;
    }
  } catch (error) {
    console.error("Error updating stats:", error);
  }
}

// ==================== ACTION FUNCTIONS ====================

async function registerClass(classId) {
  if (!confirm("Bạn chắc chắn muốn đăng ký lớp này?")) return;

  try {
    // Kiểm tra trùng lịch
    const checkRes = await apiCall("GET", `/lich-hoc/kiem-tra/${classId}`);
    if (checkRes?.trung_lich) {
      alert("❌ Lịch học trùng với lớp đã đăng ký. Không thể đăng ký!");
      return;
    }

    const response = await apiCall("POST", "/dang-ky", {
      ma_lop_hoc: classId,
    });

    if (response) {
      alert("✅ Đăng ký thành công! Chờ admin duyệt.");
      loadClasses();
      loadMyRegistrations();
      updateStats();
    }
  } catch (error) {
    alert("❌ Lỗi: " + (error.message || "Không thể đăng ký"));
  }
}

async function cancelRegistration(registrationId) {
  if (!confirm("Bạn chắc chắn muốn hủy đăng ký?")) return;

  try {
    const response = await apiCall("DELETE", `/dang-ky/${registrationId}`);

    if (response) {
      alert("✅ Hủy đăng ký thành công!");
      loadMyRegistrations();
      updateStats();
    }
  } catch (error) {
    alert("❌ Lỗi: " + (error.message || "Không thể hủy đăng ký"));
  }
}

function searchClasses() {
  const keyword = document.getElementById("searchClass").value.toLowerCase();

  if (!window.allClasses) return;

  const filtered = window.allClasses.filter(
    (c) =>
      (c.ma_lop_hoc && c.ma_lop_hoc.toLowerCase().includes(keyword)) ||
      (c.mon_hoc?.ten &&
        c.mon_hoc.ten.toLowerCase().includes(keyword)) ||
      (c.giang_vien?.ten &&
        c.giang_vien.ten.toLowerCase().includes(keyword)),
  );

  const html = filtered
    .map(
      (c) => `
        <div class="class-card">
            <div class="class-header">
                <div class="class-code">${c.ma_lop_hoc || "N/A"}</div>
                <div class="class-subject">${c.mon_hoc?.ten || "N/A"}</div>
            </div>
            <div class="class-body">
                <div class="class-row">
                    <label>GV:</label>
                    <span>${c.giang_vien?.ten || "N/A"}</span>
                </div>
                <div class="class-row">
                    <label>Phòng:</label>
                    <span>${c.phong_hoc || "N/A"}</span>
                </div>
                <div class="class-row">
                    <label>Thời gian:</label>
                    <span>${c.lich_hoc?.map((slot) => `${getDayName(slot.thu_trong_tuan)}, ${slot.gio_bat_dau}-${slot.gio_ket_thuc}`).join("; ") || "N/A"}</span>
                </div>
                <div class="class-row">
                    <label>Tín chỉ:</label>
                    <span><span class="badge-credit">${c.mon_hoc?.tin_chi || 0} TC</span></span>
                </div>
                <div class="class-row">
                    <label>Chỗ trống:</label>
                    <span>
                        ${
                          c.so_luong_con_trong > 0
                            ? `<span class="badge-slot">${c.so_luong_con_trong}/${c.so_luong_toi_da}</span>`
                            : `<span class="badge-slot full">Hết chỗ</span>`
                        }
                    </span>
                </div>
            </div>
            <div class="class-footer">
                ${
                  c.so_luong_con_trong > 0
                    ? `<button class="btn btn-primary" onclick="registerClass('${c.ma_lop_hoc}')">Đăng Ký</button>`
                    : `<button class="btn btn-disabled" disabled>Hết chỗ</button>`
                }
                <button class="btn btn-secondary" onclick="alert('Chi tiết lớp #${c.ma_lop_hoc}')">Chi tiết</button>
            </div>
        </div>
    `,
    )
    .join("");

  document.getElementById("classesGrid").innerHTML =
    html || '<div class="empty-state">Không tìm thấy lớp phù hợp</div>';
}

function getStatusName(status) {
  const statuses = {
    cho_duyet: "⏳ Chờ Duyệt",
    da_duyet: "✅ Đã Duyệt",
    tu_choi: "❌ Từ Chối",
    da_huy: "🗑️ Đã Hủy",
  };
  return statuses[status] || status;
}

// ==================== ĐỔI MẬT KHẨU FUNCTIONS ====================

function openDoiMatKhauModal() {
  document.getElementById("modalDoiMatKhau").style.display = "block";
  document.getElementById("formDoiMatKhau").reset();
  document.getElementById("doiMatKhauError").style.display = "none";
}

function closeDoiMatKhauModal() {
  document.getElementById("modalDoiMatKhau").style.display = "none";
}

async function submitDoiMatKhau(event) {
  event.preventDefault();

  const mat_khau_cu = document.getElementById("mat_khau_cu").value;
  const mat_khau_moi = document.getElementById("mat_khau_moi").value;
  const xac_nhan_mat_khau = document.getElementById("xac_nhan_mat_khau").value;
  const errorDiv = document.getElementById("doiMatKhauError");

  // Validate mật khẩu mới và xác nhận
  if (mat_khau_moi !== xac_nhan_mat_khau) {
    errorDiv.textContent = "❌ Mật khẩu mới và xác nhận không khớp!";
    errorDiv.style.display = "block";
    return;
  }

  try {
    const response = await apiCall("PUT", "/auth/doi-mat-khau", {
      mat_khau_cu,
      mat_khau_moi,
    });

    if (response.success) {
      alert("✅ Đổi mật khẩu thành công!");
      closeDoiMatKhauModal();
    } else {
      errorDiv.textContent = "❌ " + (response.message || "Lỗi không xác định");
      errorDiv.style.display = "block";
    }
  } catch (error) {
    errorDiv.textContent =
      "❌ Lỗi: " + (error.message || "Không thể đổi mật khẩu");
    errorDiv.style.display = "block";
  }
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}



