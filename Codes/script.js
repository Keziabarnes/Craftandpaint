
/* -- CART: load and save -- */

// Reads the saved cart from localStorage, returns empty array if nothing saved
function loadCart() {
  var saved = localStorage.getItem("cpwuja_cart");
  if (saved) {
    return JSON.parse(saved);
  } else {
    return [];
  }
}

// Writes the current cart array to localStorage
function saveCart() {
  localStorage.setItem("cpwuja_cart", JSON.stringify(cart));
}

// cart holds all the items the user has added
var cart = loadCart();


/* -- BADGE: the count shown on the cart icon -- */

// Adds up all item quantities and updates the #cart-count badge in the nav
function updateBadge() {
  var total = 0;
  for (var i = 0; i < cart.length; i++) {
    total = total + cart[i].qty;
  }

  var badge = document.getElementById("cart-count");
  if (badge) {
    if (total > 0) {
      badge.textContent = total;
      badge.style.display = "inline-flex";
    } else {
      badge.textContent = "";
      badge.style.display = "none"; // hidden when cart is empty
    }
  }
}


/* -- TOAST: small popup message shown at the bottom of the screen -- */

// Creates the toast element if it doesn't exist, then shows the message for 3 seconds
function showToast(message) {
  var toast = document.getElementById("toast-notification");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-notification";
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");

  // Removes the "show" class after 3 seconds, hiding the toast
  setTimeout(function () {
    toast.classList.remove("show");
  }, 3000);
}


/* -- ADD TO CART: called by the "Add to Cart" buttons on product cards -- */

// Increases qty if item already exists in cart, otherwise adds it as a new entry
function addToCart(name, price, emoji) {
  var found = false;
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].name === name) {
      cart[i].qty = cart[i].qty + 1;
      found = true;
      break;
    }
  }

  if (!found) {
    cart.push({ name: name, price: price, qty: 1, emoji: emoji });
  }

  saveCart();
  updateBadge();
  showToast("🛒 " + name + " added to cart!");
}


/* -- MONEY: price formatting and order total calculations -- */

// Formats a number as a JMD string e.g. 1500 becomes "J$1,500.00"
function fmtJMD(amount) {
  var formatted = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return "J$" + formatted;
}

// Returns subtotal, discount (10% if over J$10,000), 15% GCT tax, and final total
function calcTotals() {
  var subtotal = 0;
  for (var i = 0; i < cart.length; i++) {
    subtotal = subtotal + (cart[i].price * cart[i].qty);
  }

  var discount = 0;
  if (subtotal >= 10000) {
    discount = subtotal * 0.10; // 10% discount applied above J$10,000
  }

  var afterDiscount = subtotal - discount;
  var tax = afterDiscount * 0.15; // 15% GCT
  var total = afterDiscount + tax;

  return { subtotal: subtotal, discount: discount, tax: tax, total: total };
}

// Writes the calculated totals into the summary elements matching the given prefix
function showTotals(prefix) {
  var t = calcTotals();

  var subtotalEl = document.getElementById(prefix + "subtotal");
  var discountEl = document.getElementById(prefix + "discount");
  var taxEl      = document.getElementById(prefix + "tax");
  var totalEl    = document.getElementById(prefix + "total");

  if (subtotalEl) subtotalEl.textContent = fmtJMD(t.subtotal);
  if (discountEl) discountEl.textContent = t.discount > 0 ? "-" + fmtJMD(t.discount) : "-J$0.00";
  if (taxEl)      taxEl.textContent = fmtJMD(t.tax);
  if (totalEl)    totalEl.textContent = fmtJMD(t.total);
}


/* -- CART PAGE: builds and displays the cart table -- */

// Renders cart rows into #cart-tbody, or shows the empty message if cart is empty
function renderCart() {
  var tbody     = document.getElementById("cart-tbody");
  var emptyDiv  = document.getElementById("cart-empty");
  var tableWrap = document.getElementById("cart-table-wrap");

  // These elements only exist on cart.html — exit if we're on a different page
  if (!tbody) return;

  if (cart.length === 0) {
    if (emptyDiv)  emptyDiv.style.display  = "block";
    if (tableWrap) tableWrap.style.display = "none";
    showTotals("summary-");
    return;
  }

  if (emptyDiv)  emptyDiv.style.display  = "none";
  if (tableWrap) tableWrap.style.display = "grid";

  // Builds one table row per cart item, with qty controls and a remove button
  var rows = "";
  for (var i = 0; i < cart.length; i++) {
    var item = cart[i];
    var lineTotal = item.price * item.qty;

    rows += "<tr>";
    rows += "<td><strong>" + item.emoji + " " + item.name + "</strong></td>";
    rows += "<td>" + fmtJMD(item.price) + "</td>";
    rows += "<td>";
    rows +=   "<div class='qty-control'>";
    rows +=     "<button class='qty-btn' onclick='changeQty(" + i + ", -1)'>-</button>";
    rows +=     "<span>" + item.qty + "</span>";
    rows +=     "<button class='qty-btn' onclick='changeQty(" + i + ", 1)'>+</button>";
    rows +=   "</div>";
    rows += "</td>";
    rows += "<td>" + fmtJMD(lineTotal) + "</td>";
    rows += "<td><button class='remove-btn' onclick='removeItem(" + i + ")'>🗑</button></td>";
    rows += "</tr>";
  }

  tbody.innerHTML = rows;
  showTotals("summary-");
}

// Called by the +/- buttons in the cart table — delta is +1 or -1
function changeQty(index, delta) {
  cart[index].qty = cart[index].qty + delta;

  // Removes the item entirely if qty reaches 0
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }

  saveCart();
  updateBadge();
  renderCart();
}

// Removes the item at the given index from the cart
function removeItem(index) {
  var name = cart[index].name;
  cart.splice(index, 1);
  saveCart();
  updateBadge();
  renderCart();
  showToast("❌ " + name + " removed.");
}

// Opens the clear-cart confirmation modal via openModal()
function clearCart() {
  openModal("clearCartModal");
}

// Empties the cart array after the user confirms in the modal
function confirmClearCart() {
  cart = [];
  saveCart();
  updateBadge();
  closeModal("clearCartModal");
  renderCart();
  showToast("🗑 Cart cleared.");
}


/* -- MODALS: open and close popup dialogs -- */

// Adds the "open" class to the modal matching the given id, making it visible
function openModal(id) {
  var modal = document.getElementById(id);
  if (modal) {
    modal.classList.add("open");
  }
}

// Removes the "open" class from the modal matching the given id, hiding it
function closeModal(id) {
  var modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove("open");
  }
}


/* -- FORM ERRORS: show and clear validation messages -- */

// Adds the error message text to the element with the given id and makes it visible
function showError(id, message) {
  var el = document.getElementById(id);
  if (el) {
    el.textContent = message;
    el.classList.add("visible");
  }
}

// Clears the error message for a single field
function clearError(id) {
  var el = document.getElementById(id);
  if (el) {
    el.textContent = "";
    el.classList.remove("visible");
  }
}

// Clears all .error-msg and .error-field elements inside the given form
function clearAllErrors(form) {
  var errors = form.querySelectorAll(".error-msg");
  for (var i = 0; i < errors.length; i++) {
    errors[i].textContent = "";
    errors[i].classList.remove("visible");
  }

  var errorFields = form.querySelectorAll(".error-field");
  for (var i = 0; i < errorFields.length; i++) {
    errorFields[i].classList.remove("error-field");
  }
}

// Adds "error-field" styling to the input and displays the error message below it
function markInvalid(inputId, errorId, message) {
  var input = document.getElementById(inputId);
  if (input) {
    input.classList.add("error-field");
  }
  showError(errorId, message);
}

// Returns true if the email matches the pattern name@domain.ext
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Returns true if the phone number matches a Jamaican format e.g. (876) 454-4554
function isValidPhone(phone) {
  var cleaned = phone.replace(/\s/g, "");
  return /^(\+?1?876)?[\s-]?\(?\d{3}\)?[\s-]?\d{4}$/.test(cleaned);
}


/* -- REGISTER FORM: validates and submits the sign-up form -- */

var registerForm = document.getElementById("register-form");

if (registerForm) {

  // Validates all fields on submit, saves the user to localStorage, then redirects to login.html
  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();
    clearAllErrors(registerForm);

    var allValid = true;

    // First name — cannot be empty
    var fname = document.getElementById("reg-fname").value.trim();
    if (!fname) {
      markInvalid("reg-fname", "reg-fname-err", "First name is required.");
      allValid = false;
    }

    // Last name — cannot be empty
    var lname = document.getElementById("reg-lname").value.trim();
    if (!lname) {
      markInvalid("reg-lname", "reg-lname-err", "Last name is required.");
      allValid = false;
    }

    // Date of birth — required, user must be at least 13
    var dobValue = document.getElementById("reg-dob").value;
    if (!dobValue) {
      markInvalid("reg-dob", "reg-dob-err", "Date of birth is required.");
      allValid = false;
    } else {
      var dob       = new Date(dobValue);
      var today     = new Date();
      var age       = today.getFullYear() - dob.getFullYear();
      var monthDiff = today.getMonth() - dob.getMonth();
      // Subtract 1 if the birthday hasn't occurred yet this year
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age = age - 1;
      }
      if (age < 13) {
        markInvalid("reg-dob", "reg-dob-err", "You must be at least 13 to register.");
        allValid = false;
      }
    }

    // Email — required and must pass isValidEmail()
    var email = document.getElementById("reg-email").value.trim();
    if (!email) {
      markInvalid("reg-email", "reg-email-err", "Email is required.");
      allValid = false;
    } else if (!isValidEmail(email)) {
      markInvalid("reg-email", "reg-email-err", "Enter a valid email (e.g. jane@email.com).");
      allValid = false;
    }

    // Username — required, minimum 3 characters
    var username = document.getElementById("reg-username").value.trim();
    if (!username) {
      markInvalid("reg-username", "reg-username-err", "Username is required.");
      allValid = false;
    } else if (username.length < 3) {
      markInvalid("reg-username", "reg-username-err", "Username must be at least 3 characters.");
      allValid = false;
    }

    // Password — required, minimum 8 characters
    var password = document.getElementById("reg-password").value;
    if (!password) {
      markInvalid("reg-password", "reg-password-err", "Password is required.");
      allValid = false;
    } else if (password.length < 8) {
      markInvalid("reg-password", "reg-password-err", "Password must be at least 8 characters.");
      allValid = false;
    }

    // Confirm password — required and must match password
    var confirm = document.getElementById("reg-confirm").value;
    if (!confirm) {
      markInvalid("reg-confirm", "reg-confirm-err", "Please confirm your password.");
      allValid = false;
    } else if (confirm !== password) {
      markInvalid("reg-confirm", "reg-confirm-err", "Passwords do not match.");
      allValid = false;
    }

    // Terms checkbox — must be checked before submitting
    var termsBox = registerForm.querySelector("input[type='checkbox']");
    if (termsBox && !termsBox.checked) {
      showToast("⚠ Please accept the Terms of Service.");
      allValid = false;
    }

    // Stop here if any field failed validation
    if (!allValid) return;

    // Save the new user to localStorage then redirect to login.html
    var users = JSON.parse(localStorage.getItem("cpwuja_users") || "[]");
    users.push({ fname: fname, lname: lname, email: email, username: username });
    localStorage.setItem("cpwuja_users", JSON.stringify(users));

    registerForm.reset();
    updateStrengthBar("");
    showToast("✅ Account created! Redirecting…");
    setTimeout(function () {
      window.location.href = "login.html";
    }, 2000);
  });

  // Updates the strength bar in real time as the user types into #reg-password
  var pwInput = document.getElementById("reg-password");
  if (pwInput) {
    pwInput.addEventListener("input", function () {
      updateStrengthBar(this.value);
    });
  }

}


/* -- PASSWORD STRENGTH BAR: visual feedback while typing a password -- */

// Scores the password out of 4 and sets the bar width and colour accordingly
function updateStrengthBar(password) {
  var bar = document.getElementById("strength-bar");
  if (!bar) return;

  // One point each for: length >= 8, uppercase letter, number, special character
  var score = 0;
  if (password.length >= 8)           score = score + 1;
  if (/[A-Z]/.test(password))         score = score + 1;
  if (/[0-9]/.test(password))         score = score + 1;
  if (/[^A-Za-z0-9]/.test(password))  score = score + 1;

  if (score === 0) {
    bar.style.width      = "0%";
    bar.style.background = "transparent";
  } else if (score === 1) {
    bar.style.width      = "25%";
    bar.style.background = "#C62828"; // weak
  } else if (score === 2) {
    bar.style.width      = "50%";
    bar.style.background = "#F4A300"; // fair
  } else if (score === 3) {
    bar.style.width      = "75%";
    bar.style.background = "#2E7D32"; // good
  } else {
    bar.style.width      = "100%";
    bar.style.background = "#1B5E20"; // strong
  }
}


/* -- LOGIN FORM: validates and submits the sign-in form -- */

var loginForm = document.getElementById("login-form");

if (loginForm) {

  // Checks both fields are filled, looks up the user in localStorage, then redirects to index.html
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    clearAllErrors(loginForm);

    var username = document.getElementById("login-username").value.trim();
    var password = document.getElementById("login-password").value;
    var allValid = true;

    // Username/email — cannot be empty
    if (!username) {
      markInvalid("login-username", "login-username-err", "Please enter your username or email.");
      allValid = false;
    }

    // Password — cannot be empty
    if (!password) {
      markInvalid("login-password", "login-password-err", "Please enter your password.");
      allValid = false;
    }

    if (!allValid) return;

    // Searches cpwuja_users in localStorage for a matching username or email
    var users = JSON.parse(localStorage.getItem("cpwuja_users") || "[]");
    var matchedUser = null;

    for (var i = 0; i < users.length; i++) {
      if (users[i].username === username || users[i].email === username) {
        matchedUser = users[i];
        break;
      }
    }

    // Allows "demo" login when no users have been registered yet
    if (!matchedUser && users.length === 0 && username === "demo") {
      matchedUser = { fname: "Demo" };
    }

    // No matching account found — show error on the username field
    if (!matchedUser) {
      markInvalid("login-username", "login-username-err", "No account found with that username or email.");
      return;
    }

    // Login successful — shows welcome message in #login-success then redirects
    var successEl = document.getElementById("login-success");
    if (successEl) {
      successEl.textContent = "👋 Welcome back, " + (matchedUser.fname || username) + "! Redirecting…";
      successEl.classList.add("visible");
    }

    showToast("✅ Logged in successfully!");
    setTimeout(function () {
      window.location.href = "index.html";
    }, 2000);
  });

}


/* -- CHECKOUT FORM: validates delivery details and places the order -- */

var checkoutForm = document.getElementById("checkout-form");

if (checkoutForm) {

  // Renders the order summary into #checkout-items when the checkout page loads
  renderCheckoutSummary();

  // Validates all fields on submit, then opens #confirmModal if everything passes
  checkoutForm.addEventListener("submit", function (e) {
    e.preventDefault();
    clearAllErrors(checkoutForm);
    var allValid = true;

    // Full name — required for delivery
    var name = document.getElementById("co-name").value.trim();
    if (!name) {
      markInvalid("co-name", "co-name-err", "Full name is required.");
      allValid = false;
    }

    // Phone number — required, must pass isValidPhone()
    var phone = document.getElementById("co-phone").value.trim();
    if (!phone) {
      markInvalid("co-phone", "co-phone-err", "Phone number is required.");
      allValid = false;
    } else if (!isValidPhone(phone)) {
      markInvalid("co-phone", "co-phone-err", "Enter a valid number e.g. (876) 454-4554.");
      allValid = false;
    }

    // Street address — required for delivery
    var address = document.getElementById("co-address").value.trim();
    if (!address) {
      markInvalid("co-address", "co-address-err", "Street address is required.");
      allValid = false;
    }

    // City — required for delivery
    var city = document.getElementById("co-city").value.trim();
    if (!city) {
      markInvalid("co-city", "co-city-err", "City / Town is required.");
      allValid = false;
    }

    // Payment amount — must be greater than 0 and must cover the order total
    var amountPaid = parseFloat(document.getElementById("co-amount").value) || 0;
    var totals     = calcTotals();

    if (amountPaid <= 0) {
      markInvalid("co-amount", "co-amount-err", "Please enter the payment amount.");
      allValid = false;
    } else if (amountPaid < totals.total) {
      // Shows how much more the user still needs to pay
      var shortfall = (totals.total - amountPaid).toFixed(2);
      markInvalid("co-amount", "co-amount-err", "Amount is J$" + shortfall + " short of the total (" + fmtJMD(totals.total) + ").");
      allValid = false;
    }

    if (allValid) {
      openModal("confirmModal");
    }
  });

}

// Builds the item list inside #checkout-items and calls showTotals() with prefix "co-"
function renderCheckoutSummary() {
  var container = document.getElementById("checkout-items");
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = "<p style='color:var(--clr-muted);font-size:.875rem;'>No items in cart.</p>";
  } else {
    var html = "";
    for (var i = 0; i < cart.length; i++) {
      var item = cart[i];
      var lineTotal = item.price * item.qty;
      html += "<div class='checkout-order-item'>";
      html +=   "<span>" + item.emoji + " " + item.name + " x " + item.qty + "</span>";
      html +=   "<span>" + fmtJMD(lineTotal) + "</span>";
      html += "</div>";
    }
    container.innerHTML = html;
  }

  showTotals("co-");
}

// Clears the cart, hides .checkout-layout, and shows #checkout-success
function confirmCheckout() {
  closeModal("confirmModal");
  cart = [];
  saveCart();
  updateBadge();

  var successEl = document.getElementById("checkout-success");
  var layout    = document.querySelector(".checkout-layout");

  if (successEl) successEl.classList.add("visible");
  if (layout)    layout.style.display = "none";

  window.scrollTo({ top: 0, behavior: "smooth" });
  showToast("🎉 Order placed! Thank you!");
}

// Redirects the user back to cart.html without placing the order
function cancelCheckout() {
  window.location.href = "cart.html";
}


/* -- HAMBURGER MENU: toggles the mobile nav open and closed -- */

var hamburgerBtn = document.querySelector(".hamburger");
var navList      = document.querySelector(".site-nav ul");

if (hamburgerBtn && navList) {
  // Toggles the "open" class on .site-nav ul and updates aria-expanded on each click
  hamburgerBtn.addEventListener("click", function () {
    navList.classList.toggle("open");
    var isOpen = navList.classList.contains("open");
    hamburgerBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
}


/* -- ACTIVE NAV LINK: marks the current page's link as active -- */

// Compares each nav link's href to the current page filename and adds "active" if it matches
var currentPage = window.location.pathname.split("/").pop() || "index.html";
var navLinks    = document.querySelectorAll(".site-nav a");

for (var i = 0; i < navLinks.length; i++) {
  if (navLinks[i].getAttribute("href") === currentPage) {
    navLinks[i].classList.add("active");
  }
}


/* -- SCROLL TO TOP BUTTON: shows after 300px scroll, smooth scrolls on click -- */

var scrollBtn = document.getElementById("scroll-top-btn");

if (scrollBtn) {
  // Shows or hides #scroll-top-btn depending on scroll position
  window.addEventListener("scroll", function () {
    if (window.scrollY > 300) {
      scrollBtn.style.display = "block";
    } else {
      scrollBtn.style.display = "none";
    }
  });

  // Scrolls the page back to the top when #scroll-top-btn is clicked
  scrollBtn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}


/* -- PAGE LOAD: runs once the full HTML has loaded -- */

// Calls updateBadge(), renderCart(), and renderCheckoutSummary() on every page
document.addEventListener("DOMContentLoaded", function () {
  updateBadge();
  renderCart();
  renderCheckoutSummary();
});
