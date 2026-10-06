(function () {
  var header = document.querySelector("[data-atc-header]");
  if (!header) return;

  var toggle = header.querySelector("[data-atc-menu-toggle]");
  var drawer = header.querySelector("[data-atc-drawer]");
  if (!toggle || !drawer) return;

  var openLabel = toggle.getAttribute("data-open-label") || "Open menu";
  var closeLabel = toggle.getAttribute("data-close-label") || "Close menu";

  function focusable() {
    return Array.prototype.slice.call(
      drawer.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    );
  }

  function setClosedState() {
    drawer.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", openLabel);
    header.classList.remove("is-open");
  }

  function openMenu() {
    drawer.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", closeLabel);
    header.classList.add("is-open");

    var items = focusable();
    if (items.length) items[0].focus();
  }

  function closeMenu(restoreFocus) {
    setClosedState();
    if (restoreFocus) toggle.focus();
  }

  toggle.addEventListener("click", function () {
    if (drawer.hidden) openMenu();
    else closeMenu(false);
  });

  document.addEventListener("keydown", function (event) {
    if (drawer.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
      return;
    }

    if (event.key !== "Tab") return;

    var items = focusable();
    if (!items.length) return;

    var first = items[0];
    var last = items[items.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  drawer.addEventListener("click", function (event) {
    if (event.target.closest("a")) closeMenu(false);
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth >= 990 && !drawer.hidden) setClosedState();
  });
})();

(function () {
  function variantOptions(variant) {
    if (Array.isArray(variant.options)) return variant.options;
    return [variant.option1, variant.option2, variant.option3].filter(function (option) {
      return option;
    });
  }

  document.querySelectorAll("[data-atc-product]").forEach(function (root) {
    var form = root.querySelector(".atc-product__form");
    var data = root.querySelector("[data-atc-variants]");
    var idInput = form && form.querySelector('[name="id"]');
    if (!form || !data || !idInput) return;

    var variants = [];
    try {
      variants = JSON.parse(data.textContent);
    } catch (error) {
      return;
    }

    function selectedOptions() {
      var options = [];
      root.querySelectorAll("[data-atc-option]").forEach(function (group) {
        var checked = group.querySelector("input:checked");
        options.push(checked ? checked.value : "");
      });
      return options;
    }

    function applyVariant() {
      var options = selectedOptions();
      if (!options.length) return;

      var match = variants.find(function (variant) {
        var variantOptionsList = variantOptions(variant);
        return options.every(function (option, index) {
          return variantOptionsList[index] === option;
        });
      });

      var button = form.querySelector("[data-atc-add]");
      if (!match) {
        if (button) button.disabled = true;
        return;
      }

      idInput.value = String(match.id);
      root.querySelectorAll("[data-atc-variant-price]").forEach(function (node) {
        node.hidden = node.getAttribute("data-atc-variant-price") !== String(match.id);
      });

      if (button) {
        button.disabled = !match.available;
        button.textContent = match.available
          ? button.getAttribute("data-label-add")
          : button.getAttribute("data-label-sold-out");
      }

      var url = new URL(window.location.href);
      url.searchParams.set("variant", match.id);
      window.history.replaceState({}, "", url);
    }

    root.querySelectorAll("[data-atc-option] input").forEach(function (input) {
      input.addEventListener("change", applyVariant);
    });
  });

  var lastSizeOpener = null;

  document.querySelectorAll("[data-atc-size-open]").forEach(function (button) {
    var dialog = document.getElementById(button.getAttribute("aria-controls"));
    if (!dialog) {
      button.hidden = true;
      return;
    }

    button.addEventListener("click", function () {
      if (!dialog.showModal) return;
      lastSizeOpener = button;
      dialog.showModal();
    });

    dialog.addEventListener("close", function () {
      if (lastSizeOpener) lastSizeOpener.focus();
    });

    dialog.addEventListener("click", function (event) {
      var bounds = dialog.getBoundingClientRect();
      var inside =
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom;
      if (!inside) dialog.close();
    });
  });

  document.addEventListener("click", function (event) {
    var confirm = event.target.closest("[data-atc-size-confirm]");
    if (!confirm) return;

    var size = confirm.getAttribute("data-size");
    var product = document.querySelector("[data-atc-product]");
    if (product && size) {
      product.querySelectorAll("[data-atc-option] input").forEach(function (input) {
        if (input.value === size) {
          input.checked = true;
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
    }

    var dialog = confirm.closest("dialog");
    if (dialog) dialog.close();
  });

  document.querySelectorAll("[data-atc-region]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      var region = tab.getAttribute("data-atc-region");
      var guide = tab.closest(".atc-size-guide");
      if (!guide || !region) return;

      guide.querySelectorAll("[data-atc-region]").forEach(function (other) {
        other.setAttribute("aria-selected", other === tab ? "true" : "false");
      });

      guide.querySelectorAll("[data-atc-region-value], [data-atc-region-label]").forEach(function (cell) {
        var key = cell.getAttribute("data-atc-region-value") || cell.getAttribute("data-atc-region-label");
        cell.hidden = key !== region;
      });
    });
  });

  document.querySelectorAll(".atc-size-guide__tabs").forEach(function (list) {
    list.addEventListener("keydown", function (event) {
      var tabs = Array.prototype.slice.call(list.querySelectorAll("[data-atc-region]"));
      var index = tabs.indexOf(document.activeElement);
      if (index < 0) return;

      var next = index;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;

      event.preventDefault();
      tabs[next].focus();
      tabs[next].click();
    });
  });

  document.querySelectorAll("atc-recommendations").forEach(function (node) {
    if (node.getAttribute("data-performed") === "true") return;
    var url = node.getAttribute("data-url");
    if (!url) return;

    fetch(url)
      .then(function (response) {
        if (!response.ok) return "";
        return response.text();
      })
      .then(function (html) {
        if (!html) return;
        var parsed = new DOMParser().parseFromString(html, "text/html");
        var next = parsed.querySelector("atc-recommendations");
        if (next) node.innerHTML = next.innerHTML;
      })
      .catch(function () {});
  });
})();
