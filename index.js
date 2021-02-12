const { clipboard } = require('electron');
var fileList;
var fileArray = [];
var plainText = '';

//#region Event Listeners
document.getElementById("file-list").addEventListener("click", function(e){
    if (e.target) {
        let li = e.target.closest('li')
        let list = li.parentNode
        let i = getClickedIndex(list, li)
        var f = fileArray[i]
        loadPlainText(f)       
        console.log(f.name + " was clicked. Index: " + i)
    }
});

document.getElementById("file-list").addEventListener("auxclick", function(e){
    if (e.target) {
        let li = e.target.closest('li')
        let list = li.parentNode
        let i = getClickedIndex(list, li)
        var f = fileArray[i]
        fileArray.splice(i,1)
        list.removeChild(li)
        console.log(f.name + " was deleted.")
    }
});

document.addEventListener('drop', (event) => { 
    event.preventDefault(); 
    event.stopPropagation(); 
    fileList = event.dataTransfer.files;
    var ul = document.getElementById("file-list")
    
    for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        if (f.name.includes(".html")) {
            fileArray.push(f)
            ul.appendChild(createListItem(f, i))
        }
        else { alert(`${f.name} is not an HTML file`) }   
    }
}); 
  
document.addEventListener('dragover', (e) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
  }); 
  
document.addEventListener('dragenter', (event) => { 
    console.log('File is in the Drop Space'); 
}); 
  
document.addEventListener('dragleave', (event) => { 
    console.log('File has left the Drop Space'); 
});
//#endregion

//#region Event Handlers
copySubjects = async () => {
    if (fileArray.length > 0) {
        var subjects = ''
        for (let i = 0; i < fileArray.length; i++) {
            const f = fileArray[i];
            var t = await readText(f)
            var s = getSubject(t)
            if (i < fileArray.length - 1) { subjects = subjects.concat(s + '\r\n') }
            else { subjects = subjects.concat(s) } 
        }
        copyText(subjects)
        console.log(subjects);
    }
    readText(fileArray[0]).then(t => { getSubject(t)});
}

copyNames = () => {
    if (fileArray.length > 0) {
        var names = ''
        for (let i = 0; i < fileArray.length; i++) {
            const f = fileArray[i];
            if (i < fileArray.length - 1) { names = names.concat(f.name.replace('.html','') + '\r\n') }
            else { names = names.concat(f.name.replace('.html','')) } 
        }
        copyText(names)
        console.log(names);
    }
    readText(fileArray[0]).then(t => { getSubject(t)});
}

copyPlainText = () => {
    readText(fileArray[0]).then(t => { createPlainText(t)});
}

copyHtml = (f) => {
    readText(f).then(t => {
        copyText(t)
        alert('Copied HTML')
    })
}
//#endregion

loadPlainText = (f) => {
    readText(f).then( t => {
        plainText = createPlainText(t)
        plainText = plainText.replace(/\r\n/g, "<br />")
        document.getElementById("plain-text").innerHTML = plainText
    }) 
}

//#region Helpers

createListItem = (file, index) => {
    var li = document.createElement("LI")
    let tbl = document.createElement("table")
    let tbody = document.createElement("tbody")
    let tr = document.createElement("tr")
    tr.style.height = '72px'
    let td0 = document.createElement("td")
    td0.classList.add('noSelect')
    td0.innerHTML = `${file.name.replace('.html','')}`
    let td1 = document.createElement("td")
    let btn = document.createElement("button")
    btn.className = 'liButton'
    btn.innerHTML = 'Copy HTML'
    btn.addEventListener('click', (e) => {
        e.stopPropagation()
        let li = e.target.closest('li')
        let list = li.parentNode
        let i = getClickedIndex(list, li)
        var f = fileArray[i]
        copyHtml(f)        
    });
    td1.appendChild(btn)
    tr.appendChild(td0)
    tr.appendChild(td1)
    tbody.appendChild(tr)
    tbl.appendChild(tbody)
    li.appendChild(tbl)
    // var html = '<table><tbody><tr style="height: 72px;">' +
    // `<td></td>` +
    // '<td><button class="liButton">Copy HTML</button></td>' +
    // '</tr></tbody></table>'
    // li.innerHTML = html
    li.className = 'liWrapper'
    return li
}
copyText = (t) => {
    clipboard.writeText(t)
}

getSubject = (str) => {
    var start = str.indexOf("<title>") + "<title>".length;
    var end = str.lastIndexOf("</title>");
    var subject = str.slice(start, end);
    return subject;
}

getClickedIndex = (list, node) => {
    var children = list.childNodes;
    for (var i = 0; i < children.length; i++) {
        const e = children[i];
        if (node == e) break;
    }
    return i;
}

async function readText (file) {
    var t = await file.text();
    return t;
}

const convertLinks = /<\s*a.*?href\s*=\s*(?:"|\')(.*?)(?:"|\')[^>]*>(.*?)<\s*?\/\s*?a\s*?>/g;
const removeTags = /(<script(\s|\S)*?<\/script>)|(<style(\s|\S)*?<\/style>)|(<!--(\s|\S)*?-->)|(<\/?(\s|\S)*?>)/g;
const removeWhiteSpace = /^\s+|\t+$/gm;

createPlainText = (str) => {    
    var pt = str.replace(convertLinks, '$2 [$1]')
    pt = pt.replace(removeTags,'')
    pt = pt.replace(removeWhiteSpace,'')
    pt = pt.replace(/\r/g, "\r\n")
    pt.trim()
    return pt
}

//#endregion