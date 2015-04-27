// Created by ncerminara - https://gist.github.com/ncerminara/11257943
var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}};

function sumPrices(base, factor, owned, number) {
    var sum = 0;
    for (var i = owned + 1; i <= owned + number; i++) {
        sum += Math.floor(base * Math.pow(factor, i));
    }
    return sum;
}

function timify(input, digits, keepZeros, nonTime) { // TODO Add options : rough (~ 3 hours), horloge (YYYY:DD:HH:MM:SS.mmm) -> reuse in log etc
    digits = set(digits, 0);
    var out = prettify(input, digits, 0);
    if (out < 300 && !nonTime) {
        return out + " seconds";
    } else if (!nonTime) {
        var outmin = Math.floor(out/60);
        out = out % 60;
        if (outmin <= 59) {
            return outmin + " min" + (out >= 1 && !keepZeros ? " " + Math.floor(out) + " sec" : "");
        } else {
            var outhour = Math.floor(outmin/60);
            outmin = outmin % 60;
            if (outhour <= 9999999) {//47) {
                return outhour + " hr" + (outmin >= 1 && !keepZeros ? " " + Math.floor(outmin) + " min" : "") + (out >= 1 && !keepZeros ? " " + Math.floor(out) + " sec" : "");
            }
        }
    }
    return out;
}

function set(x, val) {
    return (typeof x === 'undefined' ? val : x);
}

function timifyall(out, shortness, precision, digits, timeLike, space, extraZeros, keepZeros, extraSpace) {
    var choice = 1; // $("#timeFormatting option:selected").prevAll().size();
    timeLike = set(timeLike, true);
    precision = set(precision, 3);
    extraSpace = set(extraSpace, true);
    extraZeros = set(extraZeros, choice == 0 && shortness);
    digits = set(digits, 3);
    shortness = set(shortness, 0);
    space = set(space, shortness <= 1 && choice != 3 && choice != 2 || shortness == 0);
    keepZeros = set(keepZeros, false);
    var timeUnits = [["second", "sec", "s", 60], ["minute", "min", "m", 60], ["hour", "hr", "h", 24], ["day", "day", "d", 365], ["year", "yr", "y", 1e3], ["millennium", "mil", "M"]];
    var SIUnits = [["yocto", "y"], ["zocto", "z"], ["atto", "a"], ["femto", "f"], ["pico", "p"], ["nano", "n"], ["micro", "µ"], ["milli", "m"], ["unit", "u"], ["kilo", "k"], ["mega", "M"], ["giga", "G"], ["tera", "T"], ["peta", "P"], ["exa", "E"], ["zetta", "Z"], ["yotta", "Y"]];
    var mathUnits = [["", ""],  ["kilo", "K"],  ["million", "M"],  ["billion", "B"],  ["trillion", "T"],  ["quadrillion", "Qa", "Q"],  ["quintillion", "Qi"],  ["sextillion", "Sx", "S"],  ["septillion", "Sp"],  ["octillion", "Oc", "O"],  ["nonillion", "No", "N"],  ["decillion", "Dc", "D"]];
    var alphaUnits = "zyxwvutsrqponmlkjihgfedcbaøABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var outsave = 1;
    var data, start, sec;
    var pos = [];
    switch (choice) {
        case 0:
            data = timeUnits;
            start = 1;
            break;
        case 1:
            data = SIUnits;
            start = 1e24;
            break;
        case 2:
            data = mathUnits;
            start = 1;
            break;
        case 3:
            data = alphaUnits;
            start = 1e78;
            break;
        case 4:
            return out.toExponential();
            break;
    }
    switch (shortness) {
        case 0:
            sec = "seconds";
            break;
        case 1:
            sec = "sec";
            break;
        default:
            sec = "s";
            break;
    }
    sec = (timeLike && choice ? (choice >= 1 && space || choice == 3 ? " " : "") + sec : "")
    var str = "";
    var n = data.length - 1;
    out *= start;
    for (var i = 0; i <= n && outsave >= 1; i++) {
        var N = data[i].length - 1;
        var div = data[i][data[i].length - 1];
        var str2 = "";
        if (i == data.length - 1) {
            div = Infinity;
        } else if (choice) {
            div = 1e3;
        }
        var cur = (i ? Math.floor(out % div) : (out % div).toFixed(digits));
        if (extraZeros && i != n && out >= div) {
            for (var j = 4; j >= 1; j--) {
                var k = Math.pow(10, j);
                str2 += (cur < k && k < div ? "0" : "");
            }
        }
        str = ((cur || keepZeros) != 0 ? str2 + cur + (choice || i != 5 || cur < 2 || shortness ? (space ? " " : "") + (choice == 3 ? data[i] : data[i][Math.min(shortness, N - (typeof data[i][N] === 'string' ? 0 : 1))]) + (choice || cur <= 1 || shortness || cur < 2 && i == n ? "" : "s") : (space ? " " : "") + "millennia") + (i && extraSpace ? " " : "") : "") + str; // The '!= 0' is mandatory, for some reason
        if (cur) {
            pos.push(str.length);
        }
        out /= div;
        outsave = out;
    }
    str = str.replace("  ", " ");
    return (precision >= pos.length ? str + sec : str.substr(0, str.length - pos[pos.length - precision - 1] - (extraSpace ? 1 : 0)) + sec);
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
    return '(' + timify(actions[upgrade].cost.time) + ')';
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

function countUpgrades() {
    var total = 0;
    for (var i in actions) {
        if (actions[i].show.type == "upgrade") { //TODO : Change eventually, or global variable
            total++;
        }
    }
    return total;
}

function countAchievements() {
    var total = 0;
    for (var i in actions) {
        if (actions[i].show.type == "achievement") { //TODO : Change eventually, or global variable
            total++;
        }
    }
    return total;
}

function setStats(str, data) {
    for (var i in data) {
        if (typeof data[i] === "object") {
            setStats(str + "_" + i, data[i]);
        } else {
            $(str + "_" + i).html((~i.toLowerCase().indexOf("time") ? timify(data[i], 2) : data[i]));   
        }
    }
}

function gainTime(n)
{
    gD.time += n;
    gD.stats.timeGained += n;
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
    $(this).show();
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

