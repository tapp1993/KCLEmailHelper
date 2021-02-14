const { BrowserWindow } = require("electron").remote;
const { clipboard } = require("electron");
const { ipcRenderer } = require("electron");
const notification = document.getElementById("notification");
const message = document.getElementById("notificationMessage");
const restartButton = document.getElementById("restartButton");
const dismissButton = document.getElementById("dismissButton");
const copySubjectsButton = document.getElementById("copySubjectsButton");
const copyNamesButton = document.getElementById("copyNamesButton");
const copyHtmlButton = document.getElementById("copyHtmlButton");
const copyPlainTextButton = document.getElementById("copyPlainTextButton");
const previewButton = document.getElementById("previewButton");

var fileList
var fileArray = [];
var currentIndex;

var fileHtml = "";
var plainText = "";
var formattedPlainText = "";

//#region Handle Updates
ipcRenderer.on("update_available", () => {
  ipcRenderer.removeAllListeners("update_available");
  message.innerText = "There's an update available. Downloading now...";
  restartButton.classList.add("hidden");
  notification.classList.remove("hidden");
  dismissButton.classList.remove("hidden");
});

ipcRenderer.on("update_downloaded", () => {
  ipcRenderer.removeAllListeners("update_downloaded");
  message.innerText = "Update downloaded. Restart the app to install.";
  dismissButton.classList.add("hidden");
  notification.classList.remove("hidden");
  restartButton.classList.remove("hidden");
});
//#endregion

//#region Event Listeners
document.getElementById("file-list").addEventListener("click", function (e) {
  e.preventDefault();
  e.stopPropagation();
  if (e.target) {
    let li = e.target.closest("li");
    let list = li.parentNode;
    currentIndex = getClickedIndex(list, li);
    var f = fileArray[currentIndex];
    loadPlainText(f);
    loadHtml(f);
    copyHtmlButton.removeAttribute("disabled");
    copyPlainTextButton.removeAttribute("disabled");
    previewButton.removeAttribute("disabled");

    toggleSelection(li, list);
    console.log(f.name + " was clicked. Index: " + currentIndex);
  }
});

document.getElementById("file-list").addEventListener("auxclick", function (e) {
  e.preventDefault();
  e.stopPropagation();
  if (e.target) {
    let li = e.target.closest("li");
    let list = li.parentNode;
    let i = getClickedIndex(list, li);
    var f = fileArray[i];
    fileArray.splice(i, 1);
    list.removeChild(li);
    if (i == currentIndex) {
      currentIndex = null;
      clearText();
      copyHtmlButton.setAttribute("disabled", true);
      copyPlainTextButton.setAttribute("disabled", true);
      previewButton.setAttribute("disabled", true);
    }
    console.log(f.name + " was deleted.");
    if (fileArray.length < 1) {
      copyNames.setAttribute("disabled", true);
      copySubjects.setAttribute("disabled", true);
    }
  }
});

document.addEventListener("drop", (event) => {
  event.preventDefault();
  event.stopPropagation();
  fileList = event.dataTransfer.files;
  var ul = document.getElementById("file-list");
  if (fileList.length > 0) {
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      //Check file is HTML
      if (f.name.includes(".html")) {
        //Check file doesn't already exist in the list
        if (!fileArray.find(({ name }) => name === f.name)) {
          fileArray.push(f);
          ul.appendChild(createListItem(f));
          //Add file to the list
        }
      } else {
        alert(`${f.name} is not an HTML file`);
      }
    }
    copyNamesButton.removeAttribute("disabled");
    copySubjectsButton.removeAttribute("disabled");
  }
});

document.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.stopPropagation()
});

document.addEventListener("dragenter", (event) => {
  console.log("File is in the Drop Space");
});

document.addEventListener("dragleave", (event) => {
  console.log("File has left the Drop Space");
});
//#endregion

//#region Event Handlers

async function copySubjects() {
  if (fileArray.length > 0) {
    var subjects = "";
    for (let i = 0; i < fileArray.length; i++) {
      const f = fileArray[i];
      var t = await readText(f);
      var s = getSubject(t);
      if (i < fileArray.length - 1) {
        subjects = subjects.concat(s + "\r\n");
      } else {
        subjects = subjects.concat(s);
      }
    }
    copyText(subjects);
    console.log(subjects);
  }
  readText(fileArray[0]).then((t) => {
    getSubject(t);
  });
}

function copyNames() {
  if (fileArray.length > 0) {
    var names = "";
    for (let i = 0; i < fileArray.length; i++) {
      const f = fileArray[i];
      if (i < fileArray.length - 1) {
        names = names.concat(f.name.replace(".html", "") + "\r\n");
      } else {
        names = names.concat(f.name.replace(".html", ""));
      }
    }
    copyText(names);
    console.log(names);
  }
  readText(fileArray[0]).then((t) => {
    getSubject(t);
  });
}

function previewHtml() {
  let win = new BrowserWindow({ width: 650, height: 1000, show: false, autoHideMenuBar: true, resizable: false, title: `${fileArray[currentIndex].name}` });
  win.loadURL(`file://${fileArray[currentIndex].path}`);
  win.once("ready-to-show", () => {
    win.show();
  });
}

function copyPlainText() {
  copyText(plainText);
  showPopup("Copied plain text");
}

function copyHtml() {
  copyText(fileHtml);
  showPopup("Copied HTML");
}

let copyHtmlShortcut = (f) => {
  readText(f).then((t) => {
    copyText(t);
    showPopup("Copied HTML");
  });
};
//#endregion

let loadPlainText = (f) => {
  readText(f).then((t) => {
    plainText = createPlainText(t);
    formattedPlainText = plainText.replace(/\n/g, "<br />");
    document.getElementById("plain-text").innerHTML = formattedPlainText;
  });
};

let loadHtml = (f) => {
  readText(f).then((t) => {
    fileHtml = t;
  });
};

//#region Helpers
let clearText = () => {
  fileHtml = "";
  plainText = "";
  document.getElementById("plain-text").innerHTML = plainText;
};

let showPopup = (t) => {
  message.innerText = t;
  restartButton.classList.add("hidden");
  notification.classList.remove("hidden");
  dismissButton.classList.remove("hidden");
};

let toggleSelection = (li, list) => {
  let selected = list.querySelectorAll(".selected");
  for (let elem of selected) {
    elem.classList.remove("selected");
  }
  li.classList.add("selected");
};

let createListItem = (file) => {
  var li = document.createElement("LI");
  let div = document.createElement("div");
  div.classList.add("liParent");
  let p = document.createElement("p");
  p.classList.add("liWrapper", "noSelect");
  p.innerHTML = file.name.replace(".html", "");
  let btn = document.createElement("button");
  btn.classList.add("button-primary", "liButton");
  btn.innerHTML = "📄";
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    let li = e.target.closest("li");
    let list = li.parentNode;
    let i = getClickedIndex(list, li);
    var f = fileArray[i];
    copyHtmlShortcut(f);
  });
  div.appendChild(p);
  div.appendChild(btn);
  li.appendChild(div);
  return li;
};

function copyText(t) {
  clipboard.writeText(t);
}

function getSubject(str) {
  var start = str.indexOf("<title>") + "<title>".length;
  var end = str.lastIndexOf("</title>");
  var subject = str.slice(start, end);
  return subject;
}

function getClickedIndex(list, node) {
  var children = list.childNodes;
  for (var i = 0; i < children.length; i++) {
    const e = children[i];
    if (node == e)
      break;
  }
  return i;
}

async function readText(file) {
  var t = await file.text();
  return t;
}

const convertLinks = /<\s*a.*?href\s*=\s*(?:"|')(.*?)(?:"|')[^>]*>(.*?)<\s*?\/\s*?a\s*?>/g;
const removeTags = /(<script(\s|\S)*?<\/script>)|(<style(\s|\S)*?<\/style>)|(<!--(\s|\S)*?-->)|(<\/?(\s|\S)*?>)/g;
const removeWhiteSpace = /^\s+|\t+$/gm;

function createPlainText(str) {
  var pt = str.replace(convertLinks, "$2 [$1]");
  pt = pt.replace(removeTags, "");
  pt = pt.replace(removeWhiteSpace, "");
  pt = pt.replace(/\r/g, "\r\n");
  pt.trim();
  return pt;
}

//#endregion
