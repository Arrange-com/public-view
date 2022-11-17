console.log("%c Arrange view script connected ✨", "color: #9403fc");

const ARRANGE_API_URL = "https://api.arrange.com/";

async function getAllActivities(link) {
  try {
    const response = await fetch(
      `${ARRANGE_API_URL}controller/activity/getActivityByLink?link=${link}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.log("error: ", error);
  }
}

function createElementWithContent(tag, content, classes) {
  const item = document.createElement(tag);
  if (classes != null) item.classList.add(classes);
  const itemContent = document.createTextNode(content);
  item.appendChild(itemContent);
  return item;
}

function getFullDate(date, format) {
  return dayjs(date).format(format != null ? format : "YYYY, DD MMM, HH:mm");
}

function generateActivityDays(to, days) {
  days.forEach((element) => {
    const day = createElementWithContent(
      "p",
      `${getFullDate(element.start, "ddd.  DD.MM.YYYY")}`
    );
    to.append(day);
  });
}

function generateActivityInfoDiv(label, value) {
  const info = document.createElement("div");
  info.classList.add("activity-info");

  const infoLabel = createElementWithContent("p", label, "label");
  const valueLabel = createElementWithContent("p", value, "value");

  info.append(infoLabel);
  info.append(valueLabel);
  return info;
}

async function geterateActivitiesBlocks() {
  const ACTIVITY_CLASSES_SECTION = document.getElementById("activity-classes");
  const link = ACTIVITY_CLASSES_SECTION.dataset.link;

  const activities = await getAllActivities(link || "");
  const classes = [activities]
    .map((item) =>
      item.activity_classes.map((element) => ({
        ...element,
        activityTitle: item.title,
        price: (item.priceInCents / 100).toFixed(2) + " DDK",
        availableSpots: item.spots - element.booked,
        link: item.link,
      }))
    )
    .flat()
    .map((item) => ({
      ...item,
      location: item.timelines[0].location.address,
    }));

  classes.forEach((element) => {
    const block = document.createElement("div");
    block.classList.add("activity-class-item");

    //<> class title item
    const classTitleItem = createElementWithContent("h2", element.title);

    //<> location item
    const location = generateActivityInfoDiv("Location", element.location);

    //<> activity title item
    const activityTitle = generateActivityInfoDiv(
      "Activity name",
      element.activityTitle
    );

    //<> start date item
    const start = generateActivityInfoDiv(
      "Hold start",
      getFullDate(element.start)
    );

    //<> price item
    const price = generateActivityInfoDiv("Price", element.price);

    //<> spots item
    const spots = document.createElement("div");
    spots.classList.add(
      `${element.availableSpots > 0 ? "available" : "sold-out"}`,
      "spots"
    );
    const spotsContent = document.createTextNode(
      `${element.availableSpots > 0 ? "Available spots" : "Spots are sold out"}`
    );
    spots.appendChild(spotsContent);

    //<> register btn item
    const registerButton = document.createElement("a");
    registerButton.setAttribute("id", "register-button");
    registerButton.setAttribute("href", "#checkout-modal");
    registerButton.setAttribute("rel", "modal:open");
    const registerButtonContent = document.createTextNode("Register");
    registerButton.append(registerButtonContent);
    registerButton.addEventListener("click", () =>
      handleRegister(element.link, element.id)
    );

    //<> days item
    const daysContainer = document.createElement("div");
    daysContainer.classList.add(
      "activity-days",
      "activity-days-close",
      `activity-days-${element.id.split("-")[0]}`
    );
    generateActivityDays(daysContainer, element.timelines);

    //<> days btn item
    const daysButton = document.createElement("p");
    daysButton.classList.add(
      "days-button",
      "close",
      `days-button-${element.id.split("-")[0]}`
    );
    const daysButtonContent = document.createTextNode("See meeting days");
    daysButton.append(daysButtonContent);
    daysButton.addEventListener("click", () => {
      if (daysContainer.offsetHeight > 0)
        daysButton.classList.replace("open", "close");
      else daysButton.classList.replace("close", "open");
      daysContainer.style.cssText = `
        height: ${
          daysContainer.offsetHeight > 0
            ? "0px"
            : element.timelines.length * 29.7 +
              (element.timelines.length - 1) * 8
        }px;
      `;
    });

    //<> connecting
    block.append(classTitleItem);
    block.append(location);
    block.append(activityTitle);
    block.append(start);
    block.append(price);
    block.append(spots);
    block.append(registerButton);
    block.append(daysButton);
    block.append(daysContainer);

    //<> generating

    ACTIVITY_CLASSES_SECTION.append(block);
  });
}

//<> Open modal

let iframeProps = {
  activityLink: null,
  classId: null,
};

const modal = document.querySelector(".checkout-modal");
const overlay = document.querySelector(".overlay");
// const openModalBtn = document.querySelector(".btn-open");
// const closeModalBtn = document.querySelector(".btn-close");

const closeModal = function () {
  modal.classList.add("hidden");
  overlay.classList.add("hidden");
  modal.innerHTML = "";
};

overlay.addEventListener("click", closeModal);

function handleRegister(activityLink, classId) {
  const checkoutModal = document.getElementById("checkout-modal");
  checkoutModal.innerHTML = "";
  const iframe = document.createElement("iframe");
  iframe.setAttribute("id", "checkout-iframe");
  iframe.setAttribute(
    "src",
    `https://app.arrange.com/checkout-page/${activityLink}?classId=${classId}&iframe=true`
  );
  iframe.setAttribute("title", "checkout-iframe");
  iframe.setAttribute("width", "0px");
  iframe.setAttribute("height", "0px");
  checkoutModal.append(iframe);

  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");
}

function getMessage(e) {
  if (typeof e.data === "string") {
    const data = JSON.parse(e.data);
    const iframe = document.getElementById("checkout-iframe");
    iframe.setAttribute(
      "width",
      data.width != null ? `${data.width}px` : "0px"
    );

    iframe.style.cssText = `
  height: ${
    data.height != null
      ? `${data.height + (window.innerWidth <= 874 ? 25 : 0)}px`
      : `0px`
  };
`;

    if (data.status === "success") {
      iframe.classList.add("success");
      console.log("Success ✔️");
    }
  }
}

window.addEventListener("message", getMessage);

//<> Use

geterateActivitiesBlocks();

window.onunload = function () {
  document.body.removeEventListener("message", getMessage);
  return;
};
