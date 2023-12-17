var code = '(' + function() {
    const old = Function.prototype.bind;
    let hookedname;
    const bind = function(...args) {
        if (args[0]&&Object.prototype.hasOwnProperty.call(args[0],"currentScene")) {
            console.warn("%c[TheJ Injector] Logged game object.","color:#ff4d36;font-size:200%");
            window.game = args[0];
            (()=>{
                if (hookedname) return;
                hookedname = true;
                const olddr = game.socketManager.doRequest;
                game.socketManager.doRequest = (...a) => {
                    if(a[0]==6||a[0]==8) {
                        a[1] = a[1].replaceAll(/\\n/g,"\n").replaceAll(/\\t/g,"\t");
                    }
                    return olddr(...a);
                }
            })();
        }
        return old.apply(this,args)
    }
    Function.prototype.bind = bind;
} + ')();'
var script = document.createElement('script')
script.textContent = (()=>{return code})()
document.documentElement.appendChild(script)