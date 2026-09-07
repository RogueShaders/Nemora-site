/* Nemora Digital — ASCII water ripple + contact form (vanilla JS) */
(function () {
  var CELL = 14;
  var DAMPING = 0.985;
  var CHARS = " .:-~=+*#%@";
  var STEP_MS = 1000 / 30;
  var THRESHOLD = 0.06;

  var canvas = document.getElementById("ripple");
  if (canvas) {
    var ctx = canvas.getContext("2d");
    var cols = 0, rows = 0;
    var curr = new Float32Array(0);
    var prev = new Float32Array(0);
    var raf = 0, lastStep = 0, lastDrop = 0;

    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      cols = Math.max(2, Math.floor(w / CELL));
      rows = Math.max(2, Math.floor(h / CELL));
      curr = new Float32Array(cols * rows);
      prev = new Float32Array(cols * rows);
      ctx.font = CELL * dpr + 'px "JetBrains Mono", ui-monospace, monospace';
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
    }

    function drop(gx, gy, strength) {
      if (gx < 1 || gy < 1 || gx >= cols - 1 || gy >= rows - 1) return;
      prev[gy * cols + gx] = strength;
    }

    function step() {
      for (var y = 1; y < rows - 1; y++) {
        var row = y * cols;
        for (var x = 1; x < cols - 1; x++) {
          var i = row + x;
          curr[i] =
            ((prev[i - 1] + prev[i + 1] + prev[i - cols] + prev[i + cols]) / 2 - curr[i]) * DAMPING;
        }
      }
      var t = prev; prev = curr; curr = t;
    }

    function render() {
      var w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      var cw = w / cols, ch = h / rows;
      for (var y = 1; y < rows - 1; y++) {
        var row = y * cols;
        for (var x = 1; x < cols - 1; x++) {
          var a = Math.abs(prev[row + x]);
          if (a < THRESHOLD) continue;
          var t = Math.min(1, a);
          var ci = Math.min(CHARS.length - 1, Math.floor(t * CHARS.length));
          ctx.fillStyle = "rgba(22, 163, 74, " + (0.15 + t * 0.85) + ")";
          ctx.fillText(CHARS[ci] || " ", x * cw + cw / 2, y * ch + ch / 2);
        }
      }
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (now - lastStep < STEP_MS) return;
      lastStep = now;
      if (now - lastDrop > 2600) {
        lastDrop = now;
        drop(2 + Math.floor(Math.random() * (cols - 4)), 2 + Math.floor(Math.random() * (rows - 4)), 0.9);
      }
      step();
      render();
    }

    window.addEventListener("pointermove", function (e) {
      var rect = canvas.getBoundingClientRect();
      drop(Math.floor((e.clientX - rect.left) / CELL), Math.floor((e.clientY - rect.top) / CELL), 1.4);
    }, { passive: true });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        lastStep = performance.now();
        raf = requestAnimationFrame(frame);
      }
    });

    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener("resize", resize);
    raf = requestAnimationFrame(frame);
  }

  // Contact form -> submits to Formspree (see index.html form action).
  // If that request fails for any reason, falls back to opening the
  // visitor's email app so a submission is never silently lost.
  var EMAIL = "hello@nemoradigital.com";
  var form = document.getElementById("enquiry");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var submitBtn = document.getElementById("submitBtn");
      var showThanks = function () {
        form.hidden = true;
        var thanks = document.getElementById("thanks");
        if (thanks) thanks.hidden = false;
      };
      var fallbackToEmail = function () {
        var body =
          "Name: " + (d.get("name") || "") + "\n" +
          "Email: " + (d.get("email") || "") + "\n" +
          "Company: " + (d.get("company") || "") + "\n" +
          "Website: " + (d.get("website") || "") + "\n\n" +
          (d.get("message") || "");
        window.location.href =
          "mailto:" + EMAIL +
          "?subject=" + encodeURIComponent("Free homepage concept") +
          "&body=" + encodeURIComponent(body);
        showThanks();
      };

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending..."; }

      fetch(form.action, {
        method: "POST",
        body: d,
        headers: { Accept: "application/json" }
      })
        .then(function (res) {
          if (res.ok) {
            showThanks();
          } else {
            fallbackToEmail();
          }
        })
        .catch(fallbackToEmail)
        .finally(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Get my free concept"; }
        });
    });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
