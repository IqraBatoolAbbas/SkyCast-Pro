window.tempChartInstance = null;

function getChartHours(forecastDays) {
  if (typeof WeatherAPI !== "undefined" && WeatherAPI.getNext24Hours) {
    return WeatherAPI.getNext24Hours(forecastDays);
  }
  const allHours = forecastDays.flatMap((d) => d.hour);
  const now = new Date();
  const upcoming = allHours.filter((h) => new Date(h.time.replace(" ", "T")) >= now);
  if (upcoming.length >= 24) return upcoming.slice(0, 24);
  const padded = [...upcoming];
  for (const h of allHours) {
    if (padded.length >= 24) break;
    if (!padded.some((x) => x.time === h.time)) padded.push(h);
  }
  return padded.slice(0, 24);
}

function shortHourLabel(timeStr) {
  const hr = parseInt(timeStr.split(" ")[1].split(":")[0], 10);
  return (hr % 12 || 12) + (hr >= 12 ? "p" : "a");
}

function renderTempChart(canvasId, forecastDays, unit) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === "undefined") return;

  const hours = getChartHours(forecastDays);
  if (!hours.length) return;

  const labels = hours.map((h) => shortHourLabel(h.time));
  const temps = hours.map((h) =>
    unit === "C" ? Math.round(h.temp_c) : Math.round((h.temp_c * 9) / 5 + 32)
  );

  const styles = getComputedStyle(document.documentElement);
  const lineColor = styles.getPropertyValue("--chart-line").trim() || "#0ea5e9";
  const fillColor = styles.getPropertyValue("--chart-fill").trim() || "rgba(14, 165, 233, 0.15)";
  const gridColor = styles.getPropertyValue("--chart-grid").trim() || "rgba(100, 116, 139, 0.2)";
  const textColor = styles.getPropertyValue("--text-muted").trim() || "#64748b";

  if (window.tempChartInstance) {
    window.tempChartInstance.destroy();
  }

  window.tempChartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: unit === "C" ? "°C" : "°F",
          data: temps,
          borderColor: lineColor,
          backgroundColor: fillColor,
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: lineColor,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.9)",
          padding: 10,
          callbacks: {
            label: (ctx) => `${ctx.parsed.y}°${unit}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, maxTicksLimit: 8, font: { size: 11 } },
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 11 } },
        },
      },
    },
  });
}

function refreshCharts(forecastDays, unit) {
  if (document.getElementById("tempChart")) {
    renderTempChart("tempChart", forecastDays, unit);
  }
  if (document.getElementById("forecastChart")) {
    renderTempChart("forecastChart", forecastDays, unit);
  }
}
