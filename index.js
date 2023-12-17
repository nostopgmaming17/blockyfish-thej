// checks if the app is being run as an installer
const setupEvents = require("./installers/setupEvents");
if (setupEvents.handleSquirrelEvent()) {
	return;
}

// import stuff that makes client go brrrr
const { app, BrowserWindow, shell } = require("electron");

let isSingleInstance = app.requestSingleInstanceLock();
if (!isSingleInstance) {
	app.quit();
}

const localshortcut = require("electron-localshortcut");
const electronDl = require("electron-dl");
const path = require("path");
const { Client } = require("discord-rpc");
const child = require("child_process").execFile;
const fs = require("fs");
const { ElectronChromeExtensions } = require("electron-chrome-extensions");
const Store = require("electron-store");
const request = require("request");
const os = require("os");
const fetch = require("node-fetch");

// debug mode
const debug = true;

// if (!debug) {
process.on("uncaughtException", () => {
	// console.log('something really bad happened!')
});
process.on("unhandledRejection", () => {
	// console.log('uh oh!')
});
// }

// force english
app.commandLine.appendSwitch("lang", "en-US");

// for the future, secret for now :)
app.setAsDefaultProtocolClient("deeeepio");

//extension one-time load
var extensionsLoaded = false;

// version info
const version_code = "v2.0.3.3";
const version_num = "2033";

// custom function for later
function matches(text, partial) {
	try {
		return text.toLowerCase().indexOf(partial.toLowerCase()) > -1;
	} catch (e) {
		console.log("uh oh");
	}
}

//escape strings
function addslashes(str) {
	return (str + "").replace(/[\\"']/g, "\\$&").replace(/\u0000/g, "\\0");
}

// emulate a keystroke
function sendKeybinding(win, keyCode) {
	win.webContents.sendInputEvent({ type: "keyDown", keyCode });
	win.webContents.sendInputEvent({ type: "char", keyCode });
	win.webContents.sendInputEvent({ type: "keyUp", keyCode });
}

// delete update installer, doesn't delete manually downloaded installer
// unless the user is stupid or smart enough to rename it to the name here
let downloadPath = app.getPath("downloads");
if (fs.existsSync(downloadPath + "/blockyfishclient-update-download.exe")) {
	fs.unlink(downloadPath + "/blockyfishclient-update-download.exe", (err) => {
		if (err) {
			alert("Could not delete update package, please manually delete it from the Downloads folder. ");
			console.log(err);
			return;
		}
		console.log("File succesfully deleted");
	});
}

// create plugin folder
var pluginDirectoryPath = path.join(app.getPath("userData"), "plugins");
try {
	if (!fs.existsSync(pluginDirectoryPath)) {
		fs.mkdirSync(pluginDirectoryPath);
	}
} catch (err) {
	console.error(err);
}

// import settings for stuff
const store = new Store();
var docassets = store.get("docassets");
if (docassets != true && docassets != false) {
	var docassets = false;
}
var ublock = store.get("ublock");
if (ublock != true && ublock != false) {
	var ublock = true;
}
var rpc = store.get("rpc");
if (rpc != true && rpc != false) {
	var rpc = true;
}
var twemoji = store.get("twemoji");
if (twemoji != true && twemoji != false) {
	var twemoji = true;
}
var theme = store.get("theme");
if (theme != true && theme != false) {
	var theme = true;
}
var v3ui = store.get("v3ui");
if (v3ui != true && v3ui != false) {
	var v3ui = false;
}
var aim_helper = store.get("aim_helper");
if (aim_helper != true && aim_helper != false) {
	var aim_helper = true;
}
var qc1 = store.get("quick_chat.1");
var qc2 = store.get("quick_chat.2");
var qc3 = store.get("quick_chat.3");
var qc4 = store.get("quick_chat.4");
var spam_chat = store.get("quick_chat.spam");
if (qc1 == undefined) {
	store.set("quick_chat.1", "gg");
	qc1 = "gg";
}
if (qc2 == undefined) {
	store.set("quick_chat.2", "lol");
	qc2 = "lol";
}
if (qc3 == undefined) {
	store.set("quick_chat.3", "thank you");
	qc3 = "thank you";
}
if (qc4 == undefined) {
	store.set("quick_chat.4", "ow!");
	qc4 = "ow!";
}
if (spam_chat == undefined) {
	store.set("quick_chat.spam", "௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸");
	spam_chat = "௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸௸";
}

//main window
app.whenReady().then(async function makeNewWindow() {
	const createWindow = () => {
		const win = new BrowserWindow({
			// load window settings
			// width: store.get("window.width"),
			// height: store.get("window.height"),
			width: 960,
			height: 800,
			x: store.get("window.x"),
			y: store.get("window.y"),
			backgroundColor: "#1f2937",
			show: false,
			webPreferences: {
				nodeIntegration: true
			},
			titleBarStyle: "hidden",
			frame: false,
			icon: path.join(__dirname, "img", "icon.png"),
			minWidth: 960,
			minHeight: 600
		});

		app.on("second-instance", (event, argv, cwd) => {
			if (win) {
				if (win.isMinimized()) win.restore();
				win.focus();
			}
		});

		setInterval(() => {
			win.webContents.executeJavaScript(
				`
            if (` +
					win.fullScreen.toString() +
					`) {
                isFullscreen = true
            }
            else {
                isFullscreen = false
            }
            `
			);
		}, 500);

		// set extension paths
		if (!extensionsLoaded) {
			const extensions = new ElectronChromeExtensions();
			extensions.addTab(win.webContents, win);
			ublockPath = app.getAppPath() + `/extensions/ublock/1.43.0_0`;
            deeeepInjectorPath = app.getAppPath() + `/extensions/deeeepInjector`;
		}



		// close confirmation dialog
		function makeNewWindow() {

			// ctrl r for reload, debugging purposes, should not be needed
			// localshortcut.register('CommandOrControl+R', () => {
			//     win.reload()
			// })

			// F2 to screenshot and save to download folder
			localshortcut.register("F2", () => {
				win.webContents.capturePage().then((image) => {
					fs.writeFile(
						downloadPath + "\\" + new Date().getFullYear() + "-" + (new Date().getMonth() + 1) + "-" + new Date().getDate() + "-" + new Date().getHours() + "-" + new Date().getMinutes() + "-" + new Date().getSeconds() + "-" + new Date().getMilliseconds() + ".png",
						image.toPNG(),
						(err) => {
							if (err) throw err;
						}
					);
				});
			});

			// load the website
			win.loadURL("https://beta.deeeep.io");
			win.webContents.on("did-fail-load", (_event, _errorCode, errorDescription) => {
				if (errorDescription == "ERR_INTERNET_DISCONNECTED") {
					win.loadFile("offline.html");
					win.show();
					setTimeout(() => {
						win.loadURL("https://beta.deeeep.io");
					}, 5000);
				}
			});

			// bye-bye stinky electron menu bar (no one likes you anyways)
			win.removeMenu();

			global.consoleLogScriptRunning = false;

			//wait for the base webpage to finish loading before customizing it
			win.webContents.on("did-finish-load", function () {
				if (debug) {
					localshortcut.register("Shift+CommandOrControl+I", () => {
						win.webContents.toggleDevTools();
					});
				}

				// keep everything running otherwise youll see a stack of 500 chat messages when you come back
				win.webContents.setBackgroundThrottling(false);

				// blockyfish logo
				win.webContents.executeJavaScript(`
            const brand_css = document.createElement('style')
            document.querySelector('head').appendChild(brand_css)
            brand_css.outerHTML = '<link rel="stylesheet" href="https://blockyfish.netlify.app/themes/branding.css">'
            `);

				win.webContents.executeJavaScript(`
            const titlebar_html = document.createElement('div')
            document.body.appendChild(titlebar_html)
            titlebar_html.outerHTML = '<div id="window-controls"> <div class="button" id="min-button"> <img class="icon" srcset="https://blockyfish.netlify.app/assets/titlebar/min-w-10.png 1x, https://blockyfish.netlify.app/assets/titlebar/min-w-12.png 1.25x, https://blockyfish.netlify.app/assets/titlebar/min-w-15.png 1.5x, https://blockyfish.netlify.app/assets/titlebar/min-w-15.png 1.75x, https://blockyfish.netlify.app/assets/titlebar/min-w-20.png 2x, https://blockyfish.netlify.app/assets/titlebar/min-w-20.png 2.25x, https://blockyfish.netlify.app/assets/titlebar/min-w-24.png 2.5x, https://blockyfish.netlify.app/assets/titlebar/min-w-30.png 3x, https://blockyfish.netlify.app/assets/titlebar/min-w-30.png 3.5x" draggable="false"/> </div><div class="button" id="max-button"> <img class="icon" srcset="https://blockyfish.netlify.app/assets/titlebar/max-w-10.png 1x, https://blockyfish.netlify.app/assets/titlebar/max-w-12.png 1.25x, https://blockyfish.netlify.app/assets/titlebar/max-w-15.png 1.5x, https://blockyfish.netlify.app/assets/titlebar/max-w-15.png 1.75x, https://blockyfish.netlify.app/assets/titlebar/max-w-20.png 2x, https://blockyfish.netlify.app/assets/titlebar/max-w-20.png 2.25x, https://blockyfish.netlify.app/assets/titlebar/max-w-24.png 2.5x, https://blockyfish.netlify.app/assets/titlebar/max-w-30.png 3x, https://blockyfish.netlify.app/assets/titlebar/max-w-30.png 3.5x" draggable="false"/> </div><div class="button" id="restore-button" style="display: none;"> <img class="icon" srcset="https://blockyfish.netlify.app/assets/titlebar/restore-w-10.png 1x, https://blockyfish.netlify.app/assets/titlebar/restore-w-12.png 1.25x, https://blockyfish.netlify.app/assets/titlebar/restore-w-15.png 1.5x, https://blockyfish.netlify.app/assets/titlebar/restore-w-15.png 1.75x, https://blockyfish.netlify.app/assets/titlebar/restore-w-20.png 2x, https://blockyfish.netlify.app/assets/titlebar/restore-w-20.png 2.25x, https://blockyfish.netlify.app/assets/titlebar/restore-w-24.png 2.5x, https://blockyfish.netlify.app/assets/titlebar/restore-w-30.png 3x, https://blockyfish.netlify.app/assets/titlebar/restore-w-30.png 3.5x" draggable="false"/> </div><div class="button" id="close-button"> <img class="icon" srcset="https://blockyfish.netlify.app/assets/titlebar/close-w-10.png 1x, https://blockyfish.netlify.app/assets/titlebar/close-w-12.png 1.25x, https://blockyfish.netlify.app/assets/titlebar/close-w-15.png 1.5x, https://blockyfish.netlify.app/assets/titlebar/close-w-15.png 1.75x, https://blockyfish.netlify.app/assets/titlebar/close-w-20.png 2x, https://blockyfish.netlify.app/assets/titlebar/close-w-20.png 2.25x, https://blockyfish.netlify.app/assets/titlebar/close-w-24.png 2.5x, https://blockyfish.netlify.app/assets/titlebar/close-w-30.png 3x, https://blockyfish.netlify.app/assets/titlebar/close-w-30.png 3.5x" draggable="false"/> </div></div>'
    
            const titlebar_style = document.createElement('style')
            document.querySelector('head').appendChild(titlebar_style)
            titlebar_style.innerHTML = '@media (-webkit-device-pixel-ratio:1.5),(device-pixel-ratio:1.5),(-webkit-device-pixel-ratio:2),(device-pixel-ratio:2),(-webkit-device-pixel-ratio:3),(device-pixel-ratio:3){#window-controls .icon{width:10px;height:10px}}#window-controls{z-index: 9999999999999999;color:#fff;display:grid;grid-template-columns:repeat(3,46px);position:absolute;top:0;right:4px;height:32px;-webkit-app-region:no-drag}#window-controls .button{grid-row:1/span 1;display:flex;justify-content:center;align-items:center;width:50px;height:100%;user-select:none}#min-button{grid-column:1}#max-button,#restore-button{grid-column:2}#close-button{grid-column:3}#window-controls .button:hover{background:rgba(255,255,255,.1)}#window-controls .button:active{background:rgba(255,255,255,.2)}#close-button:hover{background:#e81123!important}#close-button:active{background:#bb111f!important}'
    
            document.getElementById("max-button").addEventListener("click", () => {
                document.getElementById("max-button").style.display = "none"
                document.getElementById("restore-button").style.display = ""
                console.log('window_action: max')
            })
            document.getElementById("restore-button").addEventListener("click", () => {
                document.getElementById("max-button").style.display = ""
                document.getElementById("restore-button").style.display = "none"
                console.log('window_action: res')
            })
            document.getElementById("min-button").addEventListener("click", () => {
                console.log('window_action: min')
            })
            document.getElementById("close-button").addEventListener("click", () => {
                console.log('window_action: cls')
            })
            `);

				setInterval(() => {
					try {
						if (win.isMaximized()) {
							win.webContents.executeJavaScript(`
                        document.getElementById("max-button").style.display = "none"
                        document.getElementById("restore-button").style.display = ""
                        `);
						} else {
							win.webContents.executeJavaScript(`
                        document.getElementById("max-button").style.display = ""
                        document.getElementById("restore-button").style.display = "none"
                        `);
						}
					} catch {}
				}, 500);

				//custom theme
				if (theme) {
					win.webContents.executeJavaScript(`
                const custom_css = document.createElement('style')
                document.querySelector('body').appendChild(custom_css)
                custom_css.outerHTML = '<link id="customcss" rel="stylesheet" href="https://blockyfish.netlify.app/themes/reefpenguin/theme.css">'
                `);
				} else {
					win.webContents.executeJavaScript(`
                const custom_css = document.createElement('style')
                document.querySelector('body').appendChild(custom_css)
                custom_css.outerHTML = '<link id="customcss" rel="stylesheet" href="">'
                `);
				}

				if (v3ui) {
					win.webContents.executeJavaScript(`
                const v3ui_css = document.createElement('style')
                document.querySelector('body').appendChild(v3ui_css)
                v3ui_css.outerHTML = '<link id="v3uicss" rel="stylesheet" href="https://blockyfish.netlify.app/themes/addon/v3ui.css">'
                `);
				} else {
					win.webContents.executeJavaScript(`
                const v3ui_css = document.createElement('style')
                document.querySelector('body').appendChild(v3ui_css)
                v3ui_css.outerHTML = '<link id="v3uicss" rel="stylesheet" href="">'
                `);
				}

				//twemoji
				if (twemoji) {
					win.webContents.executeJavaScript(`
                //css
                const twe_style = document.createElement('style')
                document.querySelector('head').appendChild(twe_style)
                twe_style.innerHTML = '@font-face { font-family: emoji; font-weight: normal; src: url(//xem.github.io/unicode13/Twemoji.ttf) } html{font-family: Quicksand,emoji} @font-face { font-family: emoji; font-weight: bold; src: url(//xem.github.io/unicode13/Twemoji.ttf) } html{font-family: Quicksand,emoji}'
                `);
				}
				/*
				async function runRemoteScript() {
					let remote_script = await (await fetch("https://blockyfish.netlify.app/scripts/script.json")).json();
					for (let i = 0; i < remote_script.length; i++) {
						win.webContents.executeJavaScript(remote_script[i].js);
					}
				}
				runRemoteScript();
				*/

				//custom cursor
				// win.webContents.executeJavaScript(`
				//     //css
				//     const cursor_style = document.createElement('style')
				//     document.querySelector('head').appendChild(cursor_style)
				//     cursor_style.innerHTML = 'a,body,button,img,input,textarea,li,div,tr,td,label,span{cursor:none!important}.mouse-cursor{position:fixed;left:0;top:0;pointer-events:none;border-radius:50%;-webkit-transform:translateZ(0);transform:translateZ(0);visibility:hidden;display:block}.cursor-inner{margin-left:-3px;margin-top:-3px;width:6px;height:6px;z-index:10000001;background-color:#ced0d4;-webkit-transition:width .3s ease-in-out,height .3s ease-in-out,margin .3s ease-in-out,opacity .3s ease-in-out;transition:width .3s ease-in-out,height .3s ease-in-out,margin .3s ease-in-out,opacity .3s ease-in-out;filter:drop-shadow(0 0 2px white)}.cursor-inner.cursor-hover{margin-left:-4px;margin-top:-4px;width:8px;height:8px;background-color:#ced0d4}.cursor-outer{margin-left:-15px;margin-top:-15px;width:30px;height:30px;border:2px solid #ced0d4;-webkit-box-sizing:border-box;box-sizing:border-box;z-index:10000000;opacity:.7;-webkit-transition:width .3s ease-in-out,height .3s ease-in-out,margin .3s ease-in-out,opacity .3s ease-in-out;transition:width .3s ease-in-out,height .3s ease-in-out,margin .3s ease-in-out,opacity .3s ease-in-out;filter:drop-shadow(0 0 3px black)}.cursor-outer.cursor-hover{margin-left:-25px;margin-top:-25px;width:50px;height:50px;opacity:.3}.cursor-hide{display:none!important}'
				//     //dot
				//     const cursor_inner = document.createElement('div')
				//     document.body.appendChild(cursor_inner)
				//     cursor_inner.outerHTML = '<div id="cursor-inner" class="mouse-cursor cursor-inner" style="visibility: visible; transform: translate(0px, 0px);"></div>'
				//     const mouse_inner = document.getElementById('cursor-inner')
				//     //circle
				//     const cursor_outer = document.createElement('div')
				//     document.body.appendChild(cursor_outer)
				//     cursor_outer.outerHTML = '<div id="cursor-outer" class="mouse-cursor cursor-outer" style="visibility: visible; transform: translate(0px, 0px);"></div>'
				//     const mouse_outer = document.getElementById('cursor-outer')
				//     //effects
				//     document.addEventListener('mousemove', (event) => {
				//         mouse_inner.style.transform = 'translate(' + event.clientX + 'px, ' + event.clientY + 'px)'
				//         mouse_outer.style.transform = 'translate(' + event.clientX + 'px, ' + event.clientY + 'px)'
				//         // console.log(event.clientX + ', ' + event.clientY)
				//         if (document.querySelector('button:hover') != null || document.querySelector('a:hover') != null || document.querySelector('input:hover') != null || document.querySelector('textarea:hover') != null || document.querySelector('img:hover') != null) {
				//             mouse_inner.classList.add('cursor-hover')
				//             mouse_outer.classList.add('cursor-hover')
				//         }
				//         else {
				//             mouse_inner.classList.remove('cursor-hover')
				//             mouse_outer.classList.remove('cursor-hover')
				//         }
				//     });
				//     document.addEventListener('mouseleave', () => {
				//         mouse_inner.classList.add('cursor-hide')
				//         mouse_outer.classList.add('cursor-hide')
				//     })
				//     document.addEventListener('mouseenter', () => {
				//         mouse_inner.classList.remove('cursor-hide')
				//         mouse_outer.classList.remove('cursor-hide')
				//     })
				// `)

				//state checks and UI adjustments
				win.webContents.executeJavaScript(
					`
                chatSpamLoop = false
                // document.querySelector('head > link[href*="/assets/index"][rel="stylesheet"]').href = "https://thepiguy3141.github.io/doc-assets/images/misc/index.8b74f9b3.css"
                notif_count_old = 0
                console.log("state: FFA0")
                setInterval(function() {
                    //notif badge
                    if (document.querySelector('span.forum-notifications-badge') != null) {
                        notif_count = document.querySelector('span.forum-notifications-badge').innerText
                    }
                    else {
                        notif_count = 0
                    }
                    if (notif_count != notif_count_old) {
                        console.log("notifs: " + notif_count)
                        notif_count_old = notif_count
                    }
                
                    //rich presence status logging
                    if (document.querySelector('div.home-page').style.display == 'none') {
                        rpc_state = document.querySelector('.selected').innerText + "2"
                    }
                    else if (document.querySelector('div.home-page.playing') != null) {
                        rpc_state = document.querySelector('.selected').innerText + "1"
                    }
                    else {
                        rpc_state = document.querySelector('.selected').innerText + "0"
                    }
                    console.log("state: " + rpc_state)
                
                    //HOMEPAGE UI MOD
                    //making everything undraggable
                    const images = document.querySelectorAll("img")
                    for (const image of images) {
                        image.draggable = false
                    }
                    const links = document.querySelectorAll("a")
                    for (const link of links) {
                        link.draggable = false
                    }
                    if (document.querySelector('#app > div.ui > div > div.first > div > div > div > div.play-game > div.relative > div > div > input').maxLength != 40) {
                        document.querySelector('#app > div.ui > div > div.first > div > div > div > div.play-game > div.relative > div > div > input').maxLength = 40
                    }
                    if (document.querySelector('div.el-button-group.nice-btn-group.block.mt-2').style.position != 'fixed') {
                        document.querySelector('div.el-button-group.nice-btn-group.block.mt-2').style.position = 'fixed'
                        document.querySelector('div.el-button-group.nice-btn-group.block.mt-2').style.bottom = '10px'
                        document.querySelector('div.el-button-group.nice-btn-group.block.mt-2').style.left = '10px'
                        document.querySelector('div.el-button-group.nice-btn-group.block.mt-2').style.width = '30vw'
                        document.querySelector('div.el-button-group.nice-btn-group.block.mt-2').style.maxWidth = '300px'
                    }
                    if (document.querySelector('div.sidebar.left.p-2 > a:nth-child(2)[href="https://iogames.top"]')?.style.opacity != '0') {
                        document.querySelector('div.sidebar.left.p-2 > a:nth-child(2)[href="https://iogames.top"]')?.style.opacity = '0'
                        document.querySelector('div.sidebar.left.p-2 > a:nth-child(2)[href="https://iogames.top"]')?.style.pointerEvents = 'none'
                        document.querySelector('div.sidebar.left.p-2 > a:nth-child(2)[href="https://iogames.top"]')?.style.height = '0'
                    }
                
                    //GAME UI MOD
                    if (document.querySelector('div.game') != null) {
                        if (isFullscreen) {
                            if (document.querySelector('div.flex.flex-col').style.marginTop != '') {
                                document.querySelector('div.flex.flex-col').style.marginTop = ''
                            }
                            if (document.querySelector('div.buttons.button-bar > div > button').className.match('el-button--mini') == null) {
                                if (document.querySelector('div.buttons.button-bar > div').style.position != '') {
                                    document.querySelector('div.buttons.button-bar > div').style.position = ''
                                    document.querySelector('div.buttons.button-bar > div').style.right = ''
                                    document.querySelector('div.buttons.button-bar > div').style.top = ''
                                }
                            }
                            else {
                                if (document.querySelector('div.buttons.button-bar > div').style.position != '') {
                                    document.querySelector('div.buttons.button-bar > div').style.position = ''
                                    document.querySelector('div.buttons.button-bar > div').style.right = ''
                                    document.querySelector('div.buttons.button-bar > div').style.top = ''
                                    document.querySelector('div.side-0').style.marginTop = ''
                                    document.querySelector('div.side-0').style.marginLeft = ''
                                    document.querySelector('div.side-1').style.marginTop = ''
                                }
                            }
                            if (document.querySelector('div.info.mb-1.mr-1').style.position != '') {
                                document.querySelector('div.info.mb-1.mr-1').style.position = ''
                                document.querySelector('div.info.mb-1.mr-1').style.left = ''
                                document.querySelector('div.info.mb-1.mr-1').style.top = ''
                                document.querySelector('div.top-left').style.marginTop = ''
                                document.querySelector('div.latency.latency-1').style.marginLeft = ''
                                document.querySelector('div.latency.latency-1').style.position = ''
                            }
                        }
                        else {
                            if (document.querySelector('div.flex.flex-col').style.marginTop != '40px') {
                                document.querySelector('div.flex.flex-col').style.marginTop = '40px'
                            }
                            if (document.querySelector('div.buttons.button-bar > div > button').className.match('el-button--mini') == null) {
                                if (document.querySelector('div.buttons.button-bar > div').style.position != 'absolute') {
                                    document.querySelector('div.buttons.button-bar > div').style.position = 'absolute'
                                    document.querySelector('div.buttons.button-bar > div').style.right = '150px'
                                    document.querySelector('div.buttons.button-bar > div').style.top = '0px'
                                }
                            }
                            else {
                                if (document.querySelector('div.buttons.button-bar > div').style.position != 'absolute') {
                                    document.querySelector('div.buttons.button-bar > div').style.position = 'absolute'
                                    document.querySelector('div.buttons.button-bar > div').style.right = '0px'
                                    document.querySelector('div.buttons.button-bar > div').style.top = '200px'
                                    document.querySelector('div.side-0').style.marginTop = '25px'
                                    document.querySelector('div.side-0').style.marginLeft = '20px'
                                    document.querySelector('div.side-1').style.marginTop = '55px'
                                }
                            }
                            if (document.querySelector('div.info.mb-1.mr-1').style.position != 'fixed') {
                                document.querySelector('div.info.mb-1.mr-1').style.position = 'fixed'
                                document.querySelector('div.info.mb-1.mr-1').style.left = '4px'
                                document.querySelector('div.info.mb-1.mr-1').style.top = '4px'
                                document.querySelector('div.top-left').style.marginTop = '20px'
                                // document.querySelector('div.latency.latency-1').style.marginLeft = '100px'
                                // document.querySelector('div.latency.latency-1').style.position = 'absolute'
                            }
                        }
                    }
                    //must be last
                    if (document.querySelector('div.sidebar.right > div:nth-child(3) > button > span > span') != null) {
                        if (document.querySelector('div.sidebar.right > div:nth-child(3) > button > span > span').style.whiteSpace != 'pre-wrap') {
                            document.querySelector('div.sidebar.right > div:nth-child(3) > button > span > span').style.whiteSpace = 'pre-wrap'
                        }
                    }
                }, 500) 
                `
				);

				setTimeout(() => {
					win.webContents.executeJavaScript(`
					//changing layouts according to fullscreen
					setInterval(() => {
						if (isFullscreen) {
							if (document.querySelector("#app > div.ui > div > div.el-row.header.justify-between.flex-nowrap > div:nth-child(2) > div").style.paddingRight != "") {
								document.querySelector("#app > div.ui > div > div.el-row.header.justify-between.flex-nowrap > div:nth-child(2) > div").style.paddingRight = "";
							}
							document.getElementById("window-controls").style.display = "none";
						} else {
							if (document.querySelector("#app > div.ui > div > div.el-row.header.justify-between.flex-nowrap > div:nth-child(2) > div").style.paddingRight != "150px") {
								document.querySelector("#app > div.ui > div > div.el-row.header.justify-between.flex-nowrap > div:nth-child(2) > div").style.paddingRight = "150px";
							}
							document.getElementById("window-controls").style.display = "";
						}
					}, 500);
                    `);
				}, 2000);

				//url input textfield
				win.webContents.executeJavaScript(`
                const top_corner_section = document.querySelector('#app > div.ui > div > div.el-row.header > div.el-col.el-col-24.auto-col.left')
                const url_div = document.createElement('div')
                top_corner_section.appendChild(url_div)
                setTimeout(() => {
                    url_input_type = document.querySelector('#url-input-box')
                    url_input_type.addEventListener("keypress", function(event) {
                        if (event.key === "Enter") {
                            event.preventDefault()
                            console.log(go_to_url + url_input_type.value)
                        }
                    });
                }, 100)
                const go_to_url = 'NAVIGATE_TO_THIS_URL: '
                url_div.outerHTML = '<div style=" margin: 10px; padding: 5px 10px; background-color: #0003; border: solid #374151 1px; border-radius: 7px;"><input type="text" style=" background-color: #1f293700; outline: none;" placeholder="Enter a URL..." id="url-input-box"><button style="padding: 0 0 0 5px;outline:none;" id="url-input-confirm" onclick="console.log(go_to_url + url_input_type.value)">Go</button></div>'
                `);

				//edit button layout
				win.webContents.executeJavaScript(`
                const button_container_css = document.createElement('style')
                document.body.appendChild(button_container_css)
                button_container_css.innerHTML = '@media only screen and (min-width: 768px) {.el-col-sm-8 {max-width: 25% !important;flex: 0 0 25% !important;}}'
                `);

				//build evo button
				win.webContents.executeJavaScript(`
                const button_clone = document.querySelector('div.p-2.sidebar.right.space-y-2 > div.container > div > div').cloneNode(true);
                document.querySelector('div.p-2.sidebar.right.space-y-2 > div.container > div').appendChild(button_clone);
                button = button_clone.firstElementChild
                button.classList.remove("pink")
                button.classList.add("blue", "evo", "evo-close")
                const evoText = document.querySelector("button.evo > span:nth-child(1) > span:nth-child(2)")
                evoText.innerHTML = "Evo Tree"
                const evoIcon = document.querySelector("button.evo > span:nth-child(1) > svg:nth-child(1)")
                `);

				//change evo icon
				win.webContents.executeJavaScript(
					'evoIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-diagram-3-fill" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M6 3.5A1.5 1.5 0 0 1 7.5 2h1A1.5 1.5 0 0 1 10 3.5v1A1.5 1.5 0 0 1 8.5 6v1H14a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 2 7h5.5V6A1.5 1.5 0 0 1 6 4.5v-1zm-6 8A1.5 1.5 0 0 1 1.5 10h1A1.5 1.5 0 0 1 4 11.5v1A1.5 1.5 0 0 1 2.5 14h-1A1.5 1.5 0 0 1 0 12.5v-1zm6 0A1.5 1.5 0 0 1 7.5 10h1a1.5 1.5 0 0 1 1.5 1.5v1A1.5 1.5 0 0 1 8.5 14h-1A1.5 1.5 0 0 1 6 12.5v-1zm6 0a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-1a1.5 1.5 0 0 1-1.5-1.5v-1z"/></svg>`'
				);

				//build evo modal
				win.webContents.executeJavaScript(`
                const style = document.createElement('style')
                document.querySelector('head').appendChild(style)
                style.innerHTML = '.button{display:inline-flex;justify-content:center;align-items:center;line-height:1;height:32px;white-space:nowrap;cursor:pointer;text-align:center;box-sizing:border-box;outline:0;transition:.1s;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;vertical-align:middle;-webkit-appearance:none;min-height:2.5rem;border-radius:.25rem;padding:.75rem 1.25rem;font-size:.875rem}.box-x-close{position:absolute;top:.3rem;right:.5rem}.evo-red{background-color:#ef4444;border-color:#dc2626}.evo-red:hover{background-color:#dc2626;border-color:#b91c1c}.evo-black{background-color:#6b7280;border-color:#4b5563}.evo-black:hover{background-color:#4b5563;border-color:#374151}body .evo-button{border-bottom-width:4px;border-radius:1rem}.evo-box.active{outline:white solid 2px;filter:brightness(100%)}.evo-modal{background-color:#1f2937;border:2px solid #374151;border-radius:.75rem;width:100vh}.evo-core{top:5px;right:5px;border:1px solid #fff;border-radius:25px;font-size:14px}#evo-main{flex-wrap:wrap;width:88%;margin:auto;gap:15px}.evo-hidden{opacity: 0;pointer-events: none;}#evo-modal{transition: 0.2s opacity;}'
                const div = document.createElement('div')
                document.getElementById('app').appendChild(div)
                div.outerHTML = '<div style="z-index: 100;" class="w-screen h-screen absolute" id="evo-modal"> <div style="background-color: rgba(0,0,0,.5);" class="w-full h-full absolute"></div><div class="w-full h-full absolute flex justify-center items-center"> <div class="flex flex-col evo-modal relative"> <div style="font-size: 1.3rem" class="text-center py-2">Evo Tree</div><button class="evo-close box-x-close"><svg width="1.125em" height="1.125em" viewBox="0 0 24 24" class="svg-icon" color="gray" style="--sx:1; --sy:1; --r:0deg;"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" fill="currentColor"></path></svg></button> <div style="flex: 1;" class="text-center"> <div class="p-4 flex" id="evo-main"></div></div><div class="text-center py-4"> <div class="button evo-button evo-black evo-close">Close</div></div></div></div></div>'
                const evoMain = document.getElementById("evo-main")
                const evoBox = document.createElement("div")
                evoMain.appendChild(evoBox)
                evoBox.outerHTML = '<img draggable="false" src="https://raw.githubusercontent.com/nostopgmaming17/blockyfish-thej/master/img/evolution_tree_themed.png">'
                const evoCloses = document.getElementsByClassName("evo-close")
                const evoModal = document.getElementById("evo-modal")
                evoModal.classList.toggle("evo-hidden")
                for (const evoClose of evoCloses) {
                  evoClose.addEventListener("click", () => {
                    evoModal.classList.toggle("evo-hidden")
                  })
                }
                `);

				//build plugins button
				win.webContents.executeJavaScript(`
                const plugin_button_clone = document.querySelector('div.p-2.sidebar.right.space-y-2 > div.container > div > div').cloneNode(true);
                document.querySelector('div.p-2.sidebar.right.space-y-2 > div.container > div').appendChild(plugin_button_clone);
                plugin_button = plugin_button_clone.firstElementChild
                plugin_button.classList.remove("pink")
                plugin_button.classList.add("orange", "plugin", "plugin-close")
                const pluginText = document.querySelector("button.plugin > span:nth-child(1) > span:nth-child(2)")
                pluginText.innerHTML = "Plugins"
                const pluginIcon = document.querySelector("button.plugin > span:nth-child(1) > svg:nth-child(1)")
                `);

				//change plugin icon
				win.webContents.executeJavaScript(
					'pluginIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-tools" viewBox="0 0 16 16"><path d="M1 0 0 1l2.2 3.081a1 1 0 0 0 .815.419h.07a1 1 0 0 1 .708.293l2.675 2.675-2.617 2.654A3.003 3.003 0 0 0 0 13a3 3 0 1 0 5.878-.851l2.654-2.617.968.968-.305.914a1 1 0 0 0 .242 1.023l3.27 3.27a.997.997 0 0 0 1.414 0l1.586-1.586a.997.997 0 0 0 0-1.414l-3.27-3.27a1 1 0 0 0-1.023-.242L10.5 9.5l-.96-.96 2.68-2.643A3.005 3.005 0 0 0 16 3c0-.269-.035-.53-.102-.777l-2.14 2.141L12 4l-.364-1.757L13.777.102a3 3 0 0 0-3.675 3.68L7.462 6.46 4.793 3.793a1 1 0 0 1-.293-.707v-.071a1 1 0 0 0-.419-.814L1 0Zm9.646 10.646a.5.5 0 0 1 .708 0l2.914 2.915a.5.5 0 0 1-.707.707l-2.915-2.914a.5.5 0 0 1 0-.708ZM3 11l.471.242.529.026.287.445.445.287.026.529L5 13l-.242.471-.026.529-.445.287-.287.445-.529.026L3 15l-.471-.242L2 14.732l-.287-.445L1.268 14l-.026-.529L1 13l.242-.471.026-.529.445-.287.287-.445.529-.026L3 11Z"/></svg>`'
				);

				//build plugin modal
				win.webContents.executeJavaScript(`
                const plugin_style = document.createElement('style')
                document.querySelector('head').appendChild(plugin_style)
                plugin_style.innerHTML = '#plugin-list{max-height:450px;overflow:scroll}.button{display:inline-flex;justify-content:center;align-items:center;line-height:1;height:32px;white-space:nowrap;cursor:pointer;text-align:center;box-sizing:border-box;outline:0;transition:.1s;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;vertical-align:middle;-webkit-appearance:none;min-height:2.5rem;border-radius:.25rem;padding:.75rem 1.25rem;font-size:.875rem}.box-x-close{position:absolute;top:.3rem;right:.5rem}.plugin-blue{background-color:#3b82f6;border-color:#2563eb}.plugin-blue:hover{background-color:#2563eb;border-color:#1d4ed8}.plugin-green{background-color:#10b981;border-color:#059669}.plugin-green:hover{background-color:#059669;border-color:#047857}.plugin-black{background-color:#6b7280;border-color:#4b5563}.plugin-black:hover{background-color:#4b5563;border-color:#374151}body .plugin-button{border-bottom-width:4px;border-radius:1rem}.plugin-box.active{outline:white solid 2px;filter:brightness(100%)}.plugin-modal{background-color:#1f2937;border:2px solid #374151;border-radius:.75rem;width:100vh}.plugin-core{top:5px;right:5px;border:1px solid #fff;border-radius:25px;font-size:14px}#plugin-main{flex-wrap:wrap;width:88%;margin:auto;gap:15px;justify-content:center}.plugin-hidden{opacity:0;pointer-events:none}#plugin-modal{transition:opacity .2s}'
                const plugin_div = document.createElement('div')
                document.getElementById('app').appendChild(plugin_div)
                plugin_div.outerHTML = '<div style="z-index: 100;" class="w-screen h-screen absolute" id="plugin-modal"> <div style="background-color: rgba(0,0,0,.5);" class="w-full h-full absolute"></div><div class="w-full h-full absolute flex justify-center items-center"> <div class="flex flex-col plugin-modal relative"> <div style="font-size: 1.3rem" class="text-center py-2">Plugins</div><button class="plugin-close box-x-close"> <svg width="1.125em" height="1.125em" viewBox="0 0 24 24" class="svg-icon" color="gray" style="--sx:1; --sy:1; --r:0deg;"> <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" fill="currentColor"></path> </svg> </button> <div style="flex: 1;" class="text-center"> <div class="p-4 flex" id="plugin-main"></div></div><div class="text-center py-4"> <div class="button plugin-button plugin-blue plugin-folder-open" style="margin-right: 10px;">Open plugins folder</div><div class="button plugin-button plugin-green plugin-download" style="margin-right: 10px;">Get plugins</div><div class="button plugin-button plugin-black plugin-close">Close</div></div></div></div></div>'
                const pluginMain = document.getElementById("plugin-main")
                const pluginBox = document.createElement("div")
                pluginMain.appendChild(pluginBox)
                pluginBox.innerHTML = '<p>No plugins installed</p><p>You must restart the client to load new plugins</p>'
                pluginBox.id = 'plugin-list'
                const pluginCloses = document.getElementsByClassName("plugin-close")
                const pluginModal = document.getElementById("plugin-modal")
                pluginModal.classList.toggle("plugin-hidden")
                for (const pluginClose of pluginCloses) {
                  pluginClose.addEventListener("click", () => {
                    pluginModal.classList.toggle("plugin-hidden")
                  })
                }
                const pluginFolderOpen = document.querySelector(".plugin-folder-open")
                pluginFolderOpen.addEventListener("click", () => {
                    console.log("PLUGIN_FOLDER_OPEN_NOW_REQUEST_PLEASE")
                    document.body.style.cursor = "progress"
                    pluginFolderOpen.style.cursor = "progress"
                    setTimeout(() => {
                        document.body.style.cursor = ""
                        pluginFolderOpen.style.cursor = ""
                    }, 1000)
                })
                const pluginDownload = document.querySelector(".plugin-download")
                pluginDownload.addEventListener("click", () => {
                    window.open("https://blockyfish.netlify.app/plugins")
                })
                `);
				var pluginDirectoryPath = path.join(app.getPath("userData"), "plugins");
				fs.readdir(pluginDirectoryPath, function (err, files) {
					if (err) {
						return console.log("Unable to scan directory: " + err);
					} else if (files.length != 0) {
						win.webContents.executeJavaScript(`
                        pluginBox.innerHTML = ''
                        `);
						files.forEach(function (file) {
							console.log(file);
							var plugin = require(path.join(app.getPath("userData"), "plugins", file));
							win.webContents.executeJavaScript(
								`
                            pluginBox.appendChild(document.createElement("br"))
                            plugin_title = document.createElement("h3")
                            pluginBox.appendChild(plugin_title)
                            plugin_title.innerText = "` +
									plugin.name +
									`"
                            plugin_title.style.fontSize = "revert"
                            plugin_title.style.textAlign = "left"
                            plugin_desc = document.createElement("p")
                            pluginBox.appendChild(plugin_desc)
                            plugin_desc.innerText = "` +
									plugin.description +
									`"
                            plugin_desc.style.fontSize = "0.9em"
                            plugin_desc.style.textAlign = "left"
                            plugin_desc.style.color = "#aabbbb"
                            pluginBox.appendChild(document.createElement("br"))
                            pluginBox.appendChild(document.createElement("hr"))
                            `
							);
						});
					}
				});

				// build home feed
				win.webContents.executeJavaScript(`
                setTimeout(() => {
                    const left_widget_container = document.querySelector('div.p-2.sidebar.left.space-y-2');
                    left_widget_container.style.maxWidth = '30vw'
                    left_widget_container.style.width = '21rem'
                    left_widget_container.style.bottom = '50px'
                    const news_feed_box = document.querySelector('div.p-2.sidebar.right.space-y-2 > div:nth-child(3)').cloneNode(true);
                    left_widget_container.appendChild(news_feed_box)
                    const tutorial_box = document.querySelector('div.p-2.sidebar.right.space-y-2 > div:nth-child(3)').cloneNode(true);
                    left_widget_container.appendChild(tutorial_box)
                }, 2000)

                setTimeout(() => {
                    document.querySelector('div.p-2.sidebar.left.space-y-2 > div:nth-child(3) > div.title').innerText = 'Blockyfish News'
                    document.querySelector('div.p-2.sidebar.left.space-y-2 > div:nth-child(3) > div:nth-child(2)').outerHTML = '<div id="blockyfish-news"></div>'
                    const blockyfish_news = document.getElementById('blockyfish-news')
                    blockyfish_news.style.maxHeight = '30vh'
                    blockyfish_news.style.overflow = 'scroll'
                    blockyfish_news.style.overflowX = 'hidden'
                    blockyfish_news.style.padding = '10px'
                    blockyfish_news.style.fontSize = 'small'
    
                    async function getBlockyfishNews() {
                        let news = await(await(fetch('https://blockyfish.netlify.app/blockyfishfeed/news'))).text()
                        blockyfish_news.innerHTML = news
                    }
                    getBlockyfishNews()

                    document.querySelector('div.p-2.sidebar.left.space-y-2 > div:nth-child(4) > div.title').innerText = 'How to play'
                    document.querySelector('div.p-2.sidebar.left.space-y-2 > div:nth-child(4) > div:nth-child(2)').outerHTML = '<div id="tutorial"></div>'
                    const tutorial = document.getElementById('tutorial')
                    tutorial.style.maxHeight = '30vh'
                    tutorial.style.overflow = 'scroll'
                    tutorial.style.overflowX = 'hidden'
                    tutorial.style.padding = '10px'
                    tutorial.style.fontSize = 'small'
    
                    async function getBlockyfishTutorial() {
                        let tut = await(await(fetch('https://blockyfish.netlify.app/blockyfishfeed/tutorial'))).text()
                        tutorial.innerHTML = tut
                    }
                    getBlockyfishTutorial()
                }, 2100)
                `);

				// build asset swapper modal
				win.webContents.executeJavaScript(`
                const aswp_style = document.createElement('style')
                document.querySelector('head').appendChild(aswp_style)
                aswp_style.innerHTML = '.button{display:inline-flex;justify-content:center;align-items:center;line-height:1;height:32px;white-space:nowrap;cursor:pointer;text-align:center;box-sizing:border-box;outline:0;transition:.1s;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;vertical-align:middle;-webkit-appearance:none;min-height:2.5rem;border-radius:.25rem;padding:.75rem 1.25rem;font-size:.875rem}.box-x-close{position:absolute;top:.3rem;right:.5rem}body .aswp-button{border-bottom-width:4px;border-radius:1rem}.aswp-gre{background-color:#ef4444;border-color:#dc2626}.aswp-gre:hover{background-color:#dc2626;border-color:#b91c1c}.aswp-black{background-color:#6b7280;border-color:#4b5563}.aswp-black:hover{background-color:#4b5563;border-color:#374151}.aswp-box.active{outline:white solid 1px;filter:brightness(100%)}.aswp-modal{background-color:#1f2937;border:2px solid #374151;border-radius:.75rem;width:300px;height:200px}.aswp-core{top:5px;right:5px;border:1px solid #fff;border-radius:25px;font-size:14px}#aswp-main{flex-wrap:wrap;width:88%;height:100%;margin:auto;gap:15px}.aswp-hidden{opacity:0;pointer-events:none}#aswp-modal{transition:opacity .2s}'
                const aswp_div = document.createElement('div')
                document.getElementById('app').appendChild(aswp_div)
                aswp_div.outerHTML = '<div style="z-index: 100;" class="w-screen h-screen absolute" id="aswp-modal"> <div style="background-color: rgba(0,0,0,.5);" class="w-full h-full absolute"></div><div class="w-full h-full absolute flex justify-center items-center"> <div class="flex flex-col aswp-modal relative"> <div style="font-size: 1.3rem" class="text-center py-2">Asset Swapper</div><button class="aswp-close box-x-close"><svg width="1.125em" height="1.125em" viewBox="0 0 24 24" class="svg-icon" color="gray" style="--sx:1; --sy:1; --r:0deg;"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" fill="currentColor"></path></svg></button> <div style="flex: 1;" class="text-center"> <div class="p-4 flex" id="aswp-main"></div></div><div class="text-center py-4"> <div class="button aswp-button aswp-black aswp-close">Ok</div></div></div></div></div>'
                const aswpMain = document.getElementById("aswp-main")
                const aswpBox = document.createElement("div")
                aswpMain.appendChild(aswpBox)
                aswpBox.outerHTML = '<input id="aswp-input" style="padding: 5px;border-radius: 5px;height: 35px;background-color: #0003;margin: auto;text-align: center;" placeholder="Input skin ID">'
                const aswpCloses = document.getElementsByClassName("aswp-close")
                const aswpModal = document.getElementById("aswp-modal")
                aswpModal.classList.toggle("aswp-hidden")
                function toggleAswp() {
                    aswpModal.classList.toggle("aswp-hidden")
                    game.currentScene.myAnimal.setSkin(document.getElementById('aswp-input').value)
                }
                document.getElementById('aswp-input').addEventListener("input", () => {
                    game.currentScene.myAnimal.setSkin(document.getElementById('aswp-input').value)
                })
                for (const aswpClose of aswpCloses) {
                    aswpClose.addEventListener("click", () => {
                        toggleAswp()
                    })
                }
                `);

				// css for quick chat
				win.webContents.executeJavaScript(`
                const qc_style = document.createElement('style')
                document.querySelector('head').appendChild(qc_style)
                qc_style.innerHTML = '#quick-chat-container{width:600px;min-height:360px;display:flex;flex-direction:column;position:absolute}.quick-chat.row{display:flex;flex-direction:row;height:100px}.quick-chat.one{justify-content:center}.quick-chat.two{justify-content:space-between}.quick-chat>div{width:180px;height:100px;background-color:#0006;border-radius:10px;display:flex;padding:5px;opacity:.8}.quick-chat>div:hover{opacity:1;box-shadow:0 0 .5rem rgb(255 255 255 / 50%)}.quick-chat>div>p{text-align:center;width:100%;margin:auto;color:#fff;overflow-wrap:break-word}'
                `);

				//build titlebar to drag window around
				win.webContents.executeJavaScript(`
                const drag = document.createElement('div')
                document.querySelector('#app > div.ui > div').appendChild(drag)
                drag.outerHTML = '<div style="-webkit-app-region: drag;width: 100vw;height: 20px;position: absolute;top: 0;left: 0;cursor: move;"></div>'
                `);

				//website and github button on top right menu
				win.webContents.executeJavaScript(`
                const discord_old_parent_clone = document.querySelector('#app > div.ui > div > div.el-row.header.justify-between.flex-nowrap > div:nth-child(2) > div > div:nth-child(5)').cloneNode(true)
                const discord_old_parent = document.querySelector('#app > div.ui > div > div.el-row.header.justify-between.flex-nowrap > div:nth-child(2) > div > div:nth-child(5)')
                const github_parent = document.querySelector('#app > div.ui > div > div.el-row.header.justify-between.flex-nowrap > div:nth-child(2) > div > div:nth-child(5)').cloneNode(true)
                const website_parent = document.querySelector('#app > div.ui > div > div.el-row.header.justify-between.flex-nowrap > div:nth-child(2) > div > div:nth-child(5)').cloneNode(true)
                const newtab_parent = document.querySelector('#app > div.ui > div > div.el-row.header.justify-between.flex-nowrap > div:nth-child(2) > div > div:nth-child(5)').cloneNode(true)
                const social_class = document.querySelector('#app > div.ui > div > div.el-row.header.justify-between.flex-nowrap > div:nth-child(2) > div')
                
                social_class.insertBefore(discord_old_parent_clone, social_class.children[5])
                discord_old_parent.remove()
                const discord = document.querySelector('#app > div.ui > div > div.el-row.header.justify-between.flex-nowrap > div:nth-child(2) > div > div:nth-child(5) > button')
                discord.classList.remove("black")
                discord.classList.add("indigo")
                discord.addEventListener("click", () => {
                    window.open('https://discord.gg/W3TU4kqD5f')
                })

                social_class.insertBefore(github_parent, social_class.children[5])
                social_class.insertBefore(website_parent, social_class.children[6])
                social_class.appendChild(newtab_parent)
                github_parent.classList.add('github-div')
                website_parent.classList.add('website-div')
                newtab_parent.classList.add('newtab-div')
                const github = document.querySelector('div.github-div > button')
                const website = document.querySelector('div.website-div > button')
                const newtab = document.querySelector('div.newtab-div > button')
                const github_logo = document.querySelector('div.github-div > button > span > svg')
                const website_logo = document.querySelector('div.website-div > button > span > svg')
                const newtab_logo = document.querySelector('div.newtab-div > button > span > svg')
                github_logo.outerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-question-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.496 6.033h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286a.237.237 0 0 0 .241.247zm2.325 6.443c.61 0 1.029-.394 1.029-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94 0 .533.425.927 1.01.927z"/></svg>'
                website_logo.outerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-globe" viewBox="0 0 16 16"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm7.5-6.923c-.67.204-1.335.82-1.887 1.855A7.97 7.97 0 0 0 5.145 4H7.5V1.077zM4.09 4a9.267 9.267 0 0 1 .64-1.539 6.7 6.7 0 0 1 .597-.933A7.025 7.025 0 0 0 2.255 4H4.09zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a6.958 6.958 0 0 0-.656 2.5h2.49zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5H4.847zM8.5 5v2.5h2.99a12.495 12.495 0 0 0-.337-2.5H8.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5H4.51zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5H8.5zM5.145 12c.138.386.295.744.468 1.068.552 1.035 1.218 1.65 1.887 1.855V12H5.145zm.182 2.472a6.696 6.696 0 0 1-.597-.933A9.268 9.268 0 0 1 4.09 12H2.255a7.024 7.024 0 0 0 3.072 2.472zM3.82 11a13.652 13.652 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5H3.82zm6.853 3.472A7.024 7.024 0 0 0 13.745 12H11.91a9.27 9.27 0 0 1-.64 1.539 6.688 6.688 0 0 1-.597.933zM8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855.173-.324.33-.682.468-1.068H8.5zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.65 13.65 0 0 1-.312 2.5zm2.802-3.5a6.959 6.959 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5h2.49zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7.024 7.024 0 0 0-3.072-2.472c.218.284.418.598.597.933zM10.855 4a7.966 7.966 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4h2.355z"/></svg>'
                newtab_logo.outerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-window-plus" viewBox="0 0 16 16"><path d="M2.5 5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1ZM4 5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Zm2-.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z"/><path d="M0 4a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v4a.5.5 0 0 1-1 0V7H1v5a1 1 0 0 0 1 1h5.5a.5.5 0 0 1 0 1H2a2 2 0 0 1-2-2V4Zm1 2h13V4a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v2Z"/><path d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-3.5-2a.5.5 0 0 0-.5.5v1h-1a.5.5 0 0 0 0 1h1v1a.5.5 0 0 0 1 0v-1h1a.5.5 0 0 0 0-1h-1v-1a.5.5 0 0 0-.5-.5Z"/></svg>'
                github.classList.remove("black")
                github.classList.add("blue")
                github.addEventListener("click", () => {
                    window.open('https://docs-blockyfish.netlify.app')
                })
                website.classList.remove("black")
                website.classList.add("pink")
                website.addEventListener("click", () => {
                    window.open('https://blockyfish.netlify.app')
                })
                newtab.addEventListener("click", () => {
                    console.log('CREATE_A_NEW_WINDOW')
                })
                `);

				//build updater button
				win.webContents.executeJavaScript(`
                //updater button
                const update_parent = document.querySelector('#app > div.ui > div > div.el-row.header.justify-between.flex-nowrap > div:nth-child(2) > div > div:nth-child(5)').cloneNode(true);
                social_class.appendChild(update_parent);
                update_parent.classList.add('update-div')
                const update = document.querySelector('div.update-div > button')
                const update_logo = document.querySelector('div.update-div > button > span > svg')
                update.classList.remove("indigo")
                update.classList.add("green", "update", "updater-close")
                update_logo.outerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-clockwise" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg>'
                const update_notif_div = document.createElement('div')
                update.appendChild(update_notif_div)
                update_notif_div.outerHTML = '<div id="update-notif" style="width: 10px;height: 10px;position: absolute;background: #f00;right: -1px;bottom: -4px;border-radius: 10px; display:none;"></div>'
                `);

				//fetch settings
				win.webContents.executeJavaScript(`docassets_on = ` + docassets);
				win.webContents.executeJavaScript(`ublock_on = ` + ublock);
				win.webContents.executeJavaScript(`rpc_on = ` + rpc);
				win.webContents.executeJavaScript(`twemoji_on = ` + twemoji);
				win.webContents.executeJavaScript(`theme_on = ` + theme);
				win.webContents.executeJavaScript(`v3ui_on = ` + v3ui);
				win.webContents.executeJavaScript(`aim_helper_on = ` + aim_helper);

				//build custom settings item
				win.webContents.executeJavaScript(
					`
                //detect modal changes
                var observer = new MutationObserver(function (mutations) {
                    mutations.forEach(function (mutation) {
                        if (mutation.addedNodes.length > 0) {
                            mutation.addedNodes.forEach(function (addednode) {
                                    console.log("Modal Added:" + addednode);
                            });
                        }else if (mutation.removedNodes.length > 0) {
                            mutation.removedNodes.forEach(function (removednode) {
                                console.log("Modal Removed:" + removednode)
                            });
                        }
                    });
                });
                    
                observer.observe(document.querySelector('#app > div.modals-container'), {
                    childList: true, 
                });
    
                //define function for building custom items
                function buildCustomSettingsItems(qc1, qc2, qc3, qc4, spam_chat) {
                    if (document.getElementById('pane-0') != null) {
                        //restart tooltip
                        var modal_parent = document.querySelector('#app > div.modals-container > div > div.vfm__container.vfm--absolute.vfm--inset.vfm--outline-none.modal-container > div')
                        var restart_tooltip = document.querySelector('#pane-2 > form > p.help-note').cloneNode(true)
                        modal_parent.insertBefore(restart_tooltip, modal_parent.children[2])
                        restart_tooltip.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="10" fill="currentColor" class="bi bi-exclamation-triangle" viewBox="0 0 16 16"><path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"></path><path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z"></path></svg> Changes will take effect the next time you launch blockyfish client'
                        restart_tooltip.style.alignSelf = 'center'
                        restart_tooltip.style.color = '#f77'
                        restart_tooltip.style.display = 'none'
    
                        //docassets
                        var docassets_div = document.querySelector('#pane-0 > form > div:nth-child(3)').cloneNode(true)
                        document.querySelector('#pane-0 > form').appendChild(docassets_div)
                        const docassets_text = document.querySelector('#pane-0 > form > div:nth-child(4) > div.el-form-item__label')
                        docassets_text.innerText = 'Doc-assets'
                        const docassets_desc = document.querySelector('#pane-0 > form > div:nth-child(4) > div.el-form-item__content > span')
                        docassets_desc.innerText = 'Cute asset pack made by Doctorpus'
                        if (docassets_on == false) {
                            document.querySelector('#pane-0 > form > div:nth-child(4) > div.el-form-item__content > label > span.el-checkbox__input').classList.remove('is-checked')
                        }
                        else {
                            document.querySelector('#pane-0 > form > div:nth-child(4) > div.el-form-item__content > label > span.el-checkbox__input').classList.add('is-checked')
                        }
                        document.querySelector('#pane-0 > form > div:nth-child(4) > div.el-form-item__content > label > span.el-checkbox__input > input').addEventListener("click", () => {
                            restart_tooltip.style.display = 'block'
                            if (docassets_on == true) {
                                document.querySelector('#pane-0 > form > div:nth-child(4) > div.el-form-item__content > label > span.el-checkbox__input').classList.remove('is-checked')
                                console.log('store_settings: docassets0')
                                docassets_on = false
                            }
                            else {
                                document.querySelector('#pane-0 > form > div:nth-child(4) > div.el-form-item__content > label > span.el-checkbox__input').classList.add('is-checked')
                                console.log('store_settings: docassets1')
                                docassets_on = true
                            }
                        })
    
                        //twemoji
                        var twemoji_div = document.querySelector('#pane-0 > form > div:nth-child(3)').cloneNode(true)
                        document.querySelector('#pane-0 > form').appendChild(twemoji_div)
                        const twemoji_text = document.querySelector('#pane-0 > form > div:nth-child(5) > div.el-form-item__label')
                        twemoji_text.innerText = 'Twemoji'
                        const twemoji_desc = document.querySelector('#pane-0 > form > div:nth-child(5) > div.el-form-item__content > span')
                        twemoji_desc.innerHTML = "Emojis used in Discord and Twitter<br>Doesn't work in-game"
                        if (twemoji_on == false) {
                            document.querySelector('#pane-0 > form > div:nth-child(5) > div.el-form-item__content > label > span.el-checkbox__input').classList.remove('is-checked')
                        }
                        else {document.querySelector('#pane-0 > form > div:nth-child(5) > div.el-form-item__content > label > span.el-checkbox__input').classList.add('is-checked')
    
                        }
                        document.querySelector('#pane-0 > form > div:nth-child(5) > div.el-form-item__content > label > span.el-checkbox__input > input').addEventListener("click", () => {
                            restart_tooltip.style.display = 'block'
                            if (twemoji_on == true) {
                                document.querySelector('#pane-0 > form > div:nth-child(5) > div.el-form-item__content > label > span.el-checkbox__input').classList.remove('is-checked')
                                console.log('store_settings: twemoji0')
                                twemoji_on = false
                            }
                            else {
                                document.querySelector('#pane-0 > form > div:nth-child(5) > div.el-form-item__content > label > span.el-checkbox__input').classList.add('is-checked')
                                console.log('store_settings: twemoji1')
                                twemoji_on = true
                            }
                        })

                        //custom theme
                        var theme_div = document.querySelector('#pane-0 > form > div:nth-child(3)').cloneNode(true)
                        document.querySelector('#pane-0 > form').appendChild(theme_div)
                        const theme_text = document.querySelector('#pane-0 > form > div:nth-child(6) > div.el-form-item__label')
                        theme_text.innerText = 'Theme'
                        const theme_desc = document.querySelector('#pane-0 > form > div:nth-child(6) > div.el-form-item__content > span')
                        theme_desc.innerHTML = "Custom theme"
                        if (theme_on == false) {
                            document.querySelector('#pane-0 > form > div:nth-child(6) > div.el-form-item__content > label > span.el-checkbox__input').classList.remove('is-checked')
                        }
                        else {document.querySelector('#pane-0 > form > div:nth-child(6) > div.el-form-item__content > label > span.el-checkbox__input').classList.add('is-checked')
    
                        }
                        document.querySelector('#pane-0 > form > div:nth-child(6) > div.el-form-item__content > label > span.el-checkbox__input > input').addEventListener("click", () => {
                            // restart_tooltip.style.display = 'block'
                            if (theme_on == true) {
                                document.querySelector('#pane-0 > form > div:nth-child(6) > div.el-form-item__content > label > span.el-checkbox__input').classList.remove('is-checked')
                                console.log('store_settings: theme0')
                                theme_on = false
                                document.getElementById('customcss').href = ""
                            }
                            else {
                                document.querySelector('#pane-0 > form > div:nth-child(6) > div.el-form-item__content > label > span.el-checkbox__input').classList.add('is-checked')
                                console.log('store_settings: theme1')
                                theme_on = true
                                document.getElementById('customcss').href = "https://blockyfish.netlify.app/themes/reefpenguin/theme.css"
                            }
                        })

                        //v3 UI
                        var v3ui_div = document.querySelector('#pane-0 > form > div:nth-child(3)').cloneNode(true)
                        document.querySelector('#pane-0 > form').appendChild(v3ui_div)
                        const v3ui_text = document.querySelector('#pane-0 > form > div:nth-child(7) > div.el-form-item__label')
                        v3ui_text.innerText = 'Legacy UI'
                        const v3ui_desc = document.querySelector('#pane-0 > form > div:nth-child(7) > div.el-form-item__content > span')
                        v3ui_desc.innerHTML = "Brings the old v3 UI back to v4. XP bar and boost bars are restored to their old v3 positions. "
                        if (v3ui_on == false) {
                            document.querySelector('#pane-0 > form > div:nth-child(7) > div.el-form-item__content > label > span.el-checkbox__input').classList.remove('is-checked')
                        }
                        else {document.querySelector('#pane-0 > form > div:nth-child(7) > div.el-form-item__content > label > span.el-checkbox__input').classList.add('is-checked')
    
                        }
                        document.querySelector('#pane-0 > form > div:nth-child(7) > div.el-form-item__content > label > span.el-checkbox__input > input').addEventListener("click", () => {
                            // restart_tooltip.style.display = 'block'
                            if (v3ui_on == true) {
                                document.querySelector('#pane-0 > form > div:nth-child(7) > div.el-form-item__content > label > span.el-checkbox__input').classList.remove('is-checked')
                                console.log('store_settings: v3ui0')
                                v3ui_on = false
                                document.getElementById('v3uicss').href = ""
                            }
                            else {
                                document.querySelector('#pane-0 > form > div:nth-child(7) > div.el-form-item__content > label > span.el-checkbox__input').classList.add('is-checked')
                                console.log('store_settings: v3ui1')
                                v3ui_on = true
                                document.getElementById('v3uicss').href = "https://blockyfish.netlify.app/themes/addon/v3ui.css"
                            }
                        })

                        //aim helper
                        var aim_helper_div = document.querySelector('#pane-0 > form > div:nth-child(3)').cloneNode(true)
                        document.querySelector('#pane-0 > form').appendChild(aim_helper_div)
                        const aim_helper_text = document.querySelector('#pane-0 > form > div:nth-child(8) > div.el-form-item__label')
                        aim_helper_text.innerText = 'Aim shot helper'
                        const aim_helper_desc = document.querySelector('#pane-0 > form > div:nth-child(8) > div.el-form-item__content > span')
                        aim_helper_desc.innerHTML = "Shows a line that shows the trajectory of your projectile. Works on goblin shark, japanese spider crab, sea otter, and archerfish. "
                        if (aim_helper_on == false) {
                            document.querySelector('#pane-0 > form > div:nth-child(8) > div.el-form-item__content > label > span.el-checkbox__input').classList.remove('is-checked')
                        }
                        else {document.querySelector('#pane-0 > form > div:nth-child(8) > div.el-form-item__content > label > span.el-checkbox__input').classList.add('is-checked')
    
                        }
                        document.querySelector('#pane-0 > form > div:nth-child(8) > div.el-form-item__content > label > span.el-checkbox__input > input').addEventListener("click", () => {
                            restart_tooltip.style.display = 'block'
                            if (aim_helper_on == true) {
                                document.querySelector('#pane-0 > form > div:nth-child(8) > div.el-form-item__content > label > span.el-checkbox__input').classList.remove('is-checked')
                                console.log('store_settings: aim_helper0')
                                aim_helper_on = false
                            }
                            else {
                                document.querySelector('#pane-0 > form > div:nth-child(8) > div.el-form-item__content > label > span.el-checkbox__input').classList.add('is-checked')
                                console.log('store_settings: aim_helper1')
                                aim_helper_on = true
                            }
                        })
                        
                        //ublock
                        var ublock_div = document.querySelector('#pane-0 > form > div:nth-child(3)').cloneNode(true)
                        document.querySelector('#pane-2 > form').appendChild(ublock_div)
                        const ublock_text = document.querySelector('#pane-2 > form > div:nth-child(3) > div.el-form-item__label')
                        ublock_text.innerText = 'Adblock'
                        const ublock_desc = document.querySelector('#pane-2 > form > div:nth-child(3) > div.el-form-item__content > span')
                        ublock_desc.innerText = 'Shows ads and support fede'
                        if (ublock_on == false) {
                            document.querySelector('#pane-2 > form > div:nth-child(3) > div.el-form-item__content > label > span.el-checkbox__input').classList.remove('is-checked')
                        }
                        else {
                            document.querySelector('#pane-2 > form > div:nth-child(3) > div.el-form-item__content > label > span.el-checkbox__input').classList.add('is-checked')
                        }
                        document.querySelector('#pane-2 > form > div:nth-child(3) > div.el-form-item__content > label > span.el-checkbox__input > input').addEventListener("click", () => {
                            restart_tooltip.style.display = 'block'
                            if (ublock_on == true) {
                                document.querySelector('#pane-2 > form > div:nth-child(3) > div.el-form-item__content > label > span.el-checkbox__input').classList.remove('is-checked')
                                console.log('store_settings: ublock0')
                                ublock_on = false
                            }
                            else {
                                document.querySelector('#pane-2 > form > div:nth-child(3) > div.el-form-item__content > label > span.el-checkbox__input').classList.add('is-checked')
                                console.log('store_settings: ublock1')
                                ublock_on = true
                            }
                        })

                        //rpc
                        var rpc_div = document.querySelector('#pane-0 > form > div:nth-child(3)').cloneNode(true)
                        document.querySelector('#pane-2 > form').appendChild(rpc_div)
                        const rpc_text = document.querySelector('#pane-2 > form > div:nth-child(4) > div.el-form-item__label')
                        rpc_text.innerText = 'Discord RPC'
                        const rpc_desc = document.querySelector('#pane-2 > form > div:nth-child(4) > div.el-form-item__content > span')
                        rpc_desc.innerText = 'Display your status on Discord as "Playing Deeeep.io"'
                        if (rpc_on == false) {
                            document.querySelector('#pane-2 > form > div:nth-child(4) > div.el-form-item__content > label > span.el-checkbox__input').classList.remove('is-checked')
                        }
                        else {
                            document.querySelector('#pane-2 > form > div:nth-child(4) > div.el-form-item__content > label > span.el-checkbox__input').classList.add('is-checked')
                        }
                        document.querySelector('#pane-2 > form > div:nth-child(4) > div.el-form-item__content > label > span.el-checkbox__input > input').addEventListener("click", () => {
                            // restart_tooltip.style.display = 'block'
                            if (rpc_on == true) {
                                document.querySelector('#pane-2 > form > div:nth-child(4) > div.el-form-item__content > label > span.el-checkbox__input').classList.remove('is-checked')
                                console.log('store_settings: rpc0')
                                console.log('TURN_DISCORD_RPC_OFF_REQUEST')
                                rpc_on = false
                            }
                            else {
                                document.querySelector('#pane-2 > form > div:nth-child(4) > div.el-form-item__content > label > span.el-checkbox__input').classList.add('is-checked')
                                console.log('store_settings: rpc1')
                                console.log('TURN_DISCORD_RPC_ON_REQUEST')
                                rpc_on = true
                            }
                        })
    
                        //version info
                        var settings_version = document.querySelector('#pane-2 > form > p.help-note').cloneNode(true)
                        modal_parent.appendChild(settings_version)
                        settings_version.innerHTML = 'Deeeep.io ' + document.querySelector("#app > div.ui > div > div.first > div > div > div > div.play-game > div.relative > span").innerText + '<br>Blockyfish client ` +
						version_code +
						`'
                        settings_version.style.position = 'absolute'
                        settings_version.style.bottom = '10px'
                        settings_version.style.left = '10px'
    
                        //settings panel sizing
                        var settings_modal = document.querySelector('#app > div.modals-container > div > div.vfm__container.vfm--absolute.vfm--inset.vfm--outline-none.modal-container > div')
                        settings_modal.style.width = '80vw'
                        settings_modal.style.maxWidth = '500px'
    
                        // quick chat messages
                        var qc_settings_main = document.createElement('div')
                        document.querySelector('#pane-1 > form').appendChild(qc_settings_main)
                        qc_settings_main.outerHTML = '<div class="el-form-item"><label class="el-form-item__label">Quick chat #1</label><input maxlength="100" class="el-input__wrapper" autocomplete="off" tabindex="0" placeholder="Enter a message" id="qc-msg-1" value="' + qc1 + '"></div><div class="el-form-item"><label class="el-form-item__label">Quick chat #2</label><input maxlength="100" class="el-input__wrapper" autocomplete="off" tabindex="0" placeholder="Enter a message" id="qc-msg-2"value="' + qc2 + '"></div><div class="el-form-item"><label class="el-form-item__label">Quick chat #3</label><input maxlength="100" class="el-input__wrapper" autocomplete="off" tabindex="0" placeholder="Enter a message" id="qc-msg-3"value="' + qc3 + '"></div><div class="el-form-item"><label class="el-form-item__label">Quick chat #4</label><input maxlength="100" class="el-input__wrapper" autocomplete="off" tabindex="0" placeholder="Enter a message" id="qc-msg-4" value="' + qc4 + '"></div><div class="el-form-item"><label class="el-form-item__label">Chat spam message</label><input maxlength="100" class="el-input__wrapper" autocomplete="off" tabindex="0" placeholder="Enter a message" id="qc-msg-spam" value="' + spam_chat + '"></div>'
                        document.getElementById('qc-msg-1').addEventListener("change", () => {
                            console.log("qc_ms_1: " + document.getElementById('qc-msg-1').value)
                        })
                        document.getElementById('qc-msg-2').addEventListener("change", () => {
                            restart_tooltip.style.display = 'block'
                            console.log("qc_ms_2: " + document.getElementById('qc-msg-2').value)
                        })
                        document.getElementById('qc-msg-3').addEventListener("change", () => {
                            restart_tooltip.style.display = 'block'
                            console.log("qc_ms_3: " + document.getElementById('qc-msg-3').value)
                        })
                        document.getElementById('qc-msg-4').addEventListener("change", () => {
                            restart_tooltip.style.display = 'block'
                            console.log("qc_ms_4: " + document.getElementById('qc-msg-4').value)
                        })
                        document.getElementById('qc-msg-spam').addEventListener("change", () => {
                            restart_tooltip.style.display = 'block'
                            console.log("qc_ms_spam: " + document.getElementById('qc-msg-spam').value)
                        })
                    }
                }
                `
				);

				//build updater modal
				win.webContents.executeJavaScript(`
                //updater modal
                //styles
                const updater_style = document.createElement('style')
                document.querySelector('head').appendChild(updater_style)
                updater_style.innerHTML = '.button{display:inline-flex;justify-content:center;align-items:center;line-height:1;height:32px;white-space:nowrap;cursor:pointer;text-align:center;box-sizing:border-box;outline:0;transition:.1s;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;vertical-align:middle;-webkit-appearance:none;min-height:2.5rem;border-radius:.25rem;padding:.75rem 1.25rem;font-size:.875rem}.box-x-close{position:absolute;top:.3rem;right:.5rem}.updater-green{background-color:#10b981;border-color:#059669}.updater-green:hover{background-color:#059669;border-color:#047857}.updater-blue{background-color:#3b82f6;border-color:#2563eb}.updater-blue:hover{background-color:#2563eb;border-color:#1d4ed8}.updater-black:hover,.updater-disabled{background-color:#4b5563;border-color:#374151}.updater-disabled{color:#9ca3af;pointer-events:none}.updater-black{background-color:#6b7280;border-color:#4b5563}body .updater-button{border-bottom-width:4px;border-radius:1rem}.updater-box.active{outline:white solid 2px;filter:brightness(100%)}.updater-modal{background-color:#1f2937;border:2px solid #374151;border-radius:.75rem;width:300px}@media screen and (min-width:768px){.updater-modal{background-color:#1f2937;border:2px solid #374151;border-radius:.75rem;width:400px}}.updater-core{top:5px;right:5px;border:1px solid #fff;border-radius:25px;font-size:14px}#updater-main{justify-content:center;flex-wrap:wrap;width:88%;margin:auto;gap:15px;flex-direction:column;align-items:center}.updater-hidden{opacity:0;pointer-events:none}#updater-modal{transition:opacity .2s}#update-available{margin:10px;width:88%;background:#fff2;border-radius:10px;display:flex;flex-direction:row;align-items:center;padding:10px;justify-content:space-between}'
                //main div
                const updater_div = document.createElement('div')
                document.getElementById('app').appendChild(updater_div)
                updater_div.outerHTML = '<div style="z-index: 100;" class="w-screen h-screen absolute" id="updater-modal"> <div style="background-color: rgba(0,0,0,.5);" class="w-full h-full absolute"></div><div class="w-full h-full absolute flex justify-center items-center"> <div class="flex flex-col updater-modal relative"> <div style="font-size: 1.3rem" class="text-center py-2">Updater</div><button class="updater-close box-x-close"><svg width="1.125em" height="1.125em" viewBox="0 0 24 24" class="svg-icon" color="gray" style="--sx:1; --sy:1; --r:0deg;"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" fill="currentColor"></path></svg></button> <div style="flex: 1;" class="text-center"> <div class="p-4 flex" id="updater-main"></div></div><div class="text-center py-4"><div id="updater-load" class="button updater-button updater-green" style="margin-right: 10px;">Check for Updates</div><div class="button updater-button updater-black updater-close">Close</div></div></div></div></div>'
                const updaterMain = document.getElementById("updater-main")
                const updaterBox = document.createElement("div")
                updaterMain.appendChild(updaterBox)
                updaterBox.outerHTML = '<div style="display:none" id="update-available"><p id="update-available-text">Update available</p><div id="updater-download" class="button updater-button updater-blue">Install</div></div><p id="updater-text">No updates available</p><svg id="updater-icon" xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="#374151" class="bi bi-arrow-clockwise" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"></path><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"></path></svg>'
                const updateButton = document.getElementById("updater-load")
                const updateImg = document.getElementById("updater-icon")
                const updateText = document.getElementById("updater-text")
                const updateDownloadButton = document.getElementById("updater-download")
                const updateAvailableDiv = document.getElementById("update-available")
                const updateAvailableText = document.getElementById("update-available-text")
                const updaterCloses = document.getElementsByClassName("updater-close")
                const updaterModal = document.getElementById("updater-modal")
                updaterModal.classList.toggle("updater-hidden")
                function resetModal() {
                    updateText.style.display = 'block'
                    updateImg.style.display = 'block'
                    updateAvailableDiv.style.display = 'none'
                    updateDownloadButton.classList.remove('updater-disabled')
                }
                for (const updaterClose of updaterCloses) {
                  updaterClose.addEventListener("click", () => {
                    updaterModal.classList.toggle("updater-hidden")
                    updateText.innerText = 'No updates available'
                  })
                }
                `);

				//i love spinny things so there's a spinny feature in the updater :D
				// also update checking and downloading
				// and auto update check
				win.webContents.executeJavaScript(
					`
                function matches(text, partial) {
                    try {
                        return text.toLowerCase().indexOf(partial.toLowerCase()) > -1;
                    } catch (e) {
                        console.log('uh oh')
                    }
                }
                async function spinUpdateIcon() {
                    setTimeout(function() {
                        updateImg.style.transition = '3s transform ease-in-out'
                        updateImg.style.transform = 'rotateZ(1440deg)'
                        setTimeout(function() {
                            updateImg.style.transition = 'none'
                            updateImg.style.transform = 'rotateZ(0deg)'
                        }, 3000)
                    }, 100)
                }
                async function getUpdates() {
                    updateText.innerText = 'Checking for updates...'
                    Name = "unknown"
                    if (navigator.appVersion.indexOf("Win") != -1) Name = "win";
                    if (navigator.appVersion.indexOf("Mac") != -1) Name = "mac";
                    if (navigator.appVersion.indexOf("Linux") != -1) Name = "linux";
                    let url_json = await (await (fetch('https://api.github.com/repos/nostopgmaming17/blockyfish-thej/releases/latest'))).json();
                    for (let i = 0; i < url_json.assets.length; i++) {
                        if (matches(url_json.assets[i].name, Name)) {
                            var download_url = url_json.assets[i].browser_download_url
                            var download_ver = url_json.tag_name
                        }
                    }
                    var ver_num = download_ver.replace(/[v\.]/g,"")
                    setTimeout(function() {
                        if (ver_num != ` +
						version_num +
						`) {
                            updateText.style.display = 'none'
                            updateImg.style.display = 'none'
                            updateAvailableDiv.style.display = 'flex'
                            updateAvailableText.outerHTML = '<p id="download-percent" style="text-align: left;">Update available<br><span style="color: #aaa">` +
						version_code +
						` -&gt; ' + download_ver + '</span></p>'
                            downloadPercentText = document.getElementById('download-percent')
                            document.getElementById('update-notif').style.display = 'block'
                            updateDownloadButton.addEventListener("click", () => {
                                if (updateDownloadButton.disabled != true) {
                                    // window.open(download_url)
                                    console.log("request_download: " + download_url)
                                    updateDownloadButton.classList.add('updater-disabled')
                                    updateButton.classList.add('updater-disabled')
                                }
                            })
                        }
                        else {
                            updateText.innerText = 'No updates available'
                        }
                    }, 2500)
                }
                updateButton.addEventListener("click", () => {
                    resetModal()
                    spinUpdateIcon()
                    getUpdates()
                })
                setInterval(function() {
                    spinUpdateIcon()
                    getUpdates()
                }, 60000)
                getUpdates()
                `
				);

				// autoload posts in forums
				win.webContents.executeJavaScript(`
                function isInViewport(e) {
                    const rect = e.getBoundingClientRect();
                    return (
                        rect.top >= 0 &&
                        rect.left >= 0 &&
                        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
                    );
                }
                document.querySelector('#app > div.ui > div > div.el-row.header.justify-between.flex-nowrap > div:nth-child(2) > div > div:nth-child(3) > button').addEventListener("click", () => {
                    document.querySelector('#app > div.vfm.vfm--inset.vfm--fixed.modal > div.vfm__container.vfm--absolute.vfm--inset.vfm--outline-none.modal-container > div > div > div').addEventListener("scroll", function() {
                        if (isInViewport(document.querySelector('#app > div.vfm.vfm--inset.vfm--fixed.modal > div.vfm__container.vfm--absolute.vfm--inset.vfm--outline-none.modal-container > div > div > div > div > div.footer > button'))) {
                            document.querySelector('#app > div.vfm.vfm--inset.vfm--fixed.modal > div.vfm__container.vfm--absolute.vfm--inset.vfm--outline-none.modal-container > div > div > div > div > div.footer > button').click()
                        }
                    })
                })
                `);

				// make sure aimbot script isnt run twice
				win.webContents.executeJavaScript(`
                aimBotRan = false
                `);

				//pink badge for me!!
				function insertClientOwnerBadge() {
					win.webContents.executeJavaScript(`
                    if (document.querySelector('#app > div.vfm.vfm--inset.vfm--fixed.modal > div.vfm__container.vfm--absolute.vfm--inset.vfm--outline-none.modal-container > div > div > div > div.el-row.header > div.el-col.el-col-24.auto-col.fill > div > div:nth-child(2) > img') == null) {
                        badgeParentDiv = document.querySelector('#app > div.vfm.vfm--inset.vfm--fixed.modal > div.vfm__container.vfm--absolute.vfm--inset.vfm--outline-none.modal-container > div > div > div > div.el-row.header > div.el-col.el-col-24.auto-col.fill > div')
                        clientOwnerBadge = document.createElement('div')
                        badgeParentDiv.insertBefore(clientOwnerBadge, badgeParentDiv.children[1])
                        clientOwnerBadge.outerHTML = '<div class="el-image verified-icon el-tooltip__trigger el-tooltip__trigger" style="height: 1rem;margin-right: 0.25rem;width: 1rem;"><img src="/img/verified.png" class="el-image__inner" style="filter: hue-rotate(90deg);"></div>'
                    }
                    `);
				}
				function insertClientVerifiedBadge() {
					win.webContents.executeJavaScript(`
                    if (document.querySelector('#app > div.vfm.vfm--inset.vfm--fixed.modal > div.vfm__container.vfm--absolute.vfm--inset.vfm--outline-none.modal-container > div > div > div > div.el-row.header > div.el-col.el-col-24.auto-col.fill > div > div:nth-child(2) > img') == null) {
                        badgeParentDiv = document.querySelector('#app > div.vfm.vfm--inset.vfm--fixed.modal > div.vfm__container.vfm--absolute.vfm--inset.vfm--outline-none.modal-container > div > div > div > div.el-row.header > div.el-col.el-col-24.auto-col.fill > div')
                        clientOwnerBadge = document.createElement('div')
                        badgeParentDiv.insertBefore(clientOwnerBadge, badgeParentDiv.children[1])
                        clientOwnerBadge.outerHTML = '<div class="el-image verified-icon el-tooltip__trigger el-tooltip__trigger" style="height: 1rem;margin-right: 0.25rem;width: 1rem;"><img src="/img/verified.png" class="el-image__inner" style="filter: hue-rotate(165deg);"></div>'
                    }
                    `);
				}

				//make progress bar and track download progress to keep people sane
				function setUpdateDownloadBar(percent) {
					if (percent < 100) {
						win.webContents.executeJavaScript(
							`
                        downloadPercentText.innerHTML = '<p id="download-percent" style="text-align: left;">Downloading - ` +
								percent +
								`%</p>'
                        `
						);
						win.webContents.executeJavaScript(
							`
                        updateAvailableDiv.style.backgroundImage = 'linear-gradient(90deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.34) ` +
								percent +
								`%, rgba(255,255,255,0) ` +
								percent +
								`%, rgba(255,255,255,0) 100%)'
                        `
						);
					} else {
						win.webContents.executeJavaScript(`
                        downloadPercentText.innerHTML = '<p id="download-percent" style="text-align: left;">Installing...</p>'
                        updateAvailableDiv.style.backgroundImage = ''
                        `);
					}
				}

				//autorun update after downloaded
				function runUpdateInstaller(location) {
					console.log(location);
					child(location, function (err, data) {
						if (err) {
							console.error(err);
							return;
						}

						console.log(data.toString());
					});
				}

				// pause game when switching to another window
				// annoying feature so it got commented out
				// and yeeted into unused-features-land
				// win.on('blur', () => {
				//     win.webContents.executeJavaScript(`
				//     if (document.querySelector('#app > div.ui > div').classList.contains('playing') == true) {
				//         if (document.querySelector('#app > div.ui > div').style.display == 'none') {
				//             window.dispatchEvent(new KeyboardEvent("keydown", {keyCode: 27}))
				//         }
				//     }
				//     `)
				// });

				request("https://blockyfish.netlify.app/data.json", { json: true }, (error, res, body) => {
					if (error) {
						return console.log(error);
					}

					if (!error && res.statusCode == 200) {
						var e = body = [];
						var v = body.verified;
						var t = body.verified2;
                        body.ban = [];
						// console.log(e)
						win.webContents.executeJavaScript(`
                    setInterval(async function() {
                        if (document.querySelector('div.el-row.is-align-start.user__data > div > div.mb-1.whitespace-nowrap.flex.items-center > h3') != null) {
                            console.log('user: ' + document.querySelector('div.el-row.is-align-start.user__data > div > div.mb-1.whitespace-nowrap.flex.items-center > h3').innerText)
                        }
                    }, 3000)
                    `);
					}

					// set funny variables for discord rpc
					var old_mode = "FFA";
					var old_menu = "0";
					var old_url = "https://beta.deeeep.io";

					// intercept every console log 😈🔥
					if (!global.consoleLogScriptRunning) {
						win.webContents.on("console-message", (ev, level, message, line, file) => {
							var msg = `${message}`;

							if (debug) {
								console.log(msg);
							}

							if (matches(msg, "window_action:")) {
								msg = msg.replace("window_action: ", "");
								if (msg == "max") win.maximize();
								else if (msg == "res") win.unmaximize();
								else if (msg == "min") win.minimize();
								else if (msg == "cls") win.close();
							}

							//find notification updates
							if (matches(msg, "notifs:")) {
								if (msg.length < 10) {
									const msg_num = msg.charAt(msg.length - 1);
									if (msg_num != 0) {
										win.setOverlayIcon(path.join(__dirname, "img/" + msg_num + ".png"), "Over " + msg_num + " notifications");
									} else {
										win.setOverlayIcon(null, "");
									}
								} else {
									win.setOverlayIcon(path.join(__dirname, "img/9_plus.png"), "Over 9 notifications");
								}
							}

							//find rpc update events
							if (matches(msg, "state:")) {
								var msg = msg.replace("state: ", "");
								var mode = msg.slice(0, -1);
								var menu = msg.slice(-1);
								try {
									var url = win.webContents.getURL();
								} catch (e) {
									console.log("oops");
								}
								// if (mode != old_mode || menu != old_menu || url != old_url) {
								setGameMode(mode, menu);
								old_mode = mode;
								old_menu = menu;
								old_url = url;
								// }
							}

							// download the file
							// yes, this is actually what starts the download
							// not that stupid bs 140 lines above
							if (matches(msg, "request_download:")) {
								var url = msg.replace("request_download: ", "");
								var extension = "zip";
								if (os.platform().indexOf("Win") != -1) extension = "exe";
								if (os.platform().indexOf("Mac") != -1) extension = "dmg";
								if (os.platform().indexOf("Linux") != -1) extension = "zip";
								electronDl.download(BrowserWindow.getFocusedWindow(), url, {
									directory: downloadPath,
									filename: "blockyfishclient-update-download." + extension,
									onProgress: function (progress) {
										setUpdateDownloadBar(Math.floor(progress.percent * 100));
									},
									onCompleted: function (file) {
										runUpdateInstaller(file.path);
									}
								});
							}

							// store extension related settings so they can be loaded later
							// also saves your window size and location so you dont have to adjust it everytime
							if (matches(msg, "store_settings:")) {
								var msg = msg.replace("store_settings: ", "");
								var setting_key = msg.slice(0, -1);
								var setting_value = msg.slice(-1);
								if (setting_value == 0) {
									var setting_value_bool = false;
								} else if (setting_value == 1) {
									var setting_value_bool = true;
								}
								store.set(setting_key, setting_value_bool);
							}

							//discord rpc
							if (matches(msg, "TURN_DISCORD_RPC_OFF_REQUEST")) {
								rpc = false;
							}
							if (matches(msg, "TURN_DISCORD_RPC_ON_REQUEST")) {
								rpc = true;
							}

							if (matches(msg, "NAVIGATE_TO_THIS_URL:")) {
								var msg = msg.replace("NAVIGATE_TO_THIS_URL: ", "").toLowerCase().replace("https://", "").replace("http://", "");
								if (msg.match(/^beta\.deeeep\.io(\/|\?)/)) {
									// win.webContents.loadURL("https://" + msg)
									win.webContents.executeJavaScript(
										`
                                window.location.href = "https://` +
											msg +
											`"
                                `
									);
								}
							}

							// store quick chat messages
							if (matches(msg, "qc_ms_1: ")) {
								var msg = msg.replace("qc_ms_1: ", "");
								msg = addslashes(msg);
								qc1 = msg;
							}
							if (matches(msg, "qc_ms_2: ")) {
								var msg = msg.replace("qc_ms_2: ", "");
								msg = addslashes(msg);
								qc2 = msg;
							}
							if (matches(msg, "qc_ms_3: ")) {
								var msg = msg.replace("qc_ms_3: ", "");
								msg = addslashes(msg);
								qc3 = msg;
							}
							if (matches(msg, "qc_ms_4: ")) {
								var msg = msg.replace("qc_ms_4: ", "");
								msg = addslashes(msg);
								qc4 = msg;
							}
							if (matches(msg, "qc_ms_spam: ")) {
								var msg = msg.replace("qc_ms_spam: ", "");
								msg = addslashes(msg);
								spam_chat = msg;
							}

							// send quick-chat message
							if (matches(msg, "send_chat_msg:")) {
								var msg = msg.replace("send_chat_msg: ", "");
								sendKeybinding(win, "enter");
								for (var i = 0; i < msg.length; i++) {
									sendKeybinding(win, msg[i]);
								}
								sendKeybinding(win, "enter");
								win.webContents.executeJavaScript(`quickChatTyping = false`);
							}

							// slash commands
							if (matches(msg, "handle_slash_command")) {
								sendKeybinding(win, "enter");
								sendKeybinding(win, "/");
							}

							//load custom settings
							if (matches(msg, "Modal Added:[object HTMLDivElement]")) {
								win.webContents.executeJavaScript(`buildCustomSettingsItems('` + qc1 + `', '` + qc2 + `', '` + qc3 + `', '` + qc4 + `', '` + spam_chat + `')`);
							}

							if (matches(msg, "ERR_INTERNET_DISCONNECTED")) {
								setInterval(() => {
									console.log("sjfdhgkbsdf");
								});
							}

							if (matches(msg, "RUN_TARGET_LOCK_SCRIPT")) {
								win.webContents.executeJavaScript(`
                            mapeditor = document.querySelector('#canvas-container > canvas')
                            click0 = game.currentScene.entityManager.getEntity(targetID).relatedObjects.children[2].speedMultiplierDisplay.visible;
                            setInterval(function () {
                                if (targetID != null && game.currentScene.entityManager.getEntity(targetID) != null) {
                                    click1 = game.currentScene.entityManager.getEntity(targetID).relatedObjects.children[2].speedMultiplierDisplay.visible;
                                    c = {"x": innerWidth/2 + game.currentScene.entityManager.getEntity(targetID).position.x - game.currentScene.myAnimal.position._x, "y": innerHeight/2 + game.currentScene.entityManager.getEntity(targetID).position.y - game.currentScene.myAnimal.position._y}
                                    mapeditor.dispatchEvent(new MouseEvent("pointermove", {clientX:c.x, clientY:c.y}))
                                    if (click0 != click1) {
                                        click0 = click1
                                        if (click1) {
                                            game.inputManager.spaceKeyDown()
                                        }
                                        else {
                                            game.inputManager.spaceKeyUp()
                                        }
                                    }
                                }
                            });
                            `);
							}

							if (matches(msg, "CREATE_A_NEW_WINDOW")) {
								createWindow();
							}

							if (matches(msg, "TAKE_SCREENSHOT_REQUEST_PICTURE_NOW")) {
								win.webContents.capturePage().then((image) => {
									fs.writeFile(
										downloadPath + "\\" + new Date().getFullYear() + "-" + (new Date().getMonth() + 1) + "-" + new Date().getDate() + "-" + new Date().getHours() + "-" + new Date().getMinutes() + "-" + new Date().getSeconds() + "-" + new Date().getMilliseconds() + ".png",
										image.toPNG(),
										(err) => {
											if (err) throw err;
										}
									);
								});
							}

							if (matches(msg, "REQUEST_TOGGLE_FULLSCREEN_STATE")) {
								win.setFullScreen(!win.fullScreen);
							}

							if (matches(msg, "PLUGIN_FOLDER_OPEN_NOW_REQUEST_PLEASE")) {
								shell.openPath(path.join(app.getPath("userData"), "plugins"));
							}

							// if game has loaded, inject the hacks xd
							if (matches(msg, "Common.playLoadProgress (old, new),100,0")) {
								//load plugins
								var pluginDirectoryPath = path.join(app.getPath("userData"), "plugins");
								fs.readdir(pluginDirectoryPath, function (err, files) {
									if (err) {
										return console.log("Unable to scan directory: " + err);
									}
									files.forEach(function (file) {
										var plugin = require(path.join(app.getPath("userData"), "plugins", file));
										win.webContents.executeJavaScript(plugin.script);
									});
								});
								win.webContents.executeJavaScript(`
                            setInterval(function () {
                                // TWEMOJI
                                // for names
                                if (game.currentScene.myAnimal != null) {
                                    var ownerName = game.currentScene.myAnimal.entityName
                                    if (ownerName == '') {
                                        var ownerName = 'Unnamed'
                                    }
                                    game.currentScene.myAnimal.nameObject.textStyles.default.fontFamily = "Quicksand, 'emoji'"
                                    game.currentScene.myAnimal.updateName('')
                                    game.currentScene.myAnimal.updateName(ownerName)
                                }
                                for (let i = 0; i < game.currentScene.entityManager.animalsList.length; i++) {
                                    var name = game.currentScene.entityManager.animalsList[i].entityName
                                    if (name == '') {
                                        var name = 'Unnamed'
                                    }
                                    game.currentScene.entityManager.animalsList[i].nameObject.textStyles.default.fontFamily = "Quicksand, 'emoji'"
                                    game.currentScene.entityManager.animalsList[i].updateName('')
                                    game.currentScene.entityManager.animalsList[i].updateName(name)
                                }
        
                                // for chat messages
                                for (let i = 0; i < game.currentScene.chatMessages.length; i++) {
                                    var chatMsg = game.currentScene.chatMessages[i].text._text
        
                                    game.currentScene.chatMessages[i].text.textStyles.default.fontFamily = "Quicksand, 'emoji'"
                                    game.currentScene.chatMessages[i].setText('')
                                    game.currentScene.chatMessages[i].setText(chatMsg)
                                }
                            }, 200);
    
                            /*
                            //evo wheel
                            var evo_wheel = document.createElement('div')
                            document.querySelector('div.game').insertBefore(evo_wheel, document.querySelector('div.game').children[0])
                            evo_wheel.outerHTML = '<div style="width: 100%;height: 100%;position: absolute;pointer-events: none;display: flex;"><img id="evo-wheel" draggable="false" src="https://raw.githubusercontent.com/blockyfish-client/Assets/main/evo_circle.png" style="z-index: -9999;max-width: 80vw;max-height: 80vh;align-self: center;margin: auto;transition: 0.1s all;transform: scale(0);opacity: 0;"></div>'        
                            evo_wheel = document.getElementById('evo-wheel')
        
                            evo_wheel.style.transform = 'scale(1) rotate(0deg)'
                            evo_wheel.style.transform = 'scale(0) rotate(-90deg)'
                            evo_wheel.style.transition = '.3s all'
        
                            async function preloadEvoWheel() {
                                evo_wheel.style.transform = 'scale(1) rotate(0deg)'
                                evo_wheel.style.opacity = 1
                                setTimeout(() => {
                                    evo_wheel.style.transform = 'scale(0) rotate(-90deg)'
                                    evo_wheel.style.opacity = 0
                                }, 1000)
                                setTimeout(() => {
                                    evo_wheel.style.zIndex = 9999
                                }, 1500)
                            }
        
                            preloadEvoWheel()
        
                            //Y shortcut key
                            document.body.addEventListener('keydown', function(e) {
                                if (e.isComposing || e.keyCode === 229) {
                                    return;
                                }
                                if (e.key.toLowerCase() == "y" && document.querySelector('#app > div.modals-container > div') == null && document.querySelector('#app > div.ui > div').style.display == 'none' && document.activeElement.localName != 'input') {
                                    rot = evo_wheel_rot
                                    evo_wheel.style.transform = 'scale(1) rotate(' + rot + 'deg)'
                                    evo_wheel.style.opacity = 1
                                }
                            });
                            document.body.addEventListener('keyup', function(e) {
                                if (e.key.toLowerCase() == "y") {
                                    rot = evo_wheel_rot - 90
                                    evo_wheel.style.transform = 'scale(0) rotate(' + rot + 'deg)'
                                    evo_wheel.style.opacity = 0
                                }
                            });
                            */
                            `);

								// asset swapper
								win.webContents.executeJavaScript(`
                            async function createAssetSwapButton() {
                                setInterval(function() {
                                    if (document.querySelector('div.top-right') != null) {
                                        if (!document.querySelector('#app > div.overlay > div.top-right > div.buttons.button-bar > div > button:nth-child(1) > span > svg').classList.contains('bi') && !document.querySelector('#app > div.overlay > div.top-right > div.buttons.button-bar > div > button:nth-child(2) > span > svg').classList.contains('bi')) {
                                            var aswp_button = document.querySelector('div.top-right > div.buttons.button-bar > div > button > span > div').parentElement.parentElement.cloneNode(true)
                                            var aswp_parent_div = document.querySelector('#app > div.overlay > div.top-right > div.buttons.button-bar > div')
                                            aswp_parent_div.insertBefore(aswp_button, aswp_parent_div.children[0])
                                            var aswp_svg = document.querySelector('#app > div.overlay > div.top-right > div.buttons.button-bar > div > button:nth-child(1) > span > svg')
                                            aswp_svg.outerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-layers-fill" viewBox="0 0 16 16"><path d="M7.765 1.559a.5.5 0 0 1 .47 0l7.5 4a.5.5 0 0 1 0 .882l-7.5 4a.5.5 0 0 1-.47 0l-7.5-4a.5.5 0 0 1 0-.882l7.5-4z"/><path d="m2.125 8.567-1.86.992a.5.5 0 0 0 0 .882l7.5 4a.5.5 0 0 0 .47 0l7.5-4a.5.5 0 0 0 0-.882l-1.86-.992-5.17 2.756a1.5 1.5 0 0 1-1.41 0l-5.17-2.756z"/></svg>'
                                            var aswp_key = document.querySelector('#app > div.overlay > div.top-right > div.buttons.button-bar > div > button:nth-child(1) > span > div')
                                            aswp_key.innerText = 'K'
                                            document.querySelector('#app > div.overlay > div.top-right > div.buttons.button-bar > div > button:nth-child(1)').addEventListener("mousedown", () => {
                                                if (document.querySelector('#app > div.modals-container > div') == null && document.querySelector('#app > div.ui > div').style.display == 'none') {
                                                    toggleAswp()
                                                }
                                            })
                                        }
                                    }
                                }, 500)
                            }
                            createAssetSwapButton()
                            `);

								// remove fullscreen button
								win.webContents.executeJavaScript(`
                            setInterval(function() {
                                if (document.querySelector('div.top-right') != null) {
                                    if (document.querySelector('#app > div.overlay > div.top-right > div.buttons.button-bar > div > button:nth-child(3) > span > svg').innerHTML == '<path d="M5,5H10V7H7V10H5V5M14,5H19V10H17V7H14V5M17,14H19V19H14V17H17V14M10,17V19H5V14H7V17H10Z" data-v-35f7fcad=""></path>') {
                                        document.querySelector('#app > div.overlay > div.top-right > div.buttons.button-bar > div > button:nth-child(3)').remove()
                                    }
                                }
                            }, 500)
                            `);

								//quick chat UI
								win.webContents.executeJavaScript(
									`
                            quickChatTyping = false
                            var qc_div = document.createElement('div')
                            document.querySelector('div.game').insertBefore(qc_div, document.querySelector('div.game').children[0])
                            qc_div.outerHTML = '<div id=quick-chat-container style=display:none><div class="quick-chat row one"><div><p>` +
										qc1 +
										`</div></div><div class="quick-chat row two"><div><p>` +
										qc4 +
										`</div><div><p>` +
										qc2 +
										`</div></div><div class="quick-chat row one"><div><p>` +
										qc3 +
										`</div></div></div>'
                            var quickChatDiv = document.getElementById('quick-chat-container')
                            document.body.addEventListener("mousemove", (e) => {
                                window.mouseX = e.clientX
                                window.mouseY = e.clientY 
                            })
                            window.posSet = false
                            document.body.addEventListener("keydown", (e) => {
                                if (e.key.toLowerCase() == "c" && document.querySelector('#app > div.modals-container > div') == null && document.querySelector('#app > div.ui > div').style.display == 'none' && document.activeElement.localName != 'input') {
                                    if (!posSet) {
                                        quickChatDiv.style.display = "block"
                                        let x = mouseX - 300
                                        let y = mouseY - 150
                                        quickChatDiv.style.transform = 'translate(' + x + 'px, ' + y + 'px)'
                                        window.posSet = true
                                    }
                                }
                            })
                            document.body.addEventListener("keyup", (e) => {
                                if (quickChatTyping == false) {
                                    if (e.key.toLowerCase() == "c") {
                                        quickChatTyping = true
                                        if (document.querySelector('#quick-chat-container > div > div:hover') != null) {
                                            console.log("send_chat_msg: " + document.querySelector('#quick-chat-container > div > div:hover').innerText)
                                        }
                                        else {
                                            quickChatTyping = false
                                        }
                                        quickChatDiv.style.display = "none"
                                        window.posSet = false
                                    }
                                }
                            })
                            `
								);

								//spam chat
								win.webContents.executeJavaScript(
									`
                            if (chatSpamLoop == false) {
                                spamOn = false
                                window.addEventListener("keyup", (e) => {
                                    if (e.key.toLowerCase() == "f" && document.querySelector('#app > div.modals-container > div') == null && document.querySelector('#app > div.ui > div').style.display == 'none' && document.activeElement.localName != 'input') {
                                        spamOn = !spamOn
                                        if (spamOn) {
                                            game.currentScene.showMessagePopup('Chat auto spam on', 1000, 0)
                                        }
                                        else {
                                            game.currentScene.showMessagePopup('Chat auto spam off', 1000, 0)
                                        }
                                    }
                                })
                                setInterval(() => {
                                    if (document.querySelector('div.home-page').style.display == 'none' && spamOn) {
                                        console.log("send_chat_msg: " + "` +
										spam_chat +
										`")
                                    }
                                }, 10000)
                                chatSpamLoop = true
                            }
                            `
								);

								// overlays
								win.webContents.executeJavaScript(`
                            var ctrl_overlay = document.createElement('div')
                            document.querySelector('div.game').insertBefore(ctrl_overlay, document.querySelector('div.game').children[0])
                            ctrl_overlay.outerHTML = '<div id="ctrl-overlay" style="width: 100%;height: 100%;position: absolute;display: block;z-index:10000;pointer-events:none;"></div>'
                            var aim_overlay = document.createElement('hr')
                            document.querySelector('div.game').insertBefore(aim_overlay, document.querySelector('div.game').children[1])
                            aim_overlay.outerHTML = '<hr id="aim-overlay" style="border: 1px #fff dotted;border-image: linear-gradient(to right, #f32d, #f320) 1;transform-origin: left;position: absolute;top: 50%;left: 50%;width: 40vw;display:none;pointer-events:none;">'
                            `);

								//fish levels:
								// 61: goblin shark
								// 93: archerfish
								// 94: sea otter
								// 101: thresher shark
								// 107: beaked whale
								// 109: beluga
								// 113: japanese spider crab
								win.webContents.executeJavaScript(`
                            listForAnimalsWithAimOverlay = [61, 93, 94, 113]
                            listForGamemodesWithAimOverlay = [1, 2, 6]
                            setInterval(function() {
                                if (game.currentScene != null) {
                                    if (game.currentScene.myAnimal != null) {
                                        if (game.currentScene.myAnimal._visibleFishLevel == 101) {
                                            document.getElementById('aim-overlay').style.transform = 'rotate(' + (game.currentScene.myAnimal.inner.rotation*180/Math.PI + 90) + 'deg)'
                                        }
                                        else {
                                            document.getElementById('aim-overlay').style.transform = 'rotate(' + (game.currentScene.myAnimal.inner.rotation*180/Math.PI - 90) + 'deg)'
                                        }
                                    }
                                }
                            }, 10)
                            function showCtrlOverlay(e) {
                                if (e.ctrlKey || e.altKey) {
                                    if (game.currentScene != null) {
                                        if (game.currentScene.myAnimal != null) {
                                            if (game.currentScene.myAnimal._visibleFishLevel != 101) {
                                                document.getElementById('ctrl-overlay').style.pointerEvents = 'all'
                                            }
                                            else if (!e.shiftKey) {
                                                if (game.currentScene.myAnimal._visibleFishLevel == 101)
                                                document.getElementById('ctrl-overlay').style.pointerEvents = 'all'
                                            }
                                            else {
                                                document.getElementById('ctrl-overlay').style.pointerEvents = 'none'
                                            }
                                        }
                                    }
                                }
                            }
                            async function superShot() {
                                game.inputManager.handleLongPress(1)
                                setTimeout(() => {
                                    game.inputManager.handleLongPress(5000)
                                }, 50)
                                setTimeout(() => {
                                    game.inputManager.handleLongPress(5000)
                                }, 100)
                                setTimeout(() => {
                                    game.inputManager.handleLongPress(5000)
                                }, 150)
                                setTimeout(() => {
                                    game.inputManager.handleLongPress(5000)
                                }, 200)
                            }
                            window.addEventListener("keydown",
                                function(e) {
                                    showCtrlOverlay(e)
                                    if (e.ctrlKey && listForAnimalsWithAimOverlay.includes(game.currentScene.myAnimal._visibleFishLevel) && listForGamemodesWithAimOverlay.includes(game.gameMode) && aim_helper_on) {
                                        document.getElementById('aim-overlay').style.display = 'block'
                                    }
                                },
                            false);
                            window.addEventListener("click",
                                function(e) {
                                    if (e.ctrlKey) {
                                        if (e.shiftKey && (game.currentScene.myAnimal._visibleFishLevel == 109 || game.currentScene.myAnimal._visibleFishLevel == 107)) {
                                            console.log('hi')
                                            superShot()
                                        }
                                        else if (e.shiftKey && game.currentScene.myAnimal._visibleFishLevel != 101) {
                                            game.inputManager.handleLongPress(-5)
                                        }
                                        else {
                                            game.inputManager.handleLongPress(5000)
                                        }
                                    }
                                    if (e.altKey) {
                                        game.inputManager.handleLongPress(350)
                                    }
                                },
                            false);
                            window.addEventListener("keyup",
                                function(e) {
                                    if (!e.ctrlKey && !e.altKey) {
                                        document.getElementById('ctrl-overlay').style.pointerEvents = 'none'
                                    }
                                    if (!e.ctrlKey) {
                                        document.getElementById('aim-overlay').style.display = 'none'
                                    }
                                },
                            false);
                            window.addEventListener("focus", () => {
                                document.getElementById('ctrl-overlay').style.pointerEvents = 'none'
                                document.getElementById('aim-overlay').style.display = 'none'
                            })
                            `);

								//matching strings - for utilities
								//removing items from array for unmuting
								win.webContents.executeJavaScript(`
                            function matches(text, partial) {
                                console.log(text)
                                return text.toLowerCase().indexOf(partial.toLowerCase()) > -1;
                            }
                            function arrayRemove(arr, value) { 
                                return arr.filter(function(ele){ 
                                    return ele != value; 
                                });
                            }
                            `);

								//deleting muted chat messages
								win.webContents.executeJavaScript(`
                            setInterval(function() {
                                if (game.currentScene != null) {
                                    for (let i = 0; i < game.currentScene.chatMessages.length; i++) {
                                        if (mutedList.includes(String(game.currentScene.chatMessages[i].originalMessage.senderRoomId))) {
                                            game.currentScene.chatMessages[i].renderable = false
                                        }
                                    }
                                }
                            }, 200)
                            `);

								//show id
								win.webContents.executeJavaScript(`
                            setInterval(() => {
                                if (document.querySelector('#app > div.overlay > div.top-right > div.flex.flex-col > div.info.mb-1.mr-1').childElementCount != 5 || document.querySelector('#app > div.overlay > div.top-right > div.flex.flex-col > div.info.mb-1.mr-1 > div:nth-child(5) > span').innerText != "ID: " + game.currentScene.myAnimal.id) {
                                    if (document.querySelector('#app > div.overlay > div.top-right > div.flex.flex-col > div.info.mb-1.mr-1 > div:nth-child(4)') != null) {
                                        document.querySelector('#app > div.overlay > div.top-right > div.flex.flex-col > div.info.mb-1.mr-1 > div:nth-child(4)').remove()
                                    }
                                    if (document.querySelector('#app > div.overlay > div.top-right > div.flex.flex-col > div.info.mb-1.mr-1 > div:nth-child(4)') != null) {
                                        document.querySelector('#app > div.overlay > div.top-right > div.flex.flex-col > div.info.mb-1.mr-1 > div:nth-child(4)').remove()
                                    }
                                    var id_label = document.querySelector('#app > div.overlay > div.top-right > div.flex.flex-col > div.info.mb-1.mr-1 > div.fps').cloneNode(true)
                                    var id_space = document.querySelector('#app > div.overlay > div.top-right > div.flex.flex-col > div.info.mb-1.mr-1 > div.flex-grow.mx-1').cloneNode(true)
                                    var info_div = document.querySelector('#app > div.overlay > div.top-right > div.flex.flex-col > div.info.mb-1.mr-1')
                                    info_div.appendChild(id_space)
                                    info_div.appendChild(id_label)
                                    id_label.classList = 'fps fps--1'
                                    var id_text = document.querySelector('#app > div.overlay > div.top-right > div.flex.flex-col > div.info.mb-1.mr-1 > div:nth-child(5) > span')
                                    id_text.innerText = 'ID: null'
                                }
                                if (game.currentScene != null) {
                                    id_text.innerText = 'ID: ' + game.currentScene.myAnimal.id
                                }
                            }, 5000)
                            `);
							}
						});
					}
					global.consoleLogScriptRunning = true;

					//custom keybinds
					win.webContents.executeJavaScript(`
            var evo_wheel_rot = 0
            setInterval(function() {
                evo_wheel_rot += 1
            }, 100)
            document.body.addEventListener('keydown', function(e) {
                if (e.key == "Escape") {
                    e.preventDefault()
                    if (document.querySelector('#app > div.ui > div').style.display != 'none') {
                        document.querySelector('div.el-col.el-col-8.is-guttered > button').click()
                    }
                }
                if (e.key == "F11") {
                    console.log("REQUEST_TOGGLE_FULLSCREEN_STATE")
                }
                if (e.key.toLowerCase() == "k") {
                    if (document.querySelector('#app > div.modals-container > div') == null && document.querySelector('#app > div.ui > div').style.display == 'none' && document.activeElement.localName != 'input') {
                        e.preventDefault()
                        toggleAswp()
                    }
                }
            });
            `);

					// show the window after all the scripts finish
					// this is so that the app shows only when the UI in complete
					// if this was shown before everything finished loading,
					// it would make me look noob and unprofessional
					win.show();

					// no u electron xd
					// open all links in the default browser
					// instead of yucky electron windows
					win.webContents.on("new-window", function (e, url) {
						e.preventDefault();
						require("electron").shell.openExternal(url);
					});

					//discord rpc
					var Discord = new Client({
						transport: "ipc"
					});

					// log into the client to get icon and app name
					Discord.login({ clientId: "918680181609213972" }).catch(console.error);
					var startTime = new Date();

					// fallback in-case v5 comes and i am gone
					// at least it will show something
					// Discord.on("ready", () => {
					//     if (rpc) {
					//         Discord.setActivity({
					//             largeImageKey: "icon",
					//             largeImageText: "Deeeep.io",
					//             startTimestamp: startTime,
					//         })
					//     }
					// });

					// update discord rpc
					function setGameMode(mode, menu) {
						//greb url and eats it (jk)
						try {
							var currentUrl = win.webContents.getURL();
						} catch (e) {
							console.log("oops");
						}

						// viewing <user>'s profile
						if (matches(currentUrl, "/u/")) {
							var detailText = "Viewing " + currentUrl.replace("https://beta.deeeep.io/u/", "").replace(/\?host=....../i, "") + "'s profile";
							var labelText = "";
							request("https://apibeta.deeeep.io/users/u/" + currentUrl.replace("https://beta.deeeep.io/u/", "").replace(/\?host=....../i, ""), { json: true }, (error, res, body) => {
								if (error) {
									return console.log(error);
								}
								if (!error && res.statusCode == 200) {
									if (v.includes(body.id)) {
										insertClientOwnerBadge();
									} else if (t.includes(body.id)) {
										insertClientVerifiedBadge();
									}
								}
							});
						}

						// these ones are self-explainatory
						else if (matches(currentUrl, "/forum/")) {
							var detailText = "Visiting the forums";
							var labelText = "";
						} else if (matches(currentUrl, "/store/")) {
							var detailText = "Browsing through the store";
							var labelText = "";
						} else if (matches(currentUrl, "/inventory/")) {
							var detailText = "Checking inventory";
							var labelText = "";
						} else if (menu == "0") {
							var detailText = "In the menus";
							var labelText = "";
						} else if (menu == "1") {
							var detailText = "AFK in " + mode;
							var labelText = "Join game";
						} else if (menu == "2") {
							var detailText = "Playing " + mode;
							var labelText = "Join game";
						}

						// if the gamemode buttons exist, use them to update the status
						if (rpc) {
							if (labelText != "") {
								Discord.setActivity({
									details: detailText,
									largeImageKey: "icon",
									largeImageText: "Deeeep.io",
									startTimestamp: startTime,
									buttons: [{ label: labelText, url: currentUrl }]
								});
							} else {
								Discord.setActivity({
									details: detailText,
									largeImageKey: "icon",
									largeImageText: "Deeeep.io",
									startTimestamp: startTime
								});
							}
						} else {
							Discord.clearActivity();
						}
					}
				});
			});
			extensionsLoaded = true;
		}
		// load the extensions in
        /*
		if (!extensionsLoaded) {
			if (ublock) {
				win.webContents.session.loadExtension(docassetsPath).then(() => {
					win.webContents.session.loadExtension(ublockPath).then(() => {
						setTimeout(() => {
							makeNewWindow();
						}, 100);
					});
				});
			} else {
				win.webContents.session.loadExtension(docassetsPath).then(() => {
					setTimeout(() => {
						makeNewWindow();
					}, 100);
				});
			}
		} else {
			makeNewWindow();
		}
        */
        if (ublock) {
            win.webContents.session.loadExtension(deeeepInjectorPath).then(()=>{
                win.webContents.session.loadExtension(ublockPath).then(()=>{
                    setTimeout(()=>{
                        makeNewWindow();
                    },100);
                })
            })
        } else {
            win.webContents.session.loadExtension(deeeepInjectorPath).then(()=>{
                setTimeout(()=>{
                    makeNewWindow();
                },100);
            });
        }
	};

	// now you actually see it, the win.show() thing was all a lie
	createWindow();
});

// stupid mac os thing idk
app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// kill everything related to the app when you press the close button
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
