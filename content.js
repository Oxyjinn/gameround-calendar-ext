(() => {
  // 1. Scrape TestID, Title, and Studio Name
  const currentUrl = window.location.href;
  const urlsegments = currentUrl.split("/").filter(Boolean);
  let testid = urlsegments[urlsegments.length - 2] || "Unknown";

  const titleEl = document.querySelector("[class*='MuiTypography-h3']") || document.querySelector("h1");
  let title = titleEl ? titleEl.innerText.trim() : document.title.replace(/ - GameRound.*\$/, "").trim();

  const studioEl = document.querySelector("[class*='MuiTypography-subtitle3']") || document.querySelector("[class*='subtitle']");
  let studio = studioEl ? studioEl.innerText.trim() : "";

  const descEl = document.querySelector("[class*='MuiTypography-body1']") || document.querySelector("p");
  let description = descEl ? descEl.innerText.trim() : "";

  // 2. Scrape Playtest / Round Schedule Date
  // Search for the element containing month names and numbers
  const allElements = Array.from(document.querySelectorAll("p, span, div, h4, h5, h6"));
  const dateEl = allElements.find(el => {
    const txt = el.innerText ? el.innerText.trim() : "";
    return el.children.length === 0 &&
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i.test(txt) &&
      /\d{1,2}/.test(txt);
  });

  const rawDateText = dateEl ? dateEl.innerText.trim() : "";

  // Helper: converts a Date object to "YYYY-MM-DD" for HTML <input type="date">
  const toISODate = (d) => {
    if (!d || isNaN(d.getTime())) return "";
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
  };

  let startdate = "";
  let enddate = "";

  if (rawDateText) {
    // Strip prefixes like "Period:"
    const cleanRange = rawDateText.replace(/^(Period|Playtesting|Round|Schedule)\s*:\s*/i, "").trim();
    const yearMatch = cleanRange.match(/\b(20\d\d)\b/);
    const year = yearMatch ? yearMatch[1] : new Date().getFullYear();

    // Split on en-dash, hyphen, em-dash, or 'to'
    const parts = cleanRange.split(/[\u2013\u2014\-]|to/i).map(s => s.trim());

    if (parts.length > 0) {
      let startStr = parts[0].includes(year) ? parts[0] : `${parts[0]}, ${year}`;
      const rawStart = new Date(startStr);
      if (!isNaN(rawStart.getTime())) {
        startdate = toISODate(rawStart);
      }
    }

    if (parts.length > 1) {
      let endStr = parts[1];
      // If the second part has no month letters, inherit month from start
      const monthMatch = cleanRange.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b/i);
      const month = monthMatch ? monthMatch[0] : "";

      if (!/[a-zA-Z]/.test(endStr)) {
        endStr = `${month} ${endStr}`;
      }
      if (!endStr.includes(year)) {
        endStr = `${endStr}, ${year}`;
      }

      const rawEnd = new Date(endStr);
      if (!isNaN(rawEnd.getTime())) {
        enddate = toISODate(rawEnd);
      }
    }
  }

  // 3. Return the scraped data
  return {
    title: `Game Round:${testid} - ${title}`,
    description: `Studio: ${studio}\n\nStart: ${startdate}\nEnd: ${enddate}\n\nDescription:\n${description}\n\nGame Page: ${currentUrl}`,
    start: startdate, 
    end: enddate,
    rawDate: rawDateText
  };
})();