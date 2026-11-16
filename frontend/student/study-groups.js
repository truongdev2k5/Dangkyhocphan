const studyUi = (() => {
  const byId = id => document.getElementById(id);
  const room = byId("studyDialog");
  const inbox = byId("studyInbox");
  const form = byId("studyForm");
  const list = byId("studyList");
  const timeZone = "Asia/Ho_Chi_Minh";
  const displayTime = new Intl.DateTimeFormat("vi-VN", {
    timeZone, dateStyle: "short", timeStyle: "short",
  });
  const inputTime = new Intl.DateTimeFormat("sv-SE", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  const stateLabels = {
    sap_dien_ra: "Sắp diễn ra",
    mo_phong: "Đã mở phòng",
    da_ket_thuc: "Đã kết thúc",
    da_huy: "Đã hủy",
  };
  let context;
  let meetings = [];
  let notices = [];
  let meetingSignature;
  let noticeSignature;
  let editing;
  let formOrigin;
  let requestId = 0;
  let loadingMeetings = false;
  let loadingInbox = false;
  let serverTime;
  let initialized = false;
  let focusMeeting;

  function now() {
    return serverTime ? serverTime.instant + performance.now() - serverTime.received : Date.now();
  }

  async function request(method, route, body) {
    const response = await apiCall(method, "/hoc-nhom" + route, body);
    const instant = Date.parse(response.gio_may_chu);
    if (Number.isFinite(instant)) serverTime = { instant, received: performance.now() };
    return response.data;
  }

  const routeFor = scope => `/mon/${encodeURIComponent(scope.course)}/hoc-ky/${scope.semester}`;
  const format = value => displayTime.format(new Date(value));
  const localField = value => inputTime.format(new Date(value)).replace(" ", "T");

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function button(text, callback, appearance = "") {
    const node = element("button", text, `study-button ${appearance}`.trim());
    node.type = "button";
    node.addEventListener("click", callback);
    return node;
  }

  function state(meeting) {
    if (meeting.trang_thai === "da_huy") return "da_huy";
    const instant = now();
    if (instant >= Date.parse(meeting.ket_thuc)) return "da_ket_thuc";
    return instant >= Date.parse(meeting.mo_luc) ? "mo_phong" : "sap_dien_ra";
  }

  function refreshControls() {
    for (const meeting of meetings) {
      const card = document.getElementById(`studyMeeting-${meeting.id}`);
      if (!card) continue;
      const status = state(meeting);
      const inactive = status === "da_huy" || status === "da_ket_thuc";
      const pill = card.querySelector(".study-pill");
      if (pill.dataset.state !== status) {
        pill.dataset.state = status;
        pill.textContent = stateLabels[status];
      }
      const join = card.querySelector("[data-join]");
      join.disabled = status !== "mo_phong" || join.dataset.busy === "true";
      const hint = card.querySelector("[data-opening]");
      hint.hidden = status !== "sap_dien_ra";
      for (const action of card.querySelectorAll("[data-active-only]")) {
        action.hidden = inactive;
      }
    }
  }

  async function joinMeeting(meeting, control) {
    const tab = window.open("about:blank", "_blank");
    if (!tab) {
      byId("studyStatus").textContent = "Trình duyệt đã chặn tab mới. Cho phép mở tab rồi thử lại.";
      return;
    }
    tab.opener = null;
    control.dataset.busy = "true";
    refreshControls();
    try {
      const { link_meet } = await request("GET", `/${meeting.id}/vao-phong`);
      tab.location.replace(link_meet);
    } catch (error) {
      tab.close();
      await loadMeetings();
      byId("studyStatus").textContent = error.message;
    } finally {
      delete control.dataset.busy;
      refreshControls();
    }
  }

  async function changeInterest(meeting, control) {
    control.disabled = true;
    try {
      await request(meeting.quan_tam ? "DELETE" : "PUT", `/${meeting.id}/quan-tam`);
      await Promise.all([loadMeetings(), loadInbox()]);
    } catch (error) {
      byId("studyStatus").textContent = error.message;
    } finally {
      control.disabled = false;
    }
  }

  async function cancelMeeting(meeting, control) {
    if (!await studentConfirm("Hủy buổi học", `Bạn muốn hủy buổi “${meeting.chu_de}”?`, "Hủy buổi học")) return;
    control.disabled = true;
    try {
      await request("DELETE", `/${meeting.id}`);
      await Promise.all([loadMeetings(), loadInbox()]);
    } catch (error) {
      byId("studyStatus").textContent = error.message;
    } finally {
      control.disabled = false;
    }
  }

  function renderMeetings() {
    const previouslyFocused = list.contains(document.activeElement)
      ? { id: document.activeElement.closest(".study-card")?.id, action: document.activeElement.dataset.action }
      : null;
    const fragment = document.createDocumentFragment();
    const ordered = [...meetings].sort((a, b) => {
      const past = item => ["da_huy", "da_ket_thuc"].includes(state(item));
      return Number(past(a)) - Number(past(b)) ||
        (past(a) ? -1 : 1) * (Date.parse(a.bat_dau) - Date.parse(b.bat_dau));
    });

    for (const meeting of ordered) {
      const card = element("article", null, "study-card");
      card.id = `studyMeeting-${meeting.id}`;
      card.tabIndex = -1;
      const heading = element("div", null, "study-card-heading");
      heading.append(element("h4", meeting.chu_de), element("span", null, "study-pill"));
      const opening = element("p", `Mở nút vào phòng lúc ${format(meeting.mo_luc)}`);
      opening.dataset.opening = "";
      card.append(heading, element("p", `Chủ trì: ${meeting.chu_tri}`),
        element("p", `${format(meeting.bat_dau)} – ${format(meeting.ket_thuc)} · Giờ Việt Nam`), opening);
      const actions = element("div", null, "study-actions");
      const join = button("Vào Google Meet", event => joinMeeting(meeting, event.currentTarget), "study-primary");
      join.dataset.join = "";
      join.dataset.action = "join";
      const interest = button(meeting.quan_tam ? "Bỏ quan tâm" : "Quan tâm",
        event => changeInterest(meeting, event.currentTarget));
      interest.setAttribute("aria-pressed", String(meeting.quan_tam));
      interest.dataset.activeOnly = "";
      interest.dataset.action = "follow";
      actions.append(join, interest);
      if (meeting.chu_tri_cua_toi) {
        const edit = button("Sửa lịch", event => openForm(meeting, event.currentTarget));
        const cancel = button("Hủy buổi", event => cancelMeeting(meeting, event.currentTarget), "study-danger");
        edit.dataset.activeOnly = cancel.dataset.activeOnly = "";
        edit.dataset.action = "edit";
        cancel.dataset.action = "cancel";
        actions.append(edit, cancel);
      }
      card.append(actions);
      fragment.append(card);
    }
    list.replaceChildren(fragment);
    refreshControls();
    if (previouslyFocused?.id) {
      const card = document.getElementById(previouslyFocused.id);
      const control = [...(card?.querySelectorAll("button") ?? [])]
        .find(candidate => candidate.dataset.action === previouslyFocused.action);
      (control && !control.disabled && !control.hidden ? control : card)?.focus({ preventScroll: true });
    }
  }

  async function loadMeetings() {
    if (!room.open || !context) return;
    const generation = ++requestId;
    loadingMeetings = true;
    try {
      const rows = await request("GET", routeFor(context));
      if (!room.open || generation !== requestId) return;
      const signature = JSON.stringify(rows.map(({ trang_thai, ...meeting }) =>
        ({ ...meeting, huy: trang_thai === "da_huy" })));
      meetings = rows;
      if (signature !== meetingSignature) {
        meetingSignature = signature;
        renderMeetings();
      }
      byId("studyNew").disabled = false;
      const status = rows.length ? "" : "Chưa có buổi học nhóm. Bạn có thể đặt buổi đầu tiên cho môn này.";
      if (byId("studyStatus").textContent !== status) byId("studyStatus").textContent = status;
      if (focusMeeting) {
        document.getElementById(`studyMeeting-${focusMeeting}`)?.focus();
        focusMeeting = undefined;
      }
    } catch (error) {
      if (!room.open || generation !== requestId) return;
      byId("studyStatus").textContent = error.message;
      if (error.status === 403) {
        meetings = [];
        meetingSignature = undefined;
        list.replaceChildren();
        byId("studyNew").disabled = true;
        closeForm(false);
      }
    } finally {
      if (generation === requestId) loadingMeetings = false;
    }
  }

  function openForm(meeting, origin = byId("studyNew")) {
    editing = meeting;
    formOrigin = origin;
    form.reset();
    byId("studyFormError").hidden = true;
    byId("studyFormTitle").textContent = meeting ? "Sửa buổi học" : "Đặt buổi học";
    byId("studyLinkHint").hidden = !meeting;
    form.elements.link_meet.required = !meeting;
    if (meeting) {
      form.elements.chu_de.value = meeting.chu_de;
      form.elements.bat_dau.value = localField(meeting.bat_dau);
      form.elements.ket_thuc.value = localField(meeting.ket_thuc);
    }
    form.hidden = false;
    byId("studyFormTitle").focus();
  }

  function closeForm(restoreFocus = true) {
    if (form.hidden) return;
    form.hidden = true;
    if (restoreFocus) {
      const target = formOrigin?.isConnected ? formOrigin : byId("studyNew");
      target.focus({ preventScroll: true });
    }
    editing = undefined;
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const submit = form.querySelector("[type=submit]");
    if (submit.disabled) return;
    const generation = context;
    const target = editing;
    const errorBox = byId("studyFormError");
    errorBox.hidden = true;
    submit.disabled = true;
    try {
      const payload = Object.fromEntries(new FormData(form));
      const saved = await request(target ? "PUT" : "POST",
        target ? `/${target.id}` : routeFor(context), payload);
      if (generation !== context || !room.open) return;
      focusMeeting = saved.id;
      closeForm(false);
      await Promise.all([loadMeetings(), loadInbox()]);
    } catch (error) {
      if (generation !== context || !room.open) return;
      errorBox.textContent = error.message;
      errorBox.hidden = false;
    } finally {
      submit.disabled = false;
    }
  });

  const noticeMessages = {
    mo_phong: "Đã mở phòng Google Meet",
    doi_lich: "Đã đổi lịch",
    huy: "Đã hủy buổi học",
  };

  function renderInbox() {
    const unread = notices.filter(item => !item.doc_luc).length;
    const badge = byId("studyUnread");
    badge.textContent = unread ? String(unread) : "";
    badge.hidden = !unread;
    byId("studyInboxOpen").setAttribute("aria-label", unread
      ? `Thông báo học nhóm, ${unread} chưa đọc` : "Thông báo học nhóm");
    const read = byId("studyRead");
    if (!unread && document.activeElement === read) inbox.querySelector("header button").focus();
    read.hidden = !unread;
    if (room.open && context) {
      const relevant = notices.find(item => !item.doc_luc &&
        item.Buoi.ma_mon_hoc === context.course && Number(item.Buoi.id_hoc_ky) === Number(context.semester));
      const message = relevant ? `${noticeMessages[relevant.loai]} · ${relevant.chu_de}` : "";
      const roomNotice = byId("studyRoomNotice");
      if (roomNotice.textContent !== message) roomNotice.textContent = message;
    }
    if (!inbox.open) return;

    const signature = JSON.stringify(notices);
    if (signature !== noticeSignature) {
      noticeSignature = signature;
      byId("studyInboxList").replaceChildren(...notices.map(item => {
        const card = element("li", null, "study-card");
        card.toggleAttribute("data-unread", !item.doc_luc);
        card.append(element("h4", item.chu_de),
          element("p", `${noticeMessages[item.loai]} · ${format(item.bat_dau)}`),
          button("Xem buổi học", () => {
            inbox.close();
            open({
              course: item.Buoi.ma_mon_hoc,
              semester: item.Buoi.id_hoc_ky,
              label: subjectLabel(item.Buoi.MonHoc.ten_mon_hoc),
            }, item.id_buoi);
          }));
        return card;
      }));
    }
    byId("studyInboxStatus").textContent = notices.length ? "" : "Bạn chưa có thông báo học nhóm.";
  }

  async function loadInbox() {
    if (loadingInbox) return;
    loadingInbox = true;
    try {
      notices = await request("POST", "/thong-bao/dong-bo");
      renderInbox();
    } catch (error) {
      if (inbox.open) byId("studyInboxStatus").textContent = error.message;
    } finally {
      loadingInbox = false;
    }
  }

  byId("studyRead").addEventListener("click", async event => {
    const control = event.currentTarget;
    const ids = notices.filter(item => !item.doc_luc).map(item => item.id);
    control.disabled = true;
    try {
      await request("PATCH", "/thong-bao/da-doc", { ids });
      notices = notices.map(item => ids.includes(item.id) ? { ...item, doc_luc: new Date(now()) } : item);
      renderInbox();
      await loadInbox();
    } catch (error) {
      byId("studyInboxStatus").textContent = error.message;
    } finally {
      control.disabled = false;
    }
  });

  function open(scope, meetingId) {
    context = { ...scope };
    meetings = [];
    meetingSignature = undefined;
    focusMeeting = meetingId;
    list.replaceChildren();
    byId("studyCourse").textContent = [scope.label, scope.semesterLabel].filter(Boolean).join(" · ");
    byId("studyStatus").textContent = "Đang tải lịch học nhóm…";
    byId("studyNew").disabled = true;
    if (!room.open) room.showModal();
    renderInbox();
    loadMeetings();
  }

  byId("studyInboxOpen").addEventListener("click", () => {
    noticeSignature = undefined;
    inbox.showModal();
    renderInbox();
    loadInbox();
  });
  byId("studyNew").addEventListener("click", () => openForm());
  byId("studyCloseForm").addEventListener("click", () => closeForm());
  room.addEventListener("close", () => {
    ++requestId;
    loadingMeetings = false;
    context = undefined;
    closeForm(false);
  });

  function start() {
    if (initialized) return;
    initialized = true;
    byId("studyInboxOpen").hidden = false;
    loadInbox();
    setInterval(refreshControls, 300);
    setInterval(() => {
      if (document.hidden) return;
      if (room.open && !loadingMeetings) loadMeetings();
      loadInbox();
    }, 5000);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) return;
      if (room.open && !loadingMeetings) loadMeetings();
      loadInbox();
    });
  }

  return { open, start };
})();

function openStudyGroups(scope) {
  studyUi.open(scope);
}

function startStudyGroups() {
  studyUi.start();
}
