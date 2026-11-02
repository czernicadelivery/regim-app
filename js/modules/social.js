// ============================================================================
// LOCK IN 2027 — js/modules/social.js
// Zaproszenia (tokeny hex 128-bit), prośby, akceptacja, lista znajomych.
// ============================================================================

import { $, escapeHtml } from "../core/utils.js";
import {
  createInvite, redeemInvite, loadIncomingRequests, loadOutgoingRequests,
  acceptFriendRequest, rejectFriendRequest, loadFriends, deleteFriend
} from "../core/data.js";
import { showToast } from "../components/toast.js";
import { openModal, closeModal } from "../components/modal.js";

let _incoming = [];
let _outgoing = [];
let _friends = [];

export async function render(container) {
  try {
    _incoming = await loadIncomingRequests();
    _outgoing = await loadOutgoingRequests();
    _friends = await loadFriends();
  } catch (e) {
    console.error(e);
  }

  container.innerHTML = `
    <div class="stack-lg">
      <div class="grid-2">
        <button class="btn btn-primary" id="btn-invite" style="padding:20px;">
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
            <i class="fa-solid fa-user-plus" style="font-size:20px;"></i>
            <span>Zaproś</span>
          </div>
        </button>
        <button class="btn btn-secondary" id="btn-redeem" style="padding:20px;">
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
            <i class="fa-solid fa-key" style="font-size:20px;"></i>
            <span>Mam kod</span>
          </div>
        </button>
      </div>

      ${_incoming.length ? `
        <div>
          <div class="section-header"><span class="section-header-title">Przychodzące prośby (${_incoming.length})</span></div>
          <div id="incoming-list">
            ${_incoming.map(r => `
              <div class="card card-padded-sm mb-2">
                <div class="row-between">
                  <div>
                    <div class="text-sm font-bold">${escapeHtml(r.fromName || "Użytkownik")}</div>
                    <div class="text-xs text-tertiary">chce dodać Cię do znajomych</div>
                  </div>
                  <div class="row" style="gap:6px;">
                    <button class="btn-icon btn-icon-sm" data-accept="${r.id}" title="Akceptuj" style="background:var(--accent-subtle);color:var(--accent);">
                      <i class="fa-solid fa-check"></i>
                    </button>
                    <button class="btn-icon btn-icon-sm" data-reject="${r.id}" title="Odrzuć" style="background:var(--danger-subtle);color:var(--danger);">
                      <i class="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}

      ${_outgoing.length ? `
        <div>
          <div class="section-header"><span class="section-header-title">Wysłane (oczekuje) (${_outgoing.length})</span></div>
          <div>
            ${_outgoing.map(r => `
              <div class="card card-padded-sm mb-2">
                <div class="row-between">
                  <div>
                    <div class="text-sm font-bold">${escapeHtml(r.toName || "—")}</div>
                    <div class="text-xs text-tertiary">czeka na akceptację</div>
                  </div>
                  <span class="badge badge-warning">Oczekuje</span>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}

      <div>
        <div class="section-header"><span class="section-header-title">Znajomi (${_friends.length})</span></div>
        <div id="friends-list">
          ${_friends.length ? _friends.map(f => {
            const myUid = window.__currentUser?.uid;
            const friendUid = f.users.find(u => u !== myUid);
            const friendName = f.names?.[friendUid] || "Znajomy";
            return `
              <div class="card card-padded-sm mb-2">
                <div class="row-between">
                  <div class="row" style="gap:10px;">
                    <div class="avatar">${escapeHtml((friendName[0] || "?").toUpperCase())}</div>
                    <div>
                      <div class="text-sm font-bold">${escapeHtml(friendName)}</div>
                      <div class="text-xs text-tertiary">Znajomy</div>
                    </div>
                  </div>
                  <button class="btn-icon btn-icon-sm" data-del-friend="${f.id}" title="Usuń znajomego" style="color:var(--danger);">
                    <i class="fa-solid fa-user-minus"></i>
                  </button>
                </div>
              </div>
            `;
          }).join("") : `<div class="empty"><div class="empty-icon">👥</div><div class="empty-title">Brak znajomych</div><div class="empty-text">Zaproś kogoś kodem.</div></div>`}
        </div>
      </div>
    </div>
  `;

  $("btn-invite")?.addEventListener("click", openInviteModal);
  $("btn-redeem")?.addEventListener("click", openRedeemModal);

  container.querySelectorAll("[data-accept]").forEach(b => {
    b.addEventListener("click", async () => {
      try {
        await acceptFriendRequest(b.dataset.accept);
        showToast("✅ Zaakceptowano", "success");
        const c = document.getElementById("social-content");
        if (c) render(c);
      } catch (e) {
        console.error(e); showToast(e.message || "Błąd", "error");
      }
    });
  });

  container.querySelectorAll("[data-reject]").forEach(b => {
    b.addEventListener("click", async () => {
      try {
        await rejectFriendRequest(b.dataset.reject);
        showToast("Odrzucono", "");
        const c = document.getElementById("social-content");
        if (c) render(c);
      } catch (e) { showToast("Błąd", "error"); }
    });
  });

  container.querySelectorAll("[data-del-friend]").forEach(b => {
    b.addEventListener("click", async () => {
      if (!confirm("Usunąć znajomego?")) return;
      try {
        await deleteFriend(b.dataset.delFriend);
        showToast("Usunięto", "");
        const c = document.getElementById("social-content");
        if (c) render(c);
      } catch (e) { showToast("Błąd", "error"); }
    });
  });
}

function openInviteModal() {
  const body = document.createElement("div");
  body.innerHTML = `<div class="text-sm text-secondary">Generuję kod...</div>`;

  openModal({
    title: "Zaproś znajomego",
    body,
    actions: [{ label: "Zamknij", variant: "ghost" }]
  });

  createInvite().then(({ token, expiresAt }) => {
    body.innerHTML = `
      <div class="stack">
        <p class="text-sm text-secondary">Wyślij ten kod znajomemu (np. SMS-em). Jest ważny 7 dni i jednorazowo identyfikuje zaproszenie.</p>
        <div class="card card-flat text-center" style="padding:20px;">
          <div class="text-xs text-tertiary uppercase mb-2">TWÓJ KOD</div>
          <div style="font-family:monospace;font-size:16px;font-weight:800;letter-spacing:1px;word-break:break-all;">${token}</div>
        </div>
        <button class="btn btn-primary btn-block" id="btn-copy-token">
          <i class="fa-solid fa-copy"></i> Skopiuj kod
        </button>
        <div class="text-xs text-tertiary text-center">
          Wygasa: ${expiresAt.toLocaleDateString("pl-PL")} ${expiresAt.toLocaleTimeString("pl-PL", {hour:"2-digit",minute:"2-digit"})}
        </div>
      </div>
    `;
    body.querySelector("#btn-copy-token")?.addEventListener("click", () => {
      navigator.clipboard.writeText(token).then(() => {
        showToast("✅ Skopiowano", "success");
      }).catch(() => {
        showToast("Kopiuj ręcznie", "");
      });
    });
  }).catch(e => {
    body.innerHTML = `<div class="text-sm text-danger">Błąd: ${e.message}</div>`;
  });
}

function openRedeemModal() {
  const body = document.createElement("div");
  body.innerHTML = `
    <div class="stack">
      <p class="text-sm text-secondary">Wpisz kod, który dostałeś od znajomego.</p>
      <div class="form-group">
        <label class="form-label">Kod zaproszenia</label>
        <input class="input" id="redeem-token" placeholder="np. a3f2b1c4..." style="font-family:monospace;">
      </div>
    </div>
  `;

  openModal({
    title: "Mam kod",
    body,
    actions: [
      { label: "Anuluj", variant: "ghost" },
      {
        label: "Wyślij prośbę", variant: "primary",
        onClick: async () => {
          const token = body.querySelector("#redeem-token")?.value.trim();
          if (!token) { showToast("Wpisz kod", "error"); return; }
          try {
            const { toName } = await redeemInvite(token);
            showToast(`✅ Zaproszenie wysłane do ${toName}`, "success");
            const c = document.getElementById("social-content");
            if (c) render(c);
          } catch (e) {
            showToast(e.message || "Błąd", "error");
          }
        },
        close: false
      }
    ]
  });
}
