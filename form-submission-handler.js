(function () {
    function getFormData(form) {
        var elements = form.elements;
        var honeypot = "";

        var fields = Object.keys(elements).filter(function (k) {
            if (elements[k].name === "honeypot") {
                honeypot = elements[k].value; // Capture honeypot value
                return false;
            }
            return true;
        }).map(function (k) {
            if (elements[k].name !== undefined) {
                return elements[k].name;
            } else if (elements[k].length > 0) {
                return elements[k].item(0).name;
            }
        }).filter(function (item, pos, self) {
            return self.indexOf(item) === pos && item;
        });

        var formData = {};
        fields.forEach(function (name) {
            var element = elements[name];
            formData[name] = element.value;

            if (element.length) {
                var data = [];
                for (var i = 0; i < element.length; i++) {
                    var item = element.item(i);
                    if (item.checked || item.selected) {
                        data.push(item.value);
                    }
                }
                formData[name] = data.join(', ');
            }
        });

        formData.formDataNameOrder = JSON.stringify(fields);
        formData.formGoogleSheetName = form.dataset.sheet || "responses";
        formData.formGoogleSendEmail = form.dataset.email || "";

        return { data: formData, honeypot: honeypot };
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        var form = event.target;
        var formData = getFormData(form);

        if (formData.honeypot.trim() !== "") { // Check honeypot value
            console.warn("Spam bot detected. Form submission rejected.");
            return; // Stop form submission
        }

        disableAllButtons(form);
        var url = form.action;
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                form.reset();
                var formElements = form.querySelector(".form-elements");
                if (formElements) {
                    formElements.style.display = "none";
                }
                var thankYouMessage = form.querySelector(".thankyou_message");
                if (thankYouMessage) {
                    thankYouMessage.style.display = "block";
                }
            }
        };
        var encoded = Object.keys(formData.data).map(function (k) {
            return encodeURIComponent(k) + "=" + encodeURIComponent(formData.data[k]);
        }).join('&');
        xhr.send(encoded);
    }

    function loaded() {
        var forms = document.querySelectorAll("form.gform");
        for (var i = 0; i < forms.length; i++) {
            forms[i].addEventListener("submit", handleFormSubmit, false);
        }
    }

    function disableAllButtons(form) {
        var buttons = form.querySelectorAll("button");
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].disabled = true;
        }
    }

    document.addEventListener("DOMContentLoaded", loaded, false);
})();
