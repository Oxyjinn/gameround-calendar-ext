// Standalone function to extract data and open Google Calendar
async function handleCreateEvent(tab) {
  // Ensure we are on a valid tab and URL
  if (!tab || !tab.id || !tab.url || !tab.url.startsWith("https://gameround.co/")) {
    console.warn("Extension only operates on https://gameround.co/");
    return;
  }

  try {
    // 1. Inject and run content.js in the active tab
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });

    if (!result || !result.result) {
      console.warn("No data scraped from page.");
      return;
    }

    const data = result.result;

    // 2. Format parameters for Google Calendar
    const title = encodeURIComponent(data.title || "GameRound Playtest");
    const details = encodeURIComponent(data.description || "");
    const startDateVal = data.start;
    const endDateVal = data.end;

    let dateParam = "";
    if (startDateVal) {
      const startClean = startDateVal.replace(/-/g, "");

      // Google Calendar all-day event end dates are exclusive (+1 day)
      let endClean = startClean;
      if (endDateVal) {
        const endObj = new Date(endDateVal);
        if (!isNaN(endObj.getTime())) {
          endObj.setDate(endObj.getDate() + 1);
          endClean = new Date(endObj.getTime() - endObj.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 10)
            .replace(/-/g, "");
        }
      }

      dateParam = `&dates=${startClean}/${endClean}`;
    }

    // 3. Open Google Calendar in a new tab
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}${dateParam}`;
    await chrome.tabs.create({ url: calendarUrl });

  } catch (error) {
    console.error("Failed to scrape or create event:", error);
  }
}

// 1. Triggered by clicking the toolbar icon
chrome.action.onClicked.addListener((tab) => {
  handleCreateEvent(tab);
});

// 2. Triggered by the keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "create-calendar-event") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      handleCreateEvent(tab);
    }
  }
});