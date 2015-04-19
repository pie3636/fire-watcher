// Created by ncerminara - https://gist.github.com/ncerminara/11257943
var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}};

function sumPrices(base, factor, owned, number) {
    var sum = 0;
    for (var i = owned + 1; i <= owned + number; i++) {
        sum += Math.floor(base * Math.pow(factor, i));
    }
    return sum;
}

function timify(input, digits) { // TODO Add options : rough (~ 3 hours), long (3 hours 5 minutes 43 seconds), scientific (1e+02s), prefixes, horloge (00:05:17.123)->reuse in log etc
    digits = (typeof digits === 'undefined' ? 0 : digits); //TODO : Use Date package, + options pour afficher temps complets/non disp si 0 (1h 3s)/autres -> short mid long (3s 3 sec 3 seconds), + precision, default = 2 (H:M, M:S; etc), use extra units. Units = SMHDMYCM, SMHDWMYQCM (Q = bissextiles), yzafpnµmskMGTPEZY, dnosxfqtbµm.KMBTQFXSOND, z..aA..Z
    var out = prettify(input, digits, 0);
    if (out <= 300) {
        return out + " seconds";
    } else {
        var outmin = Math.floor(out/60);
        out = out % 60;
        if (outmin <= 59) {
            return outmin + " min " + Math.floor(out) + " sec";
        } else {
            var outhour = Math.floor(outmin/60);
            outmin = outmin % 60;
            if (outhour <= 47) {
                return outhour + " hr " + outmin + " min"
            }
        }
    }
}

function validateNumber(callback) {
    return function(e) {
        if ($.inArray(e.keyCode, [43, 8, 9, 27, 13, 110, 190, 35, 36, 37, 38, 39, 40, 46]) !== -1 || e.ctrlKey === true && $.inArray(e.keyCode, [65, 67, 68]) !== -1) { // Ctrl A, C, X. 37-40 = arrow keys
            setTimeout(validateBounds(callback, this), 100); // Necessary, otherwise the value doesn't update (autoSaveTimer)
            return;
        }
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105) || Number($("#" + this.id).val()) > this.max) {
            e.preventDefault();
        }
    setTimeout(validateBounds(callback, this), 100);
    };
}

function validateBounds(callback, ptr) {
    return function() {
        if (Number($("#" + ptr.id).val()) < ptr.min) {
            $("#" + ptr.id).val(ptr.min);
        }
        if (Number($("#" + ptr.id).val()) > ptr.max) {
            $("#" + ptr.id).val(ptr.max);
        }
        callback();
    };
}

function cost(upgrade) {
    return '(' + actions[upgrade].cost.time + ')'; //TODO : Modifier
}

function prettify(input, digits, before) {
    var out = input.toFixed((typeof digits === 'undefined' ? 9 : digits));
    var str = "";
    before = (typeof before === 'undefined' ? 0 : before);
    for (var i = 1; i < before; i++) {
        if(input < Math.pow(10, i)) {
            str += "0";
        }
    }
    return str + out;
}

function show(id) {
    $("#" + id).css("display", "block");
}

function hide(id) {
    $("#" + id).css("display", "none");
}

function greyOut(id, back, theme) {
    $("#" + id).css("background-color", (back ? (theme ? "#000" : "#fff") : (theme ? "#222" : "#eee")));
}

function tooltip(id, title, show) {
    show = (typeof show === 'undefined' ? true : show);
    $("#" + id).attr("title", title).tooltip('fixTitle');
    if (show) $("#" + id).tooltip('show');
}

function intRandom(min, max) {
    return 1 + Math.round(Math.random()*(max-min));
}

function countActions() {
    var total = 0;
    for (var i in actions) {
        if (actions[i].repeatable) { //TODO : Change eventually, or global variable
            total++;
        }
    }
    return total;
}

String.prototype.textify = function() { // camelCaseObject,AnotherAnd_Escaping_or_Not__ -> Camel case object, another and Escapingor Not_
    var res = "";
    var up = false;
    if (this == "") {
        return "";
    }
    var curWord = this[0].toUpperCase();
    for (var i = 1; i < this.length; i++) {
        if(this[i] == '_') {
            res += curWord;
            curWord = (up ? "_" : "");
            up = !up;
        }
        else if(this.charCodeAt(i) >= 65 && this.charCodeAt(i) <= 90) {
            res += curWord + " ";
            curWord = (up ? this[i].toUpperCase() : this[i].toLowerCase());
            up = false;
        }
        else {
            curWord += this[i];
            up = false;
        }
    }
    return res + curWord;
}

function centerModal() {
    $(this).css('display', 'block');
    var $dialog = $(this).find(".modal-dialog").css("margin-top", offset);;
    var offset = ($(window).height() - $dialog.height()) / 2;
    $dialog.css("margin-top", offset);
}

function toBlur() { // Lose focus
    $(this).blur();
}

function themeTooltip() {
    changeTooltipColorTo((gD.options.darkTheme ? "#FFF" : "#000"), (gD.options.darkTheme ? "#000" : "#FFF"));
}

function changeTooltipColorTo(color, fgcolor) {
    $(".tooltip-inner").css("background-color", color).css("color", fgcolor);
    $(".tooltip.top .tooltip-arrow").css("border-top-color", color);
    $(".tooltip.right .tooltip-arrow").css("border-right-color", color);
    $(".tooltip.left .tooltip-arrow").css("border-left-color", color);
    $(".tooltip.bottom .tooltip-arrow").css("border-bottom-color", color);
}
