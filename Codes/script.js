/* ============================================================
   Craft & Paint With Us JA — script.js
   Student : Kezia Barnes | ID: 2006650
   Module  : CIT2011 Web Programming — Individual Assignment #2

   IA2 JavaScript covers:
   a) DOM Manipulation  — getElementById, querySelector, innerHTML, etc.
   b) Event Handling    — at least 2 working event listeners
   c) Form Validation   — empty fields, email format, password match
   d) Interactivity     — control structures, arithmetic calculations
   ============================================================ */


/* ============================================================
   IA2 JS a) DOM Manipulation — Cart badge helpers
   ============================================================ */

/** Load cart from localStorage (returns [] if empty). */
function loadCart() {
  try { return JSON.parse(localStorage.getItem("cpwuja_cart")) || []; }
  catch { return []; }
}

/** Persist cart array to localStorage. */
function saveCart() {
  localStorage.setItem("cpwuja_cart", JSON.stringify(cart));
}

/* Global cart — loaded once on page start */
let cart = loadCart();

/**
 * Update the #cart-count badge in the nav.
 * IA2 JS a) DOM Manipulation: querySelectorAll + textContent
 */
function updateBadge() {
  /* IA2 JS d) Arithmetic: sum all quantities with reduce */
  const total = cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
  const badges = document.querySelectorAll("#cart-count");
  badges.forEach(function (b) {
    b.textContent  = total > 0 ? total : "";
    /* IA2 JS d) Control structure: hide badge when cart is empty */
    b.style.display = total > 0 ? "inline-flex" : "none";
  });
}

/**
 * Show a brief toast notification.
 * IA2 JS a) DOM Manipulation: createElement, classList.add/remove
 */
function showToast(msg) {
  var toast = document.getElementById("toast-notification");
  if (!toast) {
    toast = document.createElement("div");
    toast.id        = "toast-notification";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(function () { toast.classList.remove("show"); }, 3000);
}


/* ============================================================
   IA2 JS b) Event Handling — Add to Cart (called by buttons)
   IA2 JS d) Control structure + arithmetic
   ============================================================ */

/**
 * Add a product to the cart or increment its quantity.
 * Called by data-driven onclick attributes on product buttons.
 * @param {string} name   Product name
 * @param {number} price  Price in JMD
 * @param {string} emoji  Emoji icon
 */
function addToCart(name, price, emoji) {
  /* IA2 JS d) Control structure: check if item already in cart */
  var existing = cart.find(function (i) { return i.name === name; });
  if (existing) {
    existing.qty += 1;          /* IA2 JS d) Arithmetic: increment */
  } else {
    cart.push({ name: name, price: price, qty: 1, emoji: emoji });
  }
  saveCart();
  updateBadge();
  showToast("\uD83D\uDED2 " + name + " added to cart!");
}


/* ============================================================
   IA2 JS d) Arithmetic — Pricing helpers
   ============================================================ */

/** Format a number as a Jamaican dollar string. */
function fmtJMD(n) {
  return "J$" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Calculate subtotal, discount, tax and total from the cart.
 * IA2 JS d) Arithmetic: discount (10% ≥ J$10,000) + 15% GCT
 * @returns {object} { subtotal, discount, tax, total }
 */
function calcTotals() {
  /* IA2 JS d) Arithmetic: subtotal via Array.reduce */
  var subtotal = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);

  /* IA2 JS d) Control structure: apply discount only above threshold */
  var discount = subtotal >= 10000 ? subtotal * 0.10 : 0;
  var after    = subtotal - discount;
  var tax      = after * 0.15;           /* IA2 JS d) Arithmetic: 15% GCT */
  var total    = after + tax;
  return { subtotal: subtotal, discount: discount, tax: tax, total: total };
}

/** Write calculated totals into summary DOM elements. */
function showTotals(prefix) {
  var t   = calcTotals();
  var set = function (id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;   /* IA2 JS a) DOM Manipulation */
  };
  set(prefix + "subtotal", fmtJMD(t.subtotal));
  set(prefix + "discount", t.discount > 0 ? "-" + fmtJMD(t.discount) : "-J$0.00");
  set(prefix + "tax",      fmtJMD(t.tax));
  set(prefix + "total",    fmtJMD(t.total));
}


/* ============================================================
   IA2 JS a) DOM Manipulation — Cart page rendering
   ============================================================ */

/**
 * Render the cart table and summary on cart.html.
 * IA2 JS a) DOM Manipulation: getElementById, innerHTML
 */
function renderCart() {
  var tbody     = document.getElementById("cart-tbody");
  var emptyDiv  = document.getElementById("cart-empty");
  var tableWrap = document.getElementById("cart-table-wrap");
  if (!tbody) return;  /* not on cart page */

  /* IA2 JS d) Control structure: branch on empty cart */
  if (cart.length === 0) {
    if (emptyDiv)  emptyDiv.style.display  = "block";
    if (tableWrap) tableWrap.style.display = "none";
    showTotals("summary-");
    return;
  }

  if (emptyDiv)  emptyDiv.style.display  = "none";
  if (tableWrap) tableWrap.style.display = "grid";

  /* Build table rows — IA2 JS a) DOM Manipulation: innerHTML */
  var rows = "";
  cart.forEach(function (item, idx) {
    /* IA2 JS d) Arithmetic: line subtotal */
    var lineTotal = item.price * item.qty;
    rows += '<tr>'
      + '<td><strong>' + item.emoji + ' ' + item.name + '</strong></td>'
      + '<td>' + fmtJMD(item.price) + '</td>'
      + '<td>'
      +   '<div class="qty-control">'
      +     '<button class="qty-btn" aria-label="Decrease" onclick="changeQty(' + idx + ',-1)">\u2212</button>'
      +     '<span>' + item.qty + '</span>'
      +     '<button class="qty-btn" aria-label="Increase" onclick="changeQty(' + idx + ',1)">+</button>'
      +   '</div>'
      + '</td>'
      + '<td>' + fmtJMD(lineTotal) + '</td>'
      + '<td><button class="remove-btn" aria-label="Remove" onclick="removeItem(' + idx + ')">\uD83D\uDDD1</button></td>'
      + '</tr>';
  });
  tbody.innerHTML = rows;
  showTotals("summary-");
}

/**
 * Change quantity of a cart item.
 * IA2 JS b) Event Handling: called by qty +/− buttons
 * IA2 JS d) Control structure + arithmetic
 */
function changeQty(idx, delta) {
  cart[idx].qty += delta;               /* IA2 JS d) Arithmetic */
  if (cart[idx].qty <= 0) cart.splice(idx, 1);  /* remove if zero */
  saveCart();
  updateBadge();
  renderCart();
}

/** Remove item from cart by index. */
function removeItem(idx) {
  var name = cart[idx].name;
  cart.splice(idx, 1);
  saveCart();
  updateBadge();
  renderCart();
  showToast("\u274C " + name + " removed.");
}

/** Open the clear-cart confirmation modal. */
function clearCart() { openModal("clearCartModal"); }

/** Confirmed clear — wipe cart and re-render. */
function confirmClearCart() {
  cart = [];
  saveCart();
  updateBadge();
  closeModal("clearCartModal");
  renderCart();
  showToast("\uD83D\uDDD1 Cart cleared.");
}


/* ============================================================
   IA2 JS a) DOM Manipulation — Modal helpers
   ============================================================ */
function openModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.add("open");
}
function closeModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove("open");
}


/* ============================================================
   IA2 JS c) Form Validation helpers
   ============================================================ */

/** Show an error message under a field. IA2 JS a) DOM Manipulation */
function showError(id, msg) {
  var el = document.getElementById(id);
  if (el) { el.textContent = msg; el.classList.add("visible"); }
}

/** Clear a specific error message. */
function clearError(id) {
  var el = document.getElementById(id);
  if (el) { el.textContent = ""; el.classList.remove("visible"); }
}

/** Clear all errors in a form. */
function clearAllErrors(form) {
  form.querySelectorAll(".error-msg").forEach(function (e) {
    e.textContent = ""; e.classList.remove("visible");
  });
  form.querySelectorAll(".error-field").forEach(function (i) {
    i.classList.remove("error-field");
  });
}

/** Mark an input as invalid. */
function markInvalid(inputId, errId, msg) {
  var input = document.getElementById(inputId);
  if (input) input.classList.add("error-field");
  showError(errId, msg);
}

/** Validate email format. IA2 JS c) Input handling */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Validate Jamaican phone number. IA2 JS c) Input handling */
function isValidPhone(phone) {
  return /^(\+?1?876)?[\s-]?\(?\d{3}\)?[\s-]?\d{4}$/.test(phone.replace(/\s/g, ""));
}


/* ============================================================
   IA2 JS b+c) Event Listener #1 — Registration form submit
   ============================================================ */
(function initRegister() {
  var form = document.getElementById("register-form");
  if (!form) return;

  /* IA2 JS b) Event Listener: submit */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearAllErrors(form);

    var ok = true;   /* IA2 JS d) Control structure flag */

    /* --- First name --- */
    var fname = document.getElementById("reg-fname").value.trim();
    if (!fname) { markInvalid("reg-fname", "reg-fname-err", "First name is required."); ok = false; }

    /* --- Last name --- */
    var lname = document.getElementById("reg-lname").value.trim();
    if (!lname) { markInvalid("reg-lname", "reg-lname-err", "Last name is required."); ok = false; }

    /* --- Date of birth: must be ≥ 13 years old --- */
    var dobVal = document.getElementById("reg-dob").value;
    if (!dobVal) {
      markInvalid("reg-dob", "reg-dob-err", "Date of birth is required."); ok = false;
    } else {
      /* IA2 JS d) Arithmetic: calculate age from DOB */
      var dob   = new Date(dobVal);
      var today = new Date();
      var age   = today.getFullYear() - dob.getFullYear();
      var m     = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      if (age < 13) { markInvalid("reg-dob", "reg-dob-err", "You must be at least 13 to register."); ok = false; }
    }

    /* --- Email --- */
    var email = document.getElementById("reg-email").value.trim();
    if (!email) {
      markInvalid("reg-email", "reg-email-err", "Email is required."); ok = false;
    } else if (!isValidEmail(email)) {
      markInvalid("reg-email", "reg-email-err", "Enter a valid email (e.g. jane@email.com)."); ok = false;
    }

    /* --- Username --- */
    var username = document.getElementById("reg-username").value.trim();
    if (!username) {
      markInvalid("reg-username", "reg-username-err", "Username is required."); ok = false;
    } else if (username.length < 3) {
      markInvalid("reg-username", "reg-username-err", "Username must be at least 3 characters."); ok = false;
    }

    /* --- Password --- */
    var password = document.getElementById("reg-password").value;
    if (!password) {
      markInvalid("reg-password", "reg-password-err", "Password is required."); ok = false;
    } else if (password.length < 8) {
      markInvalid("reg-password", "reg-password-err", "Password must be at least 8 characters."); ok = false;
    }

    /* --- Confirm password --- */
    var confirm = document.getElementById("reg-confirm").value;
    if (!confirm) {
      markInvalid("reg-confirm", "reg-confirm-err", "Please confirm your password."); ok = false;
    } else if (confirm !== password) {
      markInvalid("reg-confirm", "reg-confirm-err", "Passwords do not match."); ok = false;
    }

    /* --- Terms checkbox --- */
    var terms = form.querySelector("input[type='checkbox']");
    if (terms && !terms.checked) {
      showToast("\u26A0 Please accept the Terms of Service.");
      ok = false;
    }

    /* IA2 JS d) Control structure: only proceed if all valid */
    if (!ok) return;

    /* Save user to localStorage */
    var users = JSON.parse(localStorage.getItem("cpwuja_users") || "[]");
    users.push({ fname: fname, lname: lname, email: email, username: username });
    localStorage.setItem("cpwuja_users", JSON.stringify(users));

    form.reset();
    updateStrengthBar("");
    showToast("\u2705 Account created! Redirecting\u2026");
    setTimeout(function () { window.location.href = "login.html"; }, 2000);
  });

  /* IA2 JS b) Event Listener: password input → strength bar */
  var pwInput = document.getElementById("reg-password");
  if (pwInput) {
    pwInput.addEventListener("input", function () {
      updateStrengthBar(this.value);
    });
  }
})();


/* ============================================================
   IA2 JS d) Password strength bar
   Control structure: if/else chain to map score → colour
   ============================================================ */
function updateStrengthBar(pw) {
  var bar = document.getElementById("strength-bar");
  if (!bar) return;
  /* IA2 JS d) Arithmetic: count criteria met */
  var score = 0;
  if (pw.length >= 8)            score++;
  if (/[A-Z]/.test(pw))          score++;
  if (/[0-9]/.test(pw))          score++;
  if (/[^A-Za-z0-9]/.test(pw))   score++;

  /* IA2 JS d) Control structure: set width and colour */
  var colours = ["transparent", "#C62828", "#F4A300", "#2E7D32", "#1B5E20"];
  var widths   = ["0%",          "25%",     "50%",     "75%",     "100%"];
  bar.style.width      = widths[score];
  bar.style.background = colours[score];
}


/* ============================================================
   IA2 JS b+c) Event Listener #2 — Login form submit
   ============================================================ */
(function initLogin() {
  var form = document.getElementById("login-form");
  if (!form) return;

  /* IA2 JS b) Event Listener: submit */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearAllErrors(form);

    var user = document.getElementById("login-username").value.trim();
    var pass = document.getElementById("login-password").value;
    var ok   = true;

    /* IA2 JS c) Form Validation: empty field checks */
    if (!user) { markInvalid("login-username", "login-username-err", "Please enter your username or email."); ok = false; }
    if (!pass) { markInvalid("login-password", "login-password-err", "Please enter your password."); ok = false; }
    if (!ok) return;

    /* IA2 JS d) Control structure: check stored users */
    var users = JSON.parse(localStorage.getItem("cpwuja_users") || "[]");
    var match = users.find(function (u) { return u.username === user || u.email === user; });

    /* Allow a demo account if no users registered yet */
    if (!match && users.length === 0 && user === "demo") {
      match = { fname: "Demo" };
    }

    if (!match) {
      markInvalid("login-username", "login-username-err", "No account found with that username or email.");
      return;
    }

    /* IA2 JS a) DOM Manipulation: show success message */
    var successEl = document.getElementById("login-success");
    if (successEl) {
      successEl.textContent = "\uD83D\uDC4B Welcome back, " + (match.fname || user) + "! Redirecting\u2026";
      successEl.classList.add("visible");
    }
    showToast("\u2705 Logged in successfully!");
    setTimeout(function () { window.location.href = "index.html"; }, 2000);
  });
})();


/* ============================================================
   IA2 JS b+c) Event Listener #3 — Checkout form submit
   ============================================================ */
(function initCheckout() {
  var form = document.getElementById("checkout-form");
  if (!form) return;

  /* Render checkout summary on page load */
  renderCheckoutSummary();

  /* IA2 JS b) Event Listener: submit */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearAllErrors(form);
    var ok = true;

    /* --- Full name --- */
    var name = document.getElementById("co-name").value.trim();
    if (!name) { markInvalid("co-name", "co-name-err", "Full name is required."); ok = false; }

    /* --- Phone --- */
    var phone = document.getElementById("co-phone").value.trim();
    if (!phone) {
      markInvalid("co-phone", "co-phone-err", "Phone number is required."); ok = false;
    } else if (!isValidPhone(phone)) {
      markInvalid("co-phone", "co-phone-err", "Enter a valid number e.g. (876) 454-4554."); ok = false;
    }

    /* --- Address --- */
    var addr = document.getElementById("co-address").value.trim();
    if (!addr) { markInvalid("co-address", "co-address-err", "Street address is required."); ok = false; }

    /* --- City --- */
    var city = document.getElementById("co-city").value.trim();
    if (!city) { markInvalid("co-city", "co-city-err", "City / Town is required."); ok = false; }

    /* --- Payment amount vs order total ---
       IA2 JS d) Arithmetic: verify amount covers total */
    var paid  = parseFloat(document.getElementById("co-amount").value) || 0;
    var t     = calcTotals();
    if (paid <= 0) {
      markInvalid("co-amount", "co-amount-err", "Please enter the payment amount."); ok = false;
    } else if (paid < t.total) {
      /* IA2 JS d) Arithmetic: calculate shortfall */
      var short = (t.total - paid).toFixed(2);
      markInvalid("co-amount", "co-amount-err", "Amount is J$" + short + " short of the total (" + fmtJMD(t.total) + ")."); ok = false;
    }

    if (ok) openModal("confirmModal");   /* IA2 JS d) Control structure */
  });
})();

/** Render item list inside checkout order summary. */
function renderCheckoutSummary() {
  var container = document.getElementById("checkout-items");
  if (!container) return;

  /* IA2 JS a) DOM Manipulation: build item list with innerHTML */
  if (cart.length === 0) {
    container.innerHTML = "<p style='color:var(--clr-muted);font-size:.875rem;'>No items in cart.</p>";
  } else {
    var html = "";
    cart.forEach(function (item) {
      /* IA2 JS d) Arithmetic: line total */
      html += '<div class="checkout-order-item">'
        + '<span>' + item.emoji + ' ' + item.name + ' \xD7 ' + item.qty + '</span>'
        + '<span>' + fmtJMD(item.price * item.qty) + '</span>'
        + '</div>';
    });
    container.innerHTML = html;
  }
  showTotals("co-");
}

/** Finalise order after user confirms. */
function confirmCheckout() {
  closeModal("confirmModal");
  cart = [];
  saveCart();
  updateBadge();

  /* IA2 JS a) DOM Manipulation: show success, hide layout */
  var success = document.getElementById("checkout-success");
  var layout  = document.querySelector(".checkout-layout");
  if (success) success.classList.add("visible");
  if (layout)  layout.style.display = "none";
  window.scrollTo({ top: 0, behavior: "smooth" });
  showToast("\uD83C\uDF89 Order placed! Thank you!");
}

/** Cancel checkout — go back to cart. */
function cancelCheckout() { window.location.href = "cart.html"; }


/* ============================================================
   IA2 JS b) Event Listener #4 — Hamburger mobile nav toggle
   IA2 JS a) DOM Manipulation: classList.toggle
   ============================================================ */
(function initHamburger() {
  var btn   = document.querySelector(".hamburger");
  var navUl = document.querySelector(".site-nav ul");
  if (!btn || !navUl) return;

  btn.addEventListener("click", function () {
    navUl.classList.toggle("open");
    var open = navUl.classList.contains("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
})();


/* ============================================================
   IA2 JS a) DOM Manipulation — Highlight active nav link
   ============================================================ */
(function highlightNav() {
  var page  = window.location.pathname.split("/").pop() || "index.html";
  var links = document.querySelectorAll(".site-nav a");
  links.forEach(function (link) {
    /* IA2 JS d) Control structure: match href to current page */
    if (link.getAttribute("href") === page) link.classList.add("active");
  });
})();


/* ============================================================
   IA2 JS b) Event Listener #5 — Scroll-to-top button
   IA2 JS a) DOM Manipulation: style.display
   ============================================================ */
(function initScrollTop() {
  var btn = document.getElementById("scroll-top-btn");
  if (!btn) return;

  window.addEventListener("scroll", function () {
    /* IA2 JS d) Control structure: show after 300px scroll */
    btn.style.display = window.scrollY > 300 ? "block" : "none";
  });

  btn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();


/* ============================================================
   DOMContentLoaded — run page-specific logic after HTML loads
   ============================================================ */
document.addEventListener("DOMContentLoaded", function () {
  updateBadge();
  renderCart();
  renderCheckoutSummary();
});
