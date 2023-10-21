chrome.webRequest.onBeforeRequest.addListener(
    info => {
        let redirect = info.url;
        let regex = new RegExp(/assets\/.+\..+\.js/);
        let fn = regex.exec(info.url);
        if (fn != null) {
            fn = fn[0];
            let s = fn.split("/");
            fn = s[1];
        }
        if (fn) {
            let req = new XMLHttpRequest();
            const redirectURL = `https://nostopgmaming17.github.io/deepversions/${fn}`
            req.open("GET", redirectURL, false);
            req.send();
            if (req.status == 200) {
                redirect = redirectURL;
            }
        }
        return {redirectUrl:redirect};
    },
    {
        urls: ["*://*.deeeep.io/assets/*.js"],
        types: ["script"]
    },
    ["blocking"]
)