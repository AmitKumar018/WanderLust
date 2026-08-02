(function () {
  "use strict";

  var forms = document.querySelectorAll(".needs-validation");

  Array.prototype.slice.call(forms).forEach(function (form) {
    form.addEventListener(
      "submit",
      function (event) {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }

        form.classList.add("was-validated");
      },
      false
    );
  });

  var checkIn = document.getElementById("checkIn");
  var checkOut = document.getElementById("checkOut");

  function formatDate(date) {
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");

    return date.getFullYear() + "-" + month + "-" + day;
  }

  function addDays(dateValue, days) {
    var parts = dateValue.split("-").map(Number);
    var date = new Date(parts[0], parts[1] - 1, parts[2]);

    date.setDate(date.getDate() + days);
    return formatDate(date);
  }

  var today = formatDate(new Date());

  if (checkIn) {
    checkIn.min = today;
    checkIn.addEventListener("change", function () {
      if (checkOut) {
        checkOut.min = checkIn.value ? addDays(checkIn.value, 1) : addDays(today, 1);

        if (checkOut.value && checkOut.value <= checkIn.value) {
          checkOut.value = "";
        }
      }
    });
  }

  if (checkOut) {
    checkOut.min = addDays(today, 1);
  }

  var navSearch = document.querySelector(".nav-search");

  if (navSearch) {
    navSearch.addEventListener("submit", function (event) {
      var searchInput = navSearch.querySelector('input[name="q"]');

      if (!searchInput) {
        return;
      }

      searchInput.value = searchInput.value.trim();

      if (!searchInput.value) {
        event.preventDefault();
        window.location.assign("/listings");
      }
    });
  }

  document.querySelectorAll("[data-confirm]").forEach(function (element) {
    element.addEventListener("click", function (event) {
      if (!window.confirm(element.dataset.confirm)) {
        event.preventDefault();
      }
    });
  });
})();
