// Admin-specific functions
//. File này làm nhiệm vụ gọi API từ trình duyệt để lấy dữ liệu và hiển thị lên giao diện admin.
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

function openBsModal(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  const modal = bootstrap.Modal.getOrCreateInstance(el);
  modal.show();
  return modal;
}

function closeBsModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const modal = bootstrap.Modal.getInstance(el);
  if (modal) modal.hide();
}

function showPage(pageName) {
  document
    .querySelectorAll(".page-section")
    .forEach((p) => (p.style.display = "none"));
  document
    .querySelectorAll(".menu-link")
    .forEach((l) => l.classList.remove("active"));

  const page = document.getElementById(pageName);
  if (page) {
    page.style.display = "block";
    document.querySelectorAll(".menu-link").forEach(link => {
      const selected = link.getAttribute("onclick") === "showPage('" + pageName + "')";
      link.classList.toggle("active", selected);
      if (selected) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    document.querySelector(".sidebar").classList.remove("expanded");
    document.getElementById("navToggle").setAttribute("aria-expanded", "false");
    if (pageName === "dashboard") loadAdminDashboard();
    else if (pageName === "students") loadStudents();
    else if (pageName === "lecturers") loadLecturers();
    else if (pageName === "classes") loadClasses();
    else if (pageName === "registrations") filterRegistrations();
    else if (pageName === "registrationHistory") loadRegistrationHistory();
    else if (pageName === "hocKy") loadHocKy();
    else if (pageName === "monHoc") { loadHocKy(); loadMonHoc(); }
    else if (pageName === "chuyenNganh") loadChuyenNganh();
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
      statusEl.textContent = "⚠️ API đã chạy nhưng DB chưa kết nối";
      statusEl.style.color = "#c00";
    }
  } catch (err) {
    statusEl.textContent = "❌ Không kết nối được API/DB";
    statusEl.style.color = "#c00";
    console.error(err);
  }
}

async function loadAdminDashboard() {
  // Hiển thị loading
  document.getElementById("dbStatus").textContent = "Đang tải...";
  document.getElementById("totalStudents").textContent = "...";
  document.getElementById("totalLecturers").textContent = "...";
  document.getElementById("totalClasses").textContent = "...";
  document.getElementById("pendingRegistrations").textContent = "...";

  try {
    // Gọi API thống kê
    const statsRes = await apiCall("GET", "/hoc-ky/stats");

    // Hiển thị dữ liệu
    document.getElementById("totalStudents").textContent =
      statsRes.data?.svCount || 0;
    document.getElementById("totalLecturers").textContent =
      statsRes.data?.gvCount || 0;
    document.getElementById("totalClasses").textContent =
      statsRes.data?.lopCount || 0;
    document.getElementById("pendingRegistrations").textContent =
      statsRes.data?.choDuyetCount || 0;

    // Ẩn loading, hiển thị OK
    document.getElementById("dbStatus").textContent = "";
    document.getElementById("dbStatus").style.color = "#0a7";
  } catch (error) {
    console.error("Error loading dashboard:", error);
    // Hiển thị lỗi
    document.getElementById("dbStatus").textContent =
      "Không thể tải dữ liệu - Thử lại";
    document.getElementById("dbStatus").style.color = "#c00";
    document.getElementById("totalStudents").textContent = "!";
    document.getElementById("totalLecturers").textContent = "!";
    document.getElementById("totalClasses").textContent = "!";
    document.getElementById("pendingRegistrations").textContent = "!";

    // Thêm nút thử lại
    const retryBtn = document.createElement("button");
    retryBtn.textContent = "Thử lại";
    retryBtn.className = "btn btn-sm btn-primary";
    retryBtn.onclick = loadAdminDashboard;
    document.getElementById("dbStatus").appendChild(retryBtn);
  }
}

async function loadStudents() {
  try {
    const data = await apiCall("GET", "/sinh-vien?limit=1000");
    const tbody = document.getElementById("studentsTable");

    if (!data.data?.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="text-center">Không có sinh viên</td></tr>';
      return;
    }

    const rows = data.data
      .map(
        (sv) => `
      <tr>
        <td><strong>${sv.ma_sinh_vien}</strong></td>
        <td>${sv.ho_ten}</td>
        <td>${sv.email || "—"}</td>
        <td>${sv.chuyen_nganh?.ten || "—"}</td>
        <td>${sv.so_dien_thoai || "—"}</td>
        <td>
          <button onclick="resetPassword('${sv.tai_khoan?.id_nguoi_dung || ""}')" class="btn btn-sm btn-warning" ${sv.tai_khoan?.id_nguoi_dung ? "" : "disabled"}>Đặt lại mật khẩu</button>
          <button onclick="deleteStudent('${sv.ma_sinh_vien}')" class="btn btn-sm btn-danger">Xóa</button>
        </td>
      </tr>
    `,
      )
      .join("");

    tbody.innerHTML = rows;
  } catch (error) {
    console.error("Error loading students:", error);
  }
}

function searchStudents() {
  const term = document.getElementById("searchStudent").value.toLowerCase();
  document.querySelectorAll("#studentsTable tr").forEach((row) => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(term) ? "" : "none";
  });
}

async function loadLecturers() {
  try {
    const data = await apiCall("GET", "/giang-vien?limit=1000");
    const tbody = document.getElementById("lecturersTable");
    tbody.innerHTML = "";

    if (!data.data?.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align:center;">Không có giảng viên</td></tr>';
      return;
    }

    data.data.forEach((gv) => {
      tbody.innerHTML += `
                <tr>
                    <td><strong>${gv.ma_giang_vien}</strong></td>
                    <td>${gv.ho_ten}</td>
                    <td>${gv.email || "—"}</td>
                    <td>${gv.khoa || "—"}</td>
                    <td>${gv.so_dien_thoai || "—"}</td>
                    <td>
                        <button onclick="deleteLecturer('${gv.ma_giang_vien}')" class="btn btn-sm btn-danger">Xóa</button>
                    </td>
                </tr>
            `;
    });
  } catch (error) {
    console.error("Error loading lecturers:", error);
  }
}

function searchLecturers() {
  const term = document.getElementById("searchLecturer").value.toLowerCase();
  document.querySelectorAll("#lecturersTable tr").forEach((row) => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(term) ? "" : "none";
  });
}

async function ensureClassHocKyFilterOptions() {
  const filter = document.getElementById("classHocKyFilter");
  if (!filter) return;
  if (filter.options.length > 1) return;

  const hkRes = await apiCall("GET", "/hoc-ky?limit=1000");
  (hkRes.data || []).forEach((hk) => {
    filter.innerHTML += `<option value="${hk.id_hoc_ky}">${hk.ten_hoc_ky} (${hk.nam_hoc})</option>`;
  });
}

async function loadClasses() {
  try {
    await ensureClassHocKyFilterOptions();
    const filter = document.getElementById("classHocKyFilter");
    const idHocKy = filter?.value || "";
    const endpoint = idHocKy
      ? `/lop-hoc-phan?id_hoc_ky=${idHocKy}&limit=1000`
      : "/lop-hoc-phan?limit=1000";

    const data = await apiCall("GET", endpoint);
    const tbody = document.getElementById("classesTable");
    tbody.innerHTML = "";

    if (!data?.data?.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align:center;">Chưa có lớp học phần</td></tr>';
      return;
    }

    const rows = data.data
      .map(
        (lop) => `
        <tr>
            <td><strong>${lop.ma_lop_hoc}</strong></td>
            <td>${lop.mon_hoc?.ten || "—"}</td>
            <td>${lop.giang_vien?.ten || "—"}</td>
            <td>${lop.phong_hoc || "—"}</td>
            <td>${lop.so_luong_con_trong}/${lop.so_luong_toi_da}</td>
            <td>
                <button onclick="viewClassDetail('${lop.ma_lop_hoc}')" class="btn btn-sm btn-info">Chi tiết</button>
                <button onclick="deleteClass('${lop.ma_lop_hoc}')" class="btn btn-sm btn-danger">Xóa</button>
            </td>
        </tr>
      `,
      )
      .join("");

    tbody.innerHTML = rows;
  } catch (error) {
    console.error("Error loading classes:", error);
  }
}

function searchClasses() {
  const term = document.getElementById("searchClass").value.toLowerCase();
  document.querySelectorAll("#classesTable tr").forEach((row) => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(term) ? "" : "none";
  });
}

async function filterRegistrations() {
  const status = document.getElementById("statusFilter").value;
  try {
    const endpoint = status ? `/dang-ky?trang_thai=${status}&limit=1000` : "/dang-ky?limit=1000";
    const data = await apiCall("GET", endpoint);

    const tbody = document.getElementById("registrationsTable");
    tbody.innerHTML = "";

    if (!data.data?.length) {
      tbody.innerHTML =
        '<tr><td colspan="5" style="text-align:center;">Không có đăng ký</td></tr>';
      return;
    }

    data.data.forEach((reg) => {
      let actions = "";
      if (reg.trang_thai === "cho_duyet") {
        actions = `
                    <button onclick="approveRegistration(${reg.id_dang_ky})" class="btn btn-sm btn-success">Duyệt</button>
                    <button onclick="rejectRegistration(${reg.id_dang_ky})" class="btn btn-sm btn-danger">Từ chối</button>
                `;
      }

      tbody.innerHTML += `
                <tr>
                    <td>${reg.sinh_vien?.ho_ten || "—"}</td>
                    <td>${reg.lop_hoc_phan?.ma_lop_hoc || "—"}</td>
                    <td>${new Date(reg.ngay_dang_ky).toLocaleDateString("vi-VN")}</td>
                    <td><span class="status status-${reg.trang_thai}">${getStatusLabel(reg.trang_thai)}</span></td>
                    <td>${actions}</td>
                </tr>
            `;
    });
  } catch (error) {
    console.error("Error filtering:", error);
  }
}

async function loadRegistrationHistory() {
  try {
    const keyword =
      document.getElementById("searchHistory")?.value?.trim() || "";
    const endpoint = keyword
      ? `/dang-ky/lich-su?q=${encodeURIComponent(keyword)}`
      : "/dang-ky/lich-su";
    const data = await apiCall("GET", endpoint);
    const tbody = document.getElementById("historyTable");
    tbody.innerHTML = "";

    if (!data.data?.length) {
      tbody.innerHTML =
        '<tr><td colspan="5" style="text-align:center;">Không có lịch sử</td></tr>';
      return;
    }

    data.data.forEach((hist) => {
      tbody.innerHTML += `
                <tr>
                    <td>${hist.SinhVien?.ho_ten || hist.sinh_vien?.ho_ten || "—"}</td>
                    <td>${hist.LopHocPhan?.ma_lop_hoc || hist.lop_hoc_phan?.ma_lop_hoc || "—"}</td>
                    <td>${getStatusLabel(hist.trang_thai_cu) || "—"}</td>
                    <td>${getStatusLabel(hist.trang_thai_moi) || "—"}</td>
                    <td>${new Date(hist.thoi_diem).toLocaleString("vi-VN")}</td>
                </tr>
            `;
    });
  } catch (error) {
    console.error("Error loading history:", error);
  }
}

async function loadHocKy() {
  try {
    const data = await apiCall("GET", "/hoc-ky?limit=1000");
    const tbody = document.getElementById("hocKyTable");
    const hocKyFilter = document.getElementById("monHocHocKyFilter");
    tbody.innerHTML = "";

    if (!data.data?.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align:center;">Chưa có học kỳ</td></tr>';
      if (hocKyFilter) hocKyFilter.innerHTML = '<option value="">Tất cả học kỳ</option>';
      return;
    }

    if (hocKyFilter) {
      const currentValue = hocKyFilter.value;
      hocKyFilter.innerHTML = '<option value="">Tất cả học kỳ</option>';
      data.data.forEach((hk) => {
        hocKyFilter.innerHTML += `<option value="${hk.id_hoc_ky}">${hk.ten_hoc_ky} (${hk.nam_hoc})</option>`;
      });
      if (currentValue) hocKyFilter.value = currentValue;
    }

    data.data.forEach((hk) => {
      tbody.innerHTML += `
                <tr>
                    <td><strong>${hk.ten_hoc_ky}</strong></td>
                    <td>${hk.nam_hoc}</td>
                    <td>${new Date(hk.ngay_bat_dau_dk).toLocaleDateString("vi-VN")}</td>
                    <td>${new Date(hk.ngay_ket_thuc_dk).toLocaleDateString("vi-VN")}</td>
                    <td><span class="status ${hk.dang_kich_hoat ? "status-active" : "status-inactive"}">${hk.dang_kich_hoat ? "Kích hoạt" : "Chưa kích hoạt"}</span></td>
                    <td>
                        <button onclick="editHocKy(${hk.id_hoc_ky})" class="btn btn-sm btn-warning">Sửa</button>
                        <button onclick="activateHocKy(${hk.id_hoc_ky})" class="btn btn-sm btn-success">${hk.dang_kich_hoat ? "Tắt" : "Bật"}</button>
                        <button onclick="deleteHocKy(${hk.id_hoc_ky})" class="btn btn-sm btn-danger">Xóa</button>
                    </td>
                </tr>
            `;
    });
  } catch (error) {
    console.error("Error loading hoc ky:", error);
  }
}

async function loadMonHoc() {
  try {
    const tbody = document.getElementById("monHocTable");
    const hocKyFilter = document.getElementById("monHocHocKyFilter");
    const selectedHocKy = hocKyFilter?.value || "";
    tbody.innerHTML = "";

    if (selectedHocKy) {
      const lopRes = await apiCall(
        "GET",
        `/lop-hoc-phan?id_hoc_ky=${selectedHocKy}&limit=1000`,
      );
      const uniqueMap = new Map();
      (lopRes.data || []).forEach((lop) => {
        if (lop.mon_hoc?.ma && !uniqueMap.has(lop.mon_hoc.ma)) {
          uniqueMap.set(lop.mon_hoc.ma, {
            ma_mon_hoc: lop.mon_hoc.ma,
            ten_mon_hoc: lop.mon_hoc.ten,
            so_tin_chi: lop.mon_hoc.tin_chi,
          });
        }
      });
      const dataByHocKy = Array.from(uniqueMap.values());

      if (!dataByHocKy.length) {
        tbody.innerHTML =
          '<tr><td colspan="4" style="text-align:center;">Học kỳ này chưa có môn học gắn với lớp học phần</td></tr>';
        return;
      }

      dataByHocKy.forEach((mh) => {
        tbody.innerHTML += `
                <tr>
                    <td><strong>${mh.ma_mon_hoc}</strong></td>
                    <td>${mh.ten_mon_hoc}</td>
                    <td>${mh.so_tin_chi}</td>
                    <td>
                        <button onclick="editMonHoc('${mh.ma_mon_hoc}')" class="btn btn-sm btn-warning">Sửa</button>
                        <button onclick="deleteMonHoc('${mh.ma_mon_hoc}')" class="btn btn-sm btn-danger">Xóa</button>
                    </td>
                </tr>
            `;
      });
      return;
    }

    const data = await apiCall("GET", "/mon-hoc?limit=1000");
    if (!data.data?.length) {
      tbody.innerHTML =
        '<tr><td colspan="4" style="text-align:center;">Chưa có môn học</td></tr>';
      return;
    }

    data.data.forEach((mh) => {
      tbody.innerHTML += `
                <tr>
                    <td><strong>${mh.ma_mon_hoc}</strong></td>
                    <td>${mh.ten_mon_hoc}</td>
                    <td>${mh.so_tin_chi}</td>
                    <td>
                        <button onclick="editMonHoc('${mh.ma_mon_hoc}')" class="btn btn-sm btn-warning">Sửa</button>
                        <button onclick="deleteMonHoc('${mh.ma_mon_hoc}')" class="btn btn-sm btn-danger">Xóa</button>
                    </td>
                </tr>
            `;
    });
  } catch (error) {
    console.error("Error loading mon hoc:", error);
  }
}

function handleMonHocHocKyFilter() {
  loadMonHoc();
}
async function approveRegistration(idDK) {
  try {
    const data = await apiCall("PATCH", `/dang-ky/${idDK}/duyet`);

    if (data.success) {
      notifyAdmin("Duyệt thành công!");
      filterRegistrations();
      loadAdminDashboard();
    } else {
      notifyAdmin("❌ Lỗi: " + data.message);
    }
  } catch (error) {
    notifyAdmin("❌ Lỗi: " + error.message);
  }
}

async function rejectRegistration(idDK) {
  const reason = await askAdmin("Từ chối yêu cầu đăng ký", true);
  if (reason === null) return;

  try {
    const data = await apiCall("PATCH", `/dang-ky/${idDK}/tu-choi`, {
      ghi_chu: reason,
    });

    if (data.success) {
      notifyAdmin("✅ Từ chối thành công!");
      filterRegistrations();
      loadAdminDashboard();
    } else {
      notifyAdmin("❌ Lỗi: " + data.message);
    }
  } catch (error) {
    notifyAdmin("❌ Lỗi: " + error.message);
  }
}

async function deleteStudent(maSV) {
  if (!await askAdmin("Bạn có chắc chắn muốn xóa?")) return;

  try {
    const data = await apiCall("DELETE", `/sinh-vien/${maSV}`);

    if (data.success) {
      notifyAdmin("✅ Xóa thành công!");
      loadStudents();
    } else {
      notifyAdmin("❌ Lỗi: " + data.message);
    }
  } catch (error) {
    notifyAdmin("❌ Lỗi: " + error.message);
  }
}

async function deleteLecturer(maGV) {
  if (!await askAdmin("Bạn có chắc chắn muốn xóa?")) return;

  try {
    const data = await apiCall("DELETE", `/giang-vien/${maGV}`);

    if (data.success) {
      notifyAdmin("✅ Xóa thành công!");
      loadLecturers();
    } else {
      notifyAdmin("❌ Lỗi: " + data.message);
    }
  } catch (error) {
    notifyAdmin("❌ Lỗi: " + error.message);
  }
}

async function deleteClass(maLop) {
  if (!await askAdmin("Bạn có chắc chắn muốn xóa?")) return;

  try {
    const data = await apiCall("DELETE", `/lop-hoc-phan/${maLop}`);

    if (data.success) {
      notifyAdmin("✅ Xóa thành công!");
      loadClasses();
    } else {
      notifyAdmin("❌ Lỗi: " + data.message);
    }
  } catch (error) {
    notifyAdmin("❌ Lỗi: " + error.message);
  }
}

async function viewClassDetail(maLop) {
  if (!maLop) {
    notifyAdmin("❌ Lỗi: ID lớp không xác định");
    return;
  }

  try {
    const data = await apiCall("GET", `/lop-hoc-phan/${maLop}`);

    if (!data?.data) {
      notifyAdmin("❌ Không tìm thấy lớp học");
      return;
    }

    const lop = data.data;

    let scheduleHtml = "";
    if (lop.lich_hoc?.length > 0) {
      scheduleHtml = '<h4>📅 Lịch Học:</h4><ul style="margin-left:20px;">';
      lop.lich_hoc.forEach((l) => {
        scheduleHtml += `<li>${getDayName(l.thu_trong_tuan)} - ⏰ ${l.gio_bat_dau} đến ${l.gio_ket_thuc}</li>`;
      });
      scheduleHtml += "</ul>";
    }

    document.getElementById("modalBody").innerHTML = `
            <h2>📚 ${lop.ma_lop_hoc}</h2>
            <div class="modal-detail">
                <p><strong>Môn Học:</strong> ${lop.mon_hoc?.ten || "—"}</p>
                <p><strong>Giảng viên:</strong> ${lop.giang_vien?.ten || "—"}</p>
                <p><strong>Phòng:</strong> ${lop.phong_hoc}</p>
                <p><strong>Tín Chỉ:</strong> <span class="badge">${lop.mon_hoc?.tin_chi ?? "—"}</span></p>
                <p><strong>Chỗ:</strong> ${lop.so_luong_con_trong}/${lop.so_luong_toi_da}</p>
                <p><strong>Ngày:</strong> ${new Date(lop.ngay_bat_dau).toLocaleDateString("vi-VN")} - ${new Date(lop.ngay_ket_thuc).toLocaleDateString("vi-VN")}</p>
                ${scheduleHtml}
            </div>
        `;
    document.getElementById("modal").style.display = "flex";
  } catch (error) {
    notifyAdmin("Lỗi: " + error.message);
  }
}

function showAddStudentForm() {
  // Load danh sách chuyên ngành
  apiCall("GET", "/chuyen-nganh?limit=1000")
    .then((data) => {
      const select = document.getElementById("ma_chuyen_nganh");
      select.innerHTML = '<option value="">-- Chọn chuyên ngành --</option>';
      data.data.forEach((cn) => {
        select.innerHTML += `<option value="${cn.ma_chuyen_nganh}">${cn.ten_chuyen_nganh}</option>`;
      });
      // Mở modal
      const modal = new bootstrap.Modal(
        document.getElementById("modalThemSinhVien"),
      );
      modal.show();
    })
    .catch((error) => {
      notifyAdmin("Lỗi tải chuyên ngành: " + error.message);
    });
}

async function submitThemSinhVien() {
  const form = document.getElementById("formThemSinhVien");
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  // Validate required fields
  if (!data.ma_sinh_vien || !data.ho_ten || !data.ma_chuyen_nganh) {
    notifyAdmin("Vui lòng điền đầy đủ thông tin bắt buộc!");
    return;
  }

  try {
    const response = await apiCall("POST", "/sinh-vien", data);
    if (response.success) {
      // Đóng modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("modalThemSinhVien"),
      );
      modal.hide();
      // Reset form
      form.reset();
      // Reload bảng
      loadStudents();
      // Thông báo
      notifyAdmin(`Tạo thành công! ${response.data.mat_khau_mac_dinh}`);
    } else {
      notifyAdmin("Lỗi: " + response.message);
    }
  } catch (error) {
    notifyAdmin("Lỗi: " + error.message);
  }
}

function showAddLecturerForm() {
  // Mở modal
  const modal = new bootstrap.Modal(
    document.getElementById("modalThemGiangVien"),
  );
  modal.show();
}

async function submitThemGiangVien() {
  const form = document.getElementById("formThemGiangVien");
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  // Validate required fields
  if (!data.ma_giang_vien || !data.ho_ten) {
    notifyAdmin("Vui lòng điền đầy đủ thông tin bắt buộc!");
    return;
  }

  try {
    const response = await apiCall("POST", "/giang-vien", data);
    if (response.success) {
      // Đóng modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("modalThemGiangVien"),
      );
      modal.hide();
      // Reset form
      form.reset();
      // Reload bảng
      loadLecturers();
      // Thông báo
      notifyAdmin("Tạo giảng viên thành công!");
    } else {
      notifyAdmin("Lỗi: " + response.message);
    }
  } catch (error) {
    notifyAdmin("Lỗi: " + error.message);
  }
}

function showAddClassForm() {
  // Load danh sách môn học, học kỳ, giảng viên
  Promise.all([
    apiCall("GET", "/mon-hoc?limit=1000"),
    apiCall("GET", "/hoc-ky?limit=1000"),
    apiCall("GET", "/giang-vien?limit=1000"),
  ])
    .then(([monHocData, hocKyData, giangVienData]) => {
      // Load môn học
      const monHocSelect = document.getElementById("ma_mon_hoc");
      monHocSelect.innerHTML = '<option value="">-- Chọn môn học --</option>';
      monHocData.data.forEach((mh) => {
        monHocSelect.innerHTML += `<option value="${mh.ma_mon_hoc}">${mh.ten_mon_hoc}</option>`;
      });

      // Load học kỳ
      const hocKySelect = document.getElementById("id_hoc_ky");
      hocKySelect.innerHTML = '<option value="">-- Chọn học kỳ --</option>';
      hocKyData.data.forEach((hk) => {
        hocKySelect.innerHTML += `<option value="${hk.id_hoc_ky}">${hk.ten_hoc_ky}</option>`;
      });

      // Load giảng viên
      const giangVienSelect = document.getElementById("ma_giang_vien_lop");
      giangVienSelect.innerHTML =
        '<option value="">-- Chọn giảng viên --</option>';
      giangVienData.data.forEach((gv) => {
        giangVienSelect.innerHTML += `<option value="${gv.ma_giang_vien}">${gv.ho_ten}</option>`;
      });

      // Mở modal
      const modal = new bootstrap.Modal(
        document.getElementById("modalThemLopHocPhan"),
      );
      modal.show();
    })
    .catch((error) => {
      notifyAdmin("Lỗi tải dữ liệu: " + error.message);
    });
}

// ==================== INITIALIZATION ====================

document.addEventListener("DOMContentLoaded", async function () {
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

  if (user.vai_tro !== "admin") {
    window.location.href = "../login.html";
    return;
  }

  // Display user info
  document.getElementById("userInfo").textContent = `${user.ten_dang_nhap}`;

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
    document.getElementById("userInfo").textContent =
      `${userRes.data.ten_dang_nhap}`;

    // Load dữ liệu dashboard
    await loadAdminDashboard();
  } catch (error) {
    console.error("Error initializing:", error);
    showErrorState();
  }
});

function showLoadingState() {
  document.getElementById("dbStatus").textContent =
    "Đang kiểm tra kết nối DB...";
  document.getElementById("totalStudents").textContent = "...";
  document.getElementById("totalLecturers").textContent = "...";
  document.getElementById("totalClasses").textContent = "...";
  document.getElementById("pendingRegistrations").textContent = "...";
}

function showErrorState() {
  document.getElementById("dbStatus").innerHTML =
    "Không thể tải dữ liệu - <button onclick='loadAdminDashboard()'>Thử lại</button>";
  document.getElementById("dbStatus").style.color = "#c00";
  document.getElementById("totalStudents").textContent = "!";
  document.getElementById("totalLecturers").textContent = "!";
  document.getElementById("totalClasses").textContent = "!";
  document.getElementById("pendingRegistrations").textContent = "!";
}

async function submitThemLopHocPhan() {
  const form = document.getElementById("formThemLopHocPhan");
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  // Validate required fields
  if (
    !data.ma_lop_hoc ||
    !data.ma_mon_hoc ||
    !data.id_hoc_ky ||
    !data.so_luong_toi_da
  ) {
    notifyAdmin("Vui lòng điền đầy đủ thông tin bắt buộc!");
    return;
  }

  // Convert id_hoc_ky to number
  data.id_hoc_ky = Number(data.id_hoc_ky);
  data.so_luong_toi_da = Number(data.so_luong_toi_da);
  if (data.ngay_bat_dau && data.ngay_ket_thuc && data.ngay_bat_dau > data.ngay_ket_thuc) {
    notifyAdmin("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc");
    return;
  }

  // Optional fields: do not send empty strings to backend validators.
  ["ma_giang_vien", "phong_hoc", "ngay_bat_dau", "ngay_ket_thuc"].forEach(
    (key) => {
      if (data[key] === "") delete data[key];
    },
  );

  try {
    const response = await apiCall("POST", "/lop-hoc-phan", data);
    if (response.success) {
      // Đóng modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("modalThemLopHocPhan"),
      );
      modal.hide();
      // Reset form
      form.reset();
      // Reload bảng
      loadClasses();
      // Thông báo
      notifyAdmin("Tạo lớp học phần thành công!");
    } else {
      notifyAdmin("Lỗi: " + response.message);
    }
  } catch (error) {
    notifyAdmin("Lỗi: " + error.message);
  }
}

function getStatusLabel(status) {
  const labels = {
    cho_duyet: "Chờ duyệt",
    da_duyet: "Đã duyệt",
    tu_choi: "Từ chối",
    da_huy: "Đã hủy",
  };
  return labels[status] || status;
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

// Học kỳ functions
function showAddHocKyForm() {
  document.getElementById("hocKyForm").reset();
  document.getElementById("hocKyModalLabel").textContent = "Thêm Học Kỳ";
  document.getElementById("hocKyId").value = "";
  openBsModal("hocKyModal");
}

async function editHocKy(id) {
  try {
    const data = await apiCall("GET", `/hoc-ky/${id}`);
    const hk = data.data;
    document.getElementById("hocKyId").value = hk.id_hoc_ky;
    document.getElementById("tenHocKy").value = hk.ten_hoc_ky;
    document.getElementById("namHoc").value = hk.nam_hoc;
    document.getElementById("ngayBatDauDK").value =
      hk.ngay_bat_dau_dk.split("T")[0];
    document.getElementById("ngayKetThucDK").value =
      hk.ngay_ket_thuc_dk.split("T")[0];
    document.getElementById("hocKyModalLabel").textContent = "Sửa Học Kỳ";
    openBsModal("hocKyModal");
  } catch (error) {
    notifyAdmin("Lỗi: " + error.message);
  }
}

async function saveHocKy() {
  const id = document.getElementById("hocKyId").value;
  const data = {
    ten_hoc_ky: document.getElementById("tenHocKy").value,
    nam_hoc: document.getElementById("namHoc").value,
    ngay_bat_dau_dk: document.getElementById("ngayBatDauDK").value,
    ngay_ket_thuc_dk: document.getElementById("ngayKetThucDK").value,
  };

  if (!data.ten_hoc_ky || !data.nam_hoc || !data.ngay_bat_dau_dk || !data.ngay_ket_thuc_dk) {
    notifyAdmin("Vui lòng nhập đầy đủ thông tin học kỳ");
    return;
  }
  if (data.ngay_bat_dau_dk > data.ngay_ket_thuc_dk) {
    notifyAdmin("Ngày bắt đầu đăng ký phải nhỏ hơn hoặc bằng ngày kết thúc đăng ký");
    return;
  }

  try {
    if (id) {
      await apiCall("PUT", `/hoc-ky/${id}`, data);
    } else {
      await apiCall("POST", "/hoc-ky", data);
    }
    closeBsModal("hocKyModal");
    loadHocKy();
  } catch (error) {
    notifyAdmin("Lỗi: " + error.message);
  }
}

async function activateHocKy(id) {
  try {
    await apiCall("PATCH", `/hoc-ky/${id}/kich-hoat`);
    loadHocKy();
  } catch (error) {
    notifyAdmin("Lỗi: " + error.message);
  }
}

async function deleteHocKy(id) {
  if (!await askAdmin("Bạn có chắc chắn muốn xóa?")) return;
  try {
    await apiCall("DELETE", `/hoc-ky/${id}`);
    loadHocKy();
  } catch (error) {
    notifyAdmin("Lỗi: " + error.message);
  }
}

// Môn học functions
function showAddMonHocForm() {
  document.getElementById("monHocForm").reset();
  document.getElementById("monHocModalLabel").textContent = "Thêm Môn Học";
  document.getElementById("monHocId").value = "";
  openBsModal("monHocModal");
}

async function editMonHoc(ma) {
  try {
    const data = await apiCall("GET", `/mon-hoc/${ma}`);
    const mh = data.data;
    document.getElementById("monHocId").value = mh.ma_mon_hoc;
    document.getElementById("maMonHoc").value = mh.ma_mon_hoc;
    document.getElementById("tenMonHoc").value = mh.ten_mon_hoc;
    document.getElementById("soTinChi").value = mh.so_tin_chi;
    document.getElementById("monHocModalLabel").textContent = "Sửa Môn Học";
    openBsModal("monHocModal");
  } catch (error) {
    notifyAdmin("Lỗi: " + error.message);
  }
}

async function saveMonHoc() {
  const id = document.getElementById("monHocId").value;
  const data = {
    ma_mon_hoc: document.getElementById("maMonHoc").value,
    ten_mon_hoc: document.getElementById("tenMonHoc").value,
    so_tin_chi: parseInt(document.getElementById("soTinChi").value),
  };

  try {
    if (id) {
      await apiCall("PUT", `/mon-hoc/${id}`, data);
    } else {
      await apiCall("POST", "/mon-hoc", data);
    }
    closeBsModal("monHocModal");
    loadMonHoc();
  } catch (error) {
    notifyAdmin("Lỗi: " + error.message);
  }
}

async function deleteMonHoc(ma) {
  if (!await askAdmin("Bạn có chắc chắn muốn xóa?")) return;
  try {
    await apiCall("DELETE", `/mon-hoc/${ma}`);
    loadMonHoc();
  } catch (error) {
    notifyAdmin("Lỗi: " + error.message);
  }
}

async function resetPassword(id_nguoi_dung) {
  if (!id_nguoi_dung) {
    notifyAdmin("Không tìm thấy tài khoản để đặt lại mật khẩu.");
    return;
  }
  if (!await askAdmin("Đặt lại mật khẩu về Abcd@1234?")) return;
  try {
    const response = await apiCall(
      "PATCH",
      `/auth/tai-khoan/${id_nguoi_dung}/reset-mat-khau`,
    );
    if (response.success) {
      notifyAdmin("Đặt lại mật khẩu thành công!");
    } else {
      notifyAdmin("Lỗi: " + response.message);
    }
  } catch (error) {
    notifyAdmin("Lỗi: " + error.message);
  }
}

// ==================== CHUYEN NGANH FUNCTIONS ====================

async function loadChuyenNganh() {
  try {
    const data = await apiCall("GET", "/chuyen-nganh?limit=1000");
    const tableBody = document.getElementById("chuyenNganhTable");
    tableBody.innerHTML = "";
    data.data.forEach((item) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.ma_chuyen_nganh}</td>
        <td>${item.ten_chuyen_nganh}</td>
        <td>
          <button class="btn btn-sm btn-warning" onclick="editChuyenNganh('${item.ma_chuyen_nganh}')">Sửa</button>
          <button class="btn btn-sm btn-danger" onclick="deleteChuyenNganh('${item.ma_chuyen_nganh}')">Xóa</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    notifyAdmin("Lỗi tải danh sách chuyên ngành: " + error.message);
  }
}

function showAddChuyenNganhForm() {
  document.getElementById("chuyenNganhForm").reset();
  document.getElementById("chuyenNganhModalLabel").textContent =
    "Thêm Chuyên ngành";
  document.getElementById("chuyenNganhId").value = "";
  openBsModal("chuyenNganhModal");
}

async function editChuyenNganh(ma) {
  try {
    const data = await apiCall("GET", `/chuyen-nganh/${ma}`);
    document.getElementById("chuyenNganhId").value = data.data.ma_chuyen_nganh;
    document.getElementById("tenChuyenNganh").value =
      data.data.ten_chuyen_nganh;
    document.getElementById("chuyenNganhModalLabel").textContent =
      "Sửa Chuyên ngành";
    openBsModal("chuyenNganhModal");
  } catch (error) {
    notifyAdmin("Lỗi tải chuyên ngành: " + error.message);
  }
}

async function saveChuyenNganh() {
  const id = document.getElementById("chuyenNganhId").value;
  const data = {
    ma_chuyen_nganh: document.getElementById("maChuyenNganh").value,
    ten_chuyen_nganh: document.getElementById("tenChuyenNganh").value,
  };

  try {
    if (id) {
      await apiCall("PUT", `/chuyen-nganh/${id}`, data);
    } else {
      await apiCall("POST", "/chuyen-nganh", data);
    }
    closeBsModal("chuyenNganhModal");
    loadChuyenNganh();
  } catch (error) {
    notifyAdmin("Lỗi lưu chuyên ngành: " + error.message);
  }
}

async function deleteChuyenNganh(ma) {
  if (!await askAdmin("Bạn có chắc chắn muốn xóa?")) return;
  try {
    await apiCall("DELETE", `/chuyen-nganh/${ma}`);
    loadChuyenNganh();
  } catch (error) {
    notifyAdmin("Lỗi: " + error.message);
  }
}

// ==================== LOP HOC PHAN TIN CHI FUNCTIONS ====================

function showCauHinhTinChiForm() {
  // Load danh sách học kỳ
  apiCall("GET", "/hoc-ky?limit=1000")
    .then((data) => {
      const select = document.getElementById("idHocKyTinChi");
      select.innerHTML = '<option value="">Chọn học kỳ</option>';
      data.data.forEach((hk) => {
        const option = document.createElement("option");
        option.value = hk.id_hoc_ky;
        option.textContent = `${hk.ten_hoc_ky} (${hk.nam_hoc})${hk.dang_kich_hoat ? "" : " - chưa kích hoạt"}`;
        option.dataset.active = hk.dang_kich_hoat ? "true" : "false";
        select.appendChild(option);
      });
      openBsModal("cauHinhTinChiModal");
    })
    .catch((error) => {
      notifyAdmin("Lỗi tải học kỳ: " + error.message);
    });
}

async function saveCauHinhTinChi() {
  const selectHocKy = document.getElementById("idHocKyTinChi");
  const idHocKy = selectHocKy.value;
  const soTinChiToiDa = Number(document.getElementById("soTinChiToiDa").value);

  if (!idHocKy) {
    notifyAdmin("Vui lòng chọn học kỳ cần cấu hình");
    return;
  }

  if (!Number.isInteger(soTinChiToiDa) || soTinChiToiDa <= 0) {
    notifyAdmin("Số tín chỉ tối đa phải là số nguyên dương");
    return;
  }

  const selectedOption = selectHocKy.options[selectHocKy.selectedIndex];
  if (selectedOption?.dataset?.active !== "true") {
    notifyAdmin(
      "Học kỳ này chưa kích hoạt. Vui lòng kích hoạt học kỳ trước khi cấu hình tín chỉ.",
    );
    return;
  }

  try {
    await apiCall("PUT", `/lop-hoc-phan/hoc-ky/${idHocKy}/tin-chi`, {
      tin_chi_toi_da: soTinChiToiDa,
    });
    closeBsModal("cauHinhTinChiModal");
    notifyAdmin("Cấu hình tín chỉ thành công!");
  } catch (error) {
    notifyAdmin("Không thể cấu hình tín chỉ: " + error.message);
  }
}







function openPending() {
  document.getElementById("statusFilter").value = "cho_duyet";
  showPage("registrations");
}
function notifyAdmin(message) {
  document.getElementById("feedbackText").textContent = message;
  document.getElementById("feedback").hidden = false;
}
function askAdmin(title, withReason = false) {
  const dialog = document.getElementById("taskDialog");
  if (dialog.open) return Promise.resolve(null);
  const reason = document.getElementById("taskReason");
  document.getElementById("taskTitle").textContent = title;
  document.getElementById("reasonLabel").hidden = !withReason;
  document.getElementById("taskAccept").textContent = withReason ? "Từ chối yêu cầu" : "Xác nhận";
  reason.value = "";
  dialog.returnValue = "";
  return new Promise(resolve => {
    dialog.addEventListener("close", () => resolve(dialog.returnValue === "ok" ? (withReason ? reason.value : true) : null), {once:true});
    dialog.showModal();
    if (withReason) reason.focus();
  });
}
async function exitAdmin() {
  if (!await askAdmin("Đăng xuất khỏi trang quản trị?")) return;
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  location.href = "../login.html";
}
document.getElementById("navToggle").addEventListener("click", event => {
  const expanded = document.querySelector(".sidebar").classList.toggle("expanded");
  event.currentTarget.setAttribute("aria-expanded", String(expanded));
});
