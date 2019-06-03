var BASE_ENDPOINT_URL = "https://us-central1-jupetersuno.cloudfunctions.net/"

function jsonToQS(json) {
    var qs = []
    for (element in json) {
        qs.push(element + "=" + json[element])
    }
    return "?" + qs.join("&")
}

// Populate Select with items
function fillSelect(elements) {
    var input = document.getElementById('mitbringenInput')
    for (i = 0; i < elements.length; i++) {
        if (!elements[i]) continue
        var option = document.createElement('option')
        option.setAttribute('value', elements[i].name)
        option.innerText = elements[i].name
        input.append(option)
    }
}

var xhttp = new XMLHttpRequest()
xhttp.open("GET", BASE_ENDPOINT_URL + 'ladeItems', true)
xhttp.setRequestHeader('Access-Control-Allow-Origin', '*')
xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
        try {
            fillSelect(JSON.parse(this.responseText))
        }
        catch (e) {
            console.error(e)
        }
    }
}
xhttp.send()

window.onload = function () {

    var photos = document.getElementById('photos')
    for (i = 1; i <= 7; i++) {
        `
        <div class="image-container" data-large="https://assets.imgix.net/unsplash/bear.jpg?w=1000">
            <img class="placeholder" src="https://assets.imgix.net/unsplash/bear.jpg?w=50" class="img-small">
        </div>
    
        `

        var container = document.createElement('div')
        container.setAttribute('data-large', 'img/full/img' + i + '.jpg')
        container.className = 'image-container'

        var small = new Image()
        small.src = 'img/svg/loader_img' + i + '.svg'
        small.className = 'img-small placeholder'
        small.onload = function () {
            this.classList.add("loaded")

            var imgLarge = new Image()
            imgLarge.src = this.parentElement.dataset.large
            imgLarge.onload = function () {
                setTimeout(function () {
                    this.classList.add('loaded');
                }.bind(this), Math.random() * 3000)
            }
            imgLarge.classList.add('picture');

            this.parentElement.appendChild(imgLarge)
        }

        container.append(small)

        photos.append(container)

    }
}

document.getElementById('anmeldungAbsenden').onclick = function (event) {
    var mitbringen = document.getElementById('mitbringenInput')
    var name = document.getElementById('nameInput').value
    var personen = document.getElementById('personenInput').value

    var item = mitbringen.options[mitbringen.selectedIndex].value

    if (!mitbringen || !name || !item) return // Leere Inputs
    if (name.length < 3 || name.length > 512) return // Komische Nameslänge
    if (personen < 1 || personen > 4) return // Falsche Anzahl

    sendHandler({ anmeldung: "anmelden", name: name, personen: personen, item: item })
}

document.getElementById('volunteerAbsenden').onclick = function (event) {
    var name = document.getElementById('volunteerName').value
    var dauer = document.getElementById('volunteerDauer').value

    if (!name || !dauer) return// Leere Inputs
    if (name.length < 3 || name.length > 512) return // Komische Nameslänge
    if (dauer.length < 3 || dauer.length > 512) return // Komische Dauerlänge

    sendHandler({ anmeldung: "volunteer", name: name, dauer: dauer })
}

var submitData

sendHandler = function (data) {
    submitData = data

    var str = ""
    for (key in submitData) {
        str += key + ': ' + submitData[key] + '\n'
    }
    document.getElementById('confirmationData').innerText = str
    showModal()
}

var modalState = document.getElementById('confirmModal')
var closeTimer

modalState.addEventListener('change', function (e) {
    if (!event.target.checked) {
        console.log('not checked')
        hideModal()
    }
})

function hideModal() {
    if (closeTimer) clearInterval(closeTimer)
    modalState.checked = false
    progress.style.visibility = 'hidden'
    success.style.display = 'none'
    error.style.display = 'none'
    progress.children[0].className = 'bar success w-0'
    progress.children[0].style.width = '0%'
}

function showModal() {
    modalState.checked = true
}

var progress = document.getElementById('progress')
var success = document.getElementById('success')
var error = document.getElementById('error')

// Send Data to Backend
function submitModal() {
    console.log('Daten in DB eintragen: ' + JSON.stringify(submitData))
    progress.style.visibility = 'visible'
    progress.children[0].style.width = '100%'
    var xhttp = new XMLHttpRequest()
    if (submitData.anmeldung == "anmelden") {
        xhttp.open("GET", BASE_ENDPOINT_URL + 'setzeAnmeldung' + jsonToQS(submitData), true)
    }
    else if (submitData.anmeldung == "volunteer") {
        xhttp.open("GET", BASE_ENDPOINT_URL + 'setzeVolunteer' + jsonToQS(submitData), true)
    }
    else {
        return alert("Fehler keiner Methode ausgewählt!")
    }
    xhttp.setRequestHeader('Content-Type', 'application/json')
    xhttp.setRequestHeader('Access-Control-Allow-Origin', '*')
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            try {
                response(JSON.parse(this.responseText))
            }
            catch (e) {
                console.error(e)
            }
        }
    }
    xhttp.send()
}

// Answer from Backend
function response(data) {
    if (data.error) {
        error.style.display = 'block'
        error.innerText = data.error
        progress.children[0].className = "bar danger w-0"
    } else {
        success.style.display = 'block'
        success.innerText = data.success
    }
    closeTimer = setTimeout(function () {
        hideModal()
    }, 3000)

}

// Lazy Loading
var lazyImages = [].slice.call(document.querySelectorAll("img.lazy"))

if ("IntersectionObserver" in window) {
    let lazyImageObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                let lazyImage = entry.target
                lazyImage.src = lazyImage.dataset.src
                lazyImage.srcset = lazyImage.dataset.srcset
                lazyImage.classList.remove("lazy")
                lazyImageObserver.unobserve(lazyImage)
            }
        })
    })

    lazyImages.forEach(function (lazyImage) {
        lazyImageObserver.observe(lazyImage)
    })
} else {
    console.log("LL not supported")
}

if (!submitData) hideModal()

