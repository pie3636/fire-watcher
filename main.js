var version = "v0.4.1"; 
var currentTab = "play";
var onLoad = false;
var onImport = false;
var onReset = false;
var logTimeout = {};
var logDuration = 10000;
var latestLog = 5;
var numLogs = 5;
var newSave = {};
var gD = {
    tickDuration : 25,
    time: 60,
    timeSpeed: 1,
    firePower: 5,
    brushwoodFatigue: 0,
    fanTheFlamesUses: 0,
    //watchers: 0,
    //watcherPower: 1,
    actions: {},
    currentTab: "play",    
    options: {
        logDuration: 1, //TODO : Make editable
        darkTheme: false,
        autoSave: {
            enabled: setInterval(save, 60000),
            interval: 60000 //TODO : Make editable
        }
    }
}

// Created by ncerminara - https://gist.github.com/ncerminara/11257943

var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}};

/* unlock, cost : Object [~gD]                          Costs of unlocking and buying
 * show : Object [type, tooltip, inside][text]          Items to be displayed
 * effect : function                                    On buying
 * tick : function                                      On tick
 * repeatable : Boolean                                 Peristent
 * nocenter : Boolean                                   Multiline (action)
 * isUpgrade : Boolean                                  In case of unhandled show type
 */
 
var actions = {
    fanTheFlames: {
        repeatable: true,
        show: {
            type: "standardAction",
            tooltip: "Blow air on the fire to make it last a bit longer",
            inside: "Increases the fire duration by <b><span id='firePower'>" + gD.firePower + " seconds</span></b>."
        },
        effect: function() {
            var gain = gD.firePower;
            if (gD.actions.fireMastery.bought) {
                gain += 0.001 * gD.fanTheFlamesUses;
            }
            gD.time += gain;
            gD.fanTheFlamesUses ++;
        },
        tick: function() {
            var gain = gD.firePower;
            if (gD.actions.fireMastery.bought) {
                gain += 0.001 * gD.fanTheFlamesUses;
            }
            $("#firePower").html(timify(gain));
        }
    },
    fetch_Brushwood: {
        unlock: {time: 100},
        cost: {time: 60},
        repeatable: true,
        show: {
            type: "standardAction",
            nocenter: true,
            tooltip: "Take some time to fetch brushwood on the beach, increasing the duration of the fire",
            inside: "Takes <b><span id='fetchBrushwoodLoss'></span></b> to gather brushwood and makes the fire last an additional <b><span id='fetchBrushwoodGain'></span></b>."
        },
        effect: function() {
            gD.brushwoodFatigue = Math.min(300, gD.brushwoodFatigue + 30);
            gD.time += 300 - gD.brushwoodFatigue;
        },
        tick: function() {
            if (gD.brushwoodFatigue >= 0) {
                gD.brushwoodFatigue -= gD.tickDuration/1000;
            }
            actions.fetch_Brushwood.cost.time = 60 + gD.brushwoodFatigue;
            $("#fetchBrushwoodLoss").html(timify(prettify(actions.fetch_Brushwood.cost.time, 0)));
            $("#fetchBrushwoodGain").html(timify(prettify(300 - gD.brushwoodFatigue, 0)));
            var color = (60 + gD.brushwoodFatigue < 300 - gD.brushwoodFatigue ? "#080" : "#800");
            $("#fetchBrushwoodLoss").attr("style", "color:" + color);
            $("#fetchBrushwoodGain").attr("style", "color:" + color);
        }
    },
    exploreTheBeach: {
        unlock: {time: 300},
        cost: {time: 300},
        repeatable: true,
        show: {
            type: "standardAction",
            tooltip: "Explore the immediate surroundings of the fire, and collect what could be useful",
            inside: "Takes <b><span id='exploreTheBeachLoss'>" + timify(300) + "</span></b> to explore the beach and possibly find loot.<br />"
        },
        effect: function() {
            var branchesFound = intRandom(1, 5);
        },
        tick: function() {
        }
    },
    /* ============================================================ UPGRADES ============================================================ */
    pyramidFire: {
        unlock: {time: 100},
        cost: {time: 600},
        isUpgrade: true,
        show: {
            type: "standardUpgrade",
            tooltip : "Fanning the flames is twice as efficient"
        },
        effect: function() {
            gD.firePower *= 2;
        }
    },
    fireMastery: {
        unlock: {fanTheFlamesUses: 50},
        cost: {time: 500},
        isUpgrade: true,
        show: {
            type: "standardUpgrade",
            tooltip : "Your fire skills increase with time. Fan the flames gains 0.001 power with each use"
        },
    }
}

function sumPrices(base, factor, owned, number) {
    var sum = 0;
    for (var i = owned + 1; i <= owned + number; i++) {
        sum += Math.floor(base * Math.pow(factor, i));
    }
    return sum;
}

function timify(input, digits) {
    return Math.floor(1000000000*input)/1000000000 + " seconds"; //TODO : EDIT
}

/*function buyWatcher(number) {
    for (var i = 1; i <= number; i++) {
        var watcherCost = sumPrices(10, 1.1, watchers, 1);
        if(time >= watcherCost) {
            watchers++;
            time -= watcherCost;
            var nextCost = sumPrices(10, 1.1, watchers, 1);
                $("#watchers").html(watchers);
                $("#watcherCost").html(nextCost);
                $("#watcherProduction").html(watcherPower * watchers);
                tooltip(buyWatcher1, "Cost : " + nextCost); //TODO : EDIT
        }
    }
}*/

function tick() {
    gD.time -= gD.timeSpeed * gD.tickDuration/1000;
    //time += watchers * watcherPower * tickDuration/1000;
    $("#time").html(prettify(gD.time, 3));
    for (var i in actions) {
        if (!gD.actions[i].unlocked && compare(actions[i].unlock, gD) || gD.actions[i].unlocked && onLoad && !gD.actions[i].bought) { // If new action unlocked or unlocked in loaded game
            gD.actions[i].unlocked = true;
            var strButton = '<button id=' + i + ' type="button" class="btn btn-default' + (gD.options.darkTheme ? "2" : "") + '" data-toggle="tooltip" data-placement="bottom" title="' + actions[i].show.tooltip + '" data-container="body">';
            switch (actions[i].show.type) { // Display it
            case "standardAction":
                $("#actions").append('\
                    <div id="' + i + 'Div" class="row" style="margin-left:10px">\
                        <div class="col-md-3 col-md-center">\
                            ' + strButton + i.textify() + '</button>\
                        </div>\
                        <div class="col-md-9' + (actions[i].show.nocenter ? '' : ' vcenter') + '">\
                            ' + actions[i].show.inside + '\
                        </div>\
                    </div>\
                    <hr id="' + i + 'HR"' + (gD.options.darkTheme ? 'class="HR2"' : "") + ' />');
                break;
            case "standardUpgrade":
                $("#upgrades").append(
                        strButton + i.textify() + ' ' + cost(i) + '</button>');
                $("#" + i).css("margin-right", 10);
                break;
            default:
                $(actions[i].isUpgrade ? "#upgrades" : "#actions").after(actions[i].show.text);
                break;
            }
            if (actions[i].show.type == "standardAction" || actions[i].show.type == "standardUpgrade") { // Fix to prevent constant focus after clicking
                $("#" + i).tooltip().mouseup(toBlur).hover(themeTooltip); // Changes tooltip theme as needed
                $("#" + i).on('click', function(_i){
                    return function() { // Clooooooosure :D
                        buyUpgrade(_i);
                    };
                }(i));
            }
        }
        var greyOut = "greyedOut" + (gD.options.darkTheme ? "2" : "");
        if (!$("#" + i + ":hover").length) {
            if(gD.actions[i].unlocked && !compare(actions[i].cost, gD)) { // Each action unlocked : grey if and only if not affordable
                if (!$("#" + i).hasClass(greyOut)) {
                    $("#" + i).addClass(greyOut);
                }
            } else {
                $("#" + i).removeClass(greyOut);
            }
        } else {
            $("#" + i).removeClass(greyOut);
        }
        if(typeof actions[i].tick !== 'undefined' && (!onLoad || gD.actions[i].unlocked)) { // && (!actions[i].tickIfBought || gD.actions[i].bought) && (!actions[i].tickIfUnlocked || gD.actions[i].unlocked)) { // No tick if loading game and not unlocked
            actions[i].tick();
        }
        
    }
    onLoad = false;
    /* greyOut("buyWatcher1", time >= sumPrices(10, 1.1, watchers, 1));
    greyOut("buyWatcher2", time >= sumPrices(10, 1.1, watchers, 10));
    greyOut("buyWatcher3", time >= sumPrices(10, 1.1, watchers, 100)); */
}

function buyUpgrade(upgrade, isOnLoad) { // isOnLoad => deletion
    if (isOnLoad || !gD.actions[upgrade].bought && compare(actions[upgrade].cost, gD, true)) { // First condition isn't mandatory
        if (typeof actions[upgrade].effect !== 'undefined' && !isOnLoad) {
            actions[upgrade].effect();
        }
        if (!actions[upgrade].repeatable || isOnLoad) {
            gD.actions[upgrade].bought = true;
            switch (actions[upgrade].show.type) {
                case "standardAction":
                    $("#" + upgrade).tooltip('hide');
                    $("#" + upgrade + "Div").remove();
                    $("#" + upgrade + "HR").remove();
                    break;
                case "standardUpgrade":
                    $("#" + upgrade).tooltip('hide');
                    $("#" + upgrade).remove();
                    break;
                default:
                    console.log("ERROR");
                    break;
            }
        }
    }
}

function cost(upgrade) {
    return '(' + actions[upgrade].cost.time + ')'; //TODO : Modifier
}

function compare(cost, data, doSub, subStep) { // Returns (cost <= data), data -= cost if doSub, subStep means toplevel (nested objects)
    var ret = true;
    if(!subStep) {
        for (var i in cost) {
            switch (typeof cost[i]) {
                case "number":
                    ret = cost[i] <= data[i];
                    break;
                case "boolean":
                    ret = cost[i] == data[i];
                    break;
                case "object":
                    ret = compare(cost[i], data[i], false); // doSub == false => compare only
                    break;
                case "undefined":
                default:
                    break;
            }
            if (!ret) return false;
        }
    }
    if (doSub) { // Can only possibly happen at toplevel
        for (var i in cost) {
            switch (typeof cost[i]) {
                case "number":
                    data[i] -= cost[i];
                    break;
                case "object":
                    ret = compare(cost[i], data[i], true, true); // Transmit doSub, skip first step
                case "boolean":
                case "undefined":
                default:
                    break;
            }
        }
    }
    return true;
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

function show(id) { //TODO : Remove if unused
    $("#" + id).css("display", "block");
}

function hide(id) { //TODO : Remove if unused
    $("#" + id).css("display", "none");
}

function greyOut(id, back, theme) {
    $("#" + id).css("background-color", (back ? (theme ? "#000" : "#fff") : (theme ? "#222" : "#eee")));
}

function tooltip(id, title, show) { //TODO : Remove if unused
    show = (typeof show === 'undefined' ? true : show);
    $("#" + id).attr("title", title).tooltip('fixTitle');
    if (show) $("#" + id).tooltip('show');
}

function intRandom(min, max) {
    return 1 + Math.round(Math.random()*(max-min));
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

function changeTab(newTab) {
    $("#nav_" + gD.currentTab).parent().removeClass("active");
    $("#nav_" + newTab).parent().addClass("active");
    hide(gD.currentTab);
    show(newTab);
    gD.currentTab = newTab;
}

function setTheme() {
    var fg = (gD.options.darkTheme ? "#000" : "#FFF");
    if (gD.options.darkTheme) {
        $("#navbar, #logger").removeClass("navbar-inverse");
        $(".btn-default2").not(document.getElementById("importNow")).removeClass("btn-default2").addClass("btn-default");
        $(".split-left2").removeClass("split-left2").addClass("split-left");
        $("hr").removeClass("HR2");
        $(".btn").removeClass("greyedOut2");
        $(".navbar-fixed-bottom").css("color", "#777");
        $(".navbar-fixed-bottom").css("text-shadow", "0 1px 0 rgba(255, 255, 255, .25)");
        $("#logger").css("background-color", "#eee");
    } else {
        $("#navbar, #logger").addClass("navbar-inverse");
        $(".btn-default").not(document.getElementById("importNow")).removeClass("btn-default").addClass("btn-default2");
        $(".split-left").removeClass("split-left").addClass("split-left2");;
        $("hr").addClass("HR2");
        $(".btn").removeClass("greyedOut");
        $(".navbar-fixed-bottom").css("color", "#9d9d9d");
        $(".navbar-fixed-bottom").css("text-shadow", "0 -1px 0 rgba(0, 0, 0, .25)");
        $("#logger").css("background-color", "#111");
    }
    $("body").css("background-color", (gD.options.darkTheme ? "#FFF" : "#000"));
    $("body").css("color", fg);
    gD.options.darkTheme = !gD.options.darkTheme;
}

function log(str) {
    var d = new Date;
    var date = "<span style='color:#700'>[" + prettify(d.getHours(), 0, 2) + ":" + prettify(d.getMinutes(), 0, 2) + ":" + prettify(d.getSeconds(), 0, 2) + "." + prettify(d.getMilliseconds(), 0, 3) + "]</span> ";
    latestLog = Math.min(numLogs, latestLog + 1);
    clearTimeout(logTimeout["l" + numLogs]);
    for (var i = numLogs; i > 1; i--) {
        $("#l" + i).html($("#l" + (i - 1)).html());
        if ($("#l" + (i - 1)).css("font-weight") == "bold") {
            $("#l" + i).css("color", (gD.options.darkTheme ? "#FF0" : "#08F")).css("font-weight", "bold");
            logTimeout["l" + i] = logTimeout["l" + (i - 1)];
        }
    }
    $("#l1").html(date + str);
    $("#l1").css("color", (gD.options.darkTheme ? "#FF0" : "#08F")).css("font-weight", "bold");
    logTimeout.l1 = setTimeout(unhighlightLastLog, logDuration); //TODO : Transition, bitstorm?
}

function unhighlightLastLog() {
    $("#l" + latestLog).css("color", (gD.options.darkTheme ? "#9d9d9d" : "#777")).css("font-weight", "normal");
    latestLog--;
}

function clearLogs() {
    for (var i = 1; i <= numLogs; i++) {
        clearTimeout(logTimeout["l" + i]);
        $("#l" + i).html("");
    }
}

function autoSave() {
    if (gD.options.autoSave.enabled) {
        clearInterval(gD.options.autoSave.enabled);
        gD.options.autoSave.enabled = 0;
    } else {
        gD.options.autoSave.enabled = setInterval(save, gD.options.autoSave.interval);
    }
}

function save() {
    localStorage.setItem("save", JSON.stringify(gD));
    log("Game saved");
}

function load() {
    onLoad = true; // Restore actions on next tick
    var saveTheme = gD.options.darkTheme;
    for (var i in gD.actions) {
        if (gD.actions[i].unlocked) {
            buyUpgrade(i, true); // Delete everything
        }
    }
    if (onReset) {
        gD = JSON.parse(localStorage.getItem("initValues"));
        gD.currentTab = "opt"; // Needed to change tab
        changeTab("play");
        log("Game resetted!");
    } else if (onImport) {
        loadRec(newSave, gD);
        gD.currentTab = "opt";
        changeTab("play");
        log("Succesfully imported savefile.")
    } else {
        clearLogs();
        loadRec(JSON.parse(localStorage.getItem("save")), gD);
        if (localStorage.getItem("save") != localStorage.getItem("initValues")) {
            log("Game loaded.");
        }
    }
    onReset = false;
    onImport = false;
    if(saveTheme != gD.options.darkTheme) {
        $("#darkTheme").prop("checked", !saveTheme);
        gD.options.darkTheme = saveTheme;
        setTheme(); // Changes theme from gD.options.saveTheme to its opposite
    }
}

function loadRec(save, data) {
    for (var i in save) {
        switch (typeof save[i]) {
            case "number":
            case "boolean":
                data[i] = save[i];
                break;
            case "object":
                if (typeof data[i] !== 'undefined') {
                    loadRec(save[i], data[i]);
                }
                break;
            case "undefined":
            default:
                break;
        }
    }
}

function toBlur() { // Lose focus
    $(this).blur();
}

function themeTooltip() {
    changeTooltipColorTo((gD.options.darkTheme ? "#FFF" : "#000"), (gD.options.darkTheme ? "#000" : "#FFF"));
}

function wipe() {
    onReset = true;
    load();
}

function exportSave() {
    $("#containerExport").html(Base64.encode(JSON.stringify(gD)));
    $("#containerExport").focus();
}

function importSaveRec() {
    try {
        newSave = JSON.parse(Base64.decode($('#containerImport').val()));
        $('#importGame').modal('hide'); // Doesn't happen if error
    }
    catch(err) {
        $("#importError").css("display", "block"); // Error message
        return false;
    }
    return true;
}

function importSave() {
    $("#containerImport").focus();
    if (importSaveRec()) {
        onReset = true; // Set minimal values
        load();
        onImport = true;
        load();
    }  
}

function changeTooltipColorTo(color, fgcolor) {
    $(".tooltip-inner").css("background-color", color).css("color", fgcolor);
    $(".tooltip.top .tooltip-arrow").css("border-top-color", color);
    $(".tooltip.right .tooltip-arrow").css("border-right-color", color);
    $(".tooltip.left .tooltip-arrow").css("border-left-color", color);
    $(".tooltip.bottom .tooltip-arrow").css("border-bottom-color", color);
}

$(function () {
    for (var i in actions) {
        gD.actions[i] = {unlocked: false, bought: false};
    }
    localStorage.setItem("initValues", JSON.stringify(gD));
    load();
    $("#version").append(version);
    $("#darkTheme").change(setTheme).prop("checked", gD.options.darkTheme);
    $("#autoSave").change(autoSave).prop("checked", gD.options.autoSave.enabled);
    $("#saveSave").tooltip().mouseup(toBlur).hover(themeTooltip).click(save);
    $("#loadSave").tooltip().mouseup(toBlur).hover(themeTooltip).click(load);
    $("#deleteSave").tooltip().mouseup(toBlur).hover(themeTooltip).click(function() {
        localStorage.setItem("save", JSON.stringify(JSON.parse(localStorage.getItem("initValues"))));
        log("Savefile successfully deleted.");
    });
    $("#wipeSave").tooltip().mouseup(toBlur).hover(themeTooltip).click(wipe);
    $("#exportSave").tooltip().mouseup(toBlur).hover(themeTooltip).click(exportSave).attr("data-toggle", "modal").attr("data-target","#exportGame").focus(toBlur);
    $("#importSave").tooltip().mouseup(toBlur).hover(themeTooltip).attr("data-toggle", "modal").attr("data-target","#importGame").focus(toBlur); // Or it stays focused after the modal is closed
    $("#importNow").tooltip().mouseup(toBlur).click(importSave);
    $('.modal').on('show.bs.modal', centerModal);
    $(window).on("resize", function() {
        $('.modal:visible').each(centerModal);
    });
    $('#exportGame').on('shown.bs.modal', function() { // Select and focus text
        $('#containerExport').focus().select();
    });
    $('#importGame').on('hidden.bs.modal', function() {
        $("#importError").css("display", "none");
    });
    $('#importGame').on('shown.bs.modal', function() {
        $('#containerImport').focus();
    });
    for(var i = 1; i <= numLogs; i++) {
        $("#l" + i).css("color", (gD.options.darkTheme ? "#FF0" : "#08F")).css("font-weight", "bold");
        logTimeout["l" + i] = setTimeout(unhighlightLastLog, 1000 + 1000 * i);
    }
    setTimeout(function(){log("This is just a test, but if you see it, it means you've spent at least 60 seconds playing. Given the fact that there's basically nothing to do, either you're a bugtracker, or you must be really bored.")}, 60000);
});

window.setInterval(tick, gD.tickDuration);

function centerModal() {
    $(this).css('display', 'block');
    var $dialog = $(this).find(".modal-dialog").css("margin-top", offset);;
    var offset = ($(window).height() - $dialog.height()) / 2;
    $dialog.css("margin-top", offset);
}
